// Gestion des utilisateurs staff (admin/manager/vendeur) — réservé aux admins.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "manager" | "vendeur";
type Action = "list" | "create" | "update" | "delete" | "set_password" | "set_roles" | "set_blocked";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    // Auth: décoder le JWT manuellement (signing-keys ES256, getUser ne fonctionne pas côté serveur)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Non authentifié" }, 401);

    let callerId: string | undefined;
    let callerEmail: string | undefined;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      callerId = payload.sub;
      callerEmail = payload.email;
      if (payload.exp && Date.now() / 1000 > payload.exp) return json({ error: "Session expirée" }, 401);
    } catch {
      return json({ error: "Token invalide" }, 401);
    }
    if (!callerId) return json({ error: "Session invalide" }, 401);
    const caller = { id: callerId, email: callerEmail };

    const { data: callerRoles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    const isAdmin = (callerRoles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "Réservé aux administrateurs" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action as Action;

    if (action === "list") {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
      const users = list?.users ?? [];
      const ids = users.map((u) => u.id);
      const { data: rolesRows } = await admin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const rolesByUser = new Map<string, Role[]>();
      (rolesRows ?? []).forEach((r: any) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role); rolesByUser.set(r.user_id, arr);
      });
      const result = users.map((u) => ({
        id: u.id,
        email: u.email,
        display_name: u.user_metadata?.display_name ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned_until: (u as any).banned_until ?? null,
        roles: rolesByUser.get(u.id) ?? [],
      }));
      return json({ users: result });
    }

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const display_name = String(body.display_name || "");
      const roles = (body.roles as Role[]) ?? ["vendeur"];
      if (!email || password.length < 6) return json({ error: "Email + mot de passe (min 6) requis" }, 400);
      const { data: created, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { display_name },
      });
      if (error) throw error;
      const uid = created.user!.id;
      if (roles.length) {
        await admin.from("user_roles").insert(roles.map((r) => ({ user_id: uid, role: r })));
      }
      return json({ success: true, user_id: uid });
    }

    if (action === "update") {
      const user_id = String(body.user_id || "");
      const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
      const display_name = body.display_name !== undefined ? String(body.display_name) : undefined;
      if (!user_id) return json({ error: "user_id requis" }, 400);
      const updates: any = {};
      if (email) updates.email = email;
      if (display_name !== undefined) updates.user_metadata = { display_name };
      const { error } = await admin.auth.admin.updateUserById(user_id, updates);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "set_password") {
      const user_id = String(body.user_id || "");
      const password = String(body.password || "");
      if (!user_id || password.length < 6) return json({ error: "user_id + password (min 6) requis" }, 400);
      const { error } = await admin.auth.admin.updateUserById(user_id, { password });
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "set_roles") {
      const user_id = String(body.user_id || "");
      const roles = (body.roles as Role[]) ?? [];
      if (!user_id) return json({ error: "user_id requis" }, 400);
      // Empêcher la suppression du dernier admin
      if (!roles.includes("admin")) {
        const { count } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
        const { data: current } = await admin.from("user_roles").select("role").eq("user_id", user_id).eq("role", "admin").maybeSingle();
        if (current && (count ?? 0) <= 1) return json({ error: "Impossible de retirer le dernier admin" }, 400);
      }
      await admin.from("user_roles").delete().eq("user_id", user_id);
      if (roles.length) {
        await admin.from("user_roles").insert(roles.map((r) => ({ user_id, role: r })));
      }
      return json({ success: true });
    }

    if (action === "set_blocked") {
      const user_id = String(body.user_id || "");
      const blocked = !!body.blocked;
      if (!user_id) return json({ error: "user_id requis" }, 400);
      if (user_id === caller.id && blocked) return json({ error: "Vous ne pouvez pas vous bloquer vous-même" }, 400);
      // ban_duration: "876000h" (~100 ans) pour bloquer, "none" pour débloquer
      const { error } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: blocked ? "876000h" : "none",
      } as any);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete") {
      const user_id = String(body.user_id || "");
      if (!user_id) return json({ error: "user_id requis" }, 400);
      if (user_id === caller.id) return json({ error: "Vous ne pouvez pas vous supprimer vous-même" }, 400);
      // Empêcher suppression du dernier admin
      const { data: targetRoles } = await admin.from("user_roles").select("role").eq("user_id", user_id);
      const isTargetAdmin = (targetRoles ?? []).some((r: any) => r.role === "admin");
      if (isTargetAdmin) {
        const { count } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
        if ((count ?? 0) <= 1) return json({ error: "Impossible de supprimer le dernier admin" }, 400);
      }
      await admin.from("user_roles").delete().eq("user_id", user_id);
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return json({ error: msg }, 500);
  }

  function json(body: any, status = 200) {
    return new Response(JSON.stringify(body), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
