// Bootstrap / réinitialise le compte admin BABYCENTER.
// Si l'utilisateur existe déjà, on remet son mot de passe + on garantit le rôle admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const display_name = String(body.display_name || "Admin");

    if (!email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "email + password (min 6) requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);

    let userId: string;
    if (existing) {
      userId = existing.id;
      // Reset password + confirm email
      await admin.auth.admin.updateUserById(userId, {
        password, email_confirm: true, user_metadata: { display_name },
      });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { display_name },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    await admin.from("user_roles").upsert(
      { user_id: userId, role: "admin" }, { onConflict: "user_id,role" },
    );

    return new Response(JSON.stringify({ success: true, user_id: userId, email, password_reset: !!existing }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
