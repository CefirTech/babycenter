// Gestion des utilisateurs staff (admin/manager/vendeur) — réservé aux admins.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "manager" | "vendeur";
type Action = "list" | "create" | "update" | "delete" | "set_password" | "set_roles" | "set_blocked";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    // Auth: verify JWT via getUser() (server-side verification, not manual decode)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Non authentifié" }, 401);

    // Use anon client with the caller's token to verify it server-side
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !callerUser) return json({ error: "Session invalide ou expirée" }, 401);

    const callerId = callerUser.id;

    // Check admin role
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isAdmin = (callerRoles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) return json({ error: "Réservé aux administrateurs" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action as Action;

    if (action === "list") {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
      const users = list?.users ?? [];
      const ids = users.map((u) => u.id);
      const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
      const { data: rolesRows } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", safeIds);
      const { data: profilesRows } = await admin
        .from("profiles")
        .select("user_id, avatar_url, display_name")
        .in("user_id", safeIds);

      const rolesByUser = new Map<string, Role[]>();
      (rolesRows ?? []).forEach((r: { user_id: string; role: Role }) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      const profileByUser = new Map<string, { display_name?: string; avatar_url?: string }>();
      (profilesRows ?? []).forEach((p: { user_id: string; display_name?: string; avatar_url?: string }) =>
        profileByUser.set(p.user_id, p)
      );

      const result = users.map((u) => {
        const p = profileByUser.get(u.id);
        return {
          id: u.id,
          email: u.email,
          display_name: p?.display_name ?? (u.user_metadata as Record<string, string>)?.display_name ?? null,
          avatar_url: p?.avatar_url ?? (u.user_metadata as Record<string, string>)?.avatar_url ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          banned_until: (u as unknown as { banned_until?: string }).banned_until ?? null,
          roles: rolesByUser.get(u.id) ?? [],
        };
      });
      return json({ users: result });
    }

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const display_name = String(body.display_name || "");
      const avatar_url = body.avatar_url ? String(body.avatar_url) : null;
      const roles = (body.roles as Role[]) ?? ["vendeur"];
      if (!email || password.length < 6) {
        return json({ error: "Email + mot de passe (min 6) requis" }, 400);
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return json({ error: "Adresse email invalide" }, 400);

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name, avatar_url },
      });
      if (error) throw error;
      const uid = created.user!.id;
      await admin.from("profiles").update({ display_name, avatar_url }).eq("user_id", uid);
      if (roles.length) {
        await admin.from("user_roles").insert(roles.map((r) => ({ user_id: uid, role: r })));
      }
      return json({ success: true, user_id: uid });
    }

    if (action === "update") {
      const user_id = String(body.user_id || "");
      const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
      const display_name = body.display_name !== undefined ? String(body.display_name) : undefined;
      const avatar_url = body.avatar_url !== undefined
        ? (body.avatar_url ? String(body.avatar_url) : null)
        : undefined;
      if (!user_id) return json({ error: "user_id requis" }, 400);

      const updates: Record<string, unknown> = {};
      if (email) updates.email = email;
      const meta: Record<string, unknown> = {};
      if (display_name !== undefined) meta.display_name = display_name;
      if (avatar_url !== undefined) meta.avatar_url = avatar_url;
      if (Object.keys(meta).length) updates.user_metadata = meta;

      const { error } = await admin.auth.admin.updateUserById(user_id, updates as Parameters<typeof admin.auth.admin.updateUserById>[1]);
      if (error) throw error;

      const profileUpdates: Record<string, unknown> = {};
      if (display_name !== undefined) profileUpdates.display_name = display_name;
      if (avatar_url !== undefined) profileUpdates.avatar_url = avatar_url;
      if (Object.keys(profileUpdates).length) {
        await admin.from("profiles").update(profileUpdates).eq("user_id", user_id);
      }
      return json({ success: true });
    }

    if (action === "set_password") {
      const user_id = String(body.user_id || "");
      const password = String(body.password || "");
      if (!user_id || password.length < 6) {
        return json({ error: "user_id + password (min 6) requis" }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(user_id, { password });
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "set_roles") {
      const user_id = String(body.user_id || "");
      const roles = (body.roles as Role[]) ?? [];
      if (!user_id) return json({ error: "user_id requis" }, 400);

      if (!roles.includes("admin")) {
        const { count } = await admin
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        const { data: current } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", user_id)
          .eq("role", "admin")
          .maybeSingle();
        if (current && (count ?? 0) <= 1) {
          return json({ error: "Impossible de retirer le dernier admin" }, 400);
        }
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
      if (user_id === callerId && blocked) {
        return json({ error: "Vous ne pouvez pas vous bloquer vous-même" }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: blocked ? "876000h" : "none",
      } as Parameters<typeof admin.auth.admin.updateUserById>[1]);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete") {
      const user_id = String(body.user_id || "");
      if (!user_id) return json({ error: "user_id requis" }, 400);
      if (user_id === callerId) {
        return json({ error: "Vous ne pouvez pas vous supprimer vous-même" }, 400);
      }
      const { data: targetRoles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id);
      const isTargetAdmin = (targetRoles ?? []).some((r: { role: string }) => r.role === "admin");
      if (isTargetAdmin) {
        const { count } = await admin
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) <= 1) {
          return json({ error: "Impossible de supprimer le dernier admin" }, 400);
        }
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
});
