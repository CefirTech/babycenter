// Bootstrap / réinitialise le compte admin BABYCENTER.
// Protégé par BOOTSTRAP_SECRET (variable d'environnement Supabase).
// Si l'utilisateur existe déjà, on remet son mot de passe + on garantit le rôle admin.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const BOOTSTRAP_SECRET = Deno.env.get("BOOTSTRAP_SECRET");

    const body = await req.json().catch(() => ({}));

    // Guard: require secret token unless no admins exist yet (first-run)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    if (BOOTSTRAP_SECRET) {
      const provided = String(body.secret ?? "");
      if (!provided || provided !== BOOTSTRAP_SECRET) {
        return json({ error: "Accès non autorisé" }, 403);
      }
    } else {
      // If no BOOTSTRAP_SECRET set, only allow if zero admins exist (first boot)
      const { count } = await admin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) > 0) {
        return json({ error: "BOOTSTRAP_SECRET requis pour cette opération" }, 403);
      }
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const display_name = String(body.display_name || "Admin");

    if (!email || !password || password.length < 8) {
      return json({ error: "email + password (min 8 caractères) requis" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: "Adresse email invalide" }, 400);
    }

    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);

    let userId: string;
    let passwordReset = false;

    if (existing) {
      userId = existing.id;
      passwordReset = true;
      await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    return json({ success: true, user_id: userId, email, password_reset: passwordReset });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return json({ error: msg }, 500);
  }
});
