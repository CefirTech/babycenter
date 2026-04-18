// Bootstrap the first admin account for BABYCENTER.
// Idempotent: if a user with the email already exists, only ensures the admin role is assigned.
// Once at least one admin exists, this function refuses to create new admins.
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

    if (!email || !password || password.length < 8) {
      return new Response(JSON.stringify({ error: "email + password (min 8) requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if any admin already exists
    const { count: adminCount, error: countErr } = await admin
      .from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    if (countErr) throw countErr;

    // Try to find existing user by email
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);

    let userId: string;
    if (existing) {
      userId = existing.id;
    } else {
      if ((adminCount ?? 0) > 0) {
        return new Response(JSON.stringify({ error: "Un admin existe déjà. Utilisez l'admin existant pour créer d'autres comptes." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { display_name },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    // Ensure admin role
    const { error: roleErr } = await admin.from("user_roles").upsert(
      { user_id: userId, role: "admin" }, { onConflict: "user_id,role" },
    );
    if (roleErr) throw roleErr;

    return new Response(JSON.stringify({ success: true, user_id: userId, email }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
