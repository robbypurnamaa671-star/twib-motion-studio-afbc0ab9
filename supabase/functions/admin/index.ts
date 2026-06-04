import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

type Caller = {
  user: { id: string; email?: string };
  role: "super_admin" | "admin" | "user";
  supabase: ReturnType<typeof admin>;
};

async function resolveCaller(req: Request): Promise<Caller | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const supabase = admin();
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admin_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (adminRow?.role === "super_admin") return { user, role: "super_admin", supabase };
  if (adminRow?.role === "admin") return { user, role: "admin", supabase };

  // Backward-compat: user_roles 'admin'
  const { data: legacy } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (legacy) return { user, role: "admin", supabase };

  return { user, role: "user", supabase };
}

async function requireAdmin(req: Request, requireSuper = false): Promise<Caller> {
  const c = await resolveCaller(req);
  if (!c || c.role === "user") throw new Error("Forbidden");
  if (requireSuper && c.role !== "super_admin") throw new Error("Super admin only");
  return c;
}

async function logAction(c: Caller, action: string, target_type?: string, target_id?: string, details: Record<string, unknown> = {}) {
  await c.supabase.from("audit_logs").insert({
    admin_id: c.user.id,
    admin_email: c.user.email,
    action, target_type, target_id, details,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || url.pathname.split("/").filter(Boolean)[1] || "";

    // ============ Public-ish: role check ============
    if (action === "check-role") {
      const c = await resolveCaller(req);
      return json({ role: c?.role ?? null });
    }

    const c = await requireAdmin(req);
    const sb = c.supabase;
    const body = ["GET", "DELETE"].includes(req.method) ? {} : await req.json().catch(() => ({}));

    switch (action) {
      // ============ DASHBOARD STATS ============
      case "stats": {
        const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
        const [users, subs, templates, exports30, reports] = await Promise.all([
          sb.auth.admin.listUsers({ perPage: 1000 }),
          sb.from("user_subscriptions").select("subscription_status,premium_expires_at"),
          sb.from("shared_templates").select("status,is_public"),
          sb.from("export_logs").select("format,created_at").gte("created_at", since30),
          sb.from("template_reports").select("status").eq("status", "pending"),
        ]);
        const allUsers = users.data?.users ?? [];
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(since30)).length;
        const premiumUsers = (subs.data ?? []).filter((s: any) =>
          s.subscription_status === "premium" && (!s.premium_expires_at || new Date(s.premium_expires_at) > new Date())
        ).length;
        const freeUsers = totalUsers - premiumUsers;

        const tmpls = templates.data ?? [];
        const exportsByFmt: Record<string, number> = { png: 0, gif: 0, video: 0, mp4: 0, webm: 0, jpg: 0 };
        (exports30.data ?? []).forEach((e: any) => {
          const f = (e.format || "").toLowerCase();
          exportsByFmt[f] = (exportsByFmt[f] ?? 0) + 1;
        });

        return json({
          totalUsers, activeUsers, premiumUsers, freeUsers,
          totalTemplates: tmpls.length,
          publishedTemplates: tmpls.filter((t: any) => t.status === "published" && t.is_public).length,
          pendingTemplates: tmpls.filter((t: any) => t.status === "pending").length,
          deletedTemplates: tmpls.filter((t: any) => t.status === "deleted").length,
          hiddenTemplates: tmpls.filter((t: any) => t.status === "hidden").length,
          totalExports: exports30.data?.length ?? 0,
          pngExports: (exportsByFmt.png ?? 0) + (exportsByFmt.jpg ?? 0),
          gifExports: exportsByFmt.gif ?? 0,
          videoExports: (exportsByFmt.video ?? 0) + (exportsByFmt.mp4 ?? 0) + (exportsByFmt.webm ?? 0),
          pendingReports: reports.data?.length ?? 0,
        });
      }

      case "recent-activity": {
        const { data } = await sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(30);
        return json(data ?? []);
      }

      // ============ USERS ============
      case "users": {
        const { data } = await sb.auth.admin.listUsers({ perPage: 1000 });
        const users = data?.users ?? [];
        const ids = users.map(u => u.id);
        const [{ data: adminRoles }, { data: userRoles }, { data: subs }, { data: profs }] = await Promise.all([
          sb.from("admin_roles").select("user_id,role"),
          sb.from("user_roles").select("user_id,role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
          sb.from("user_subscriptions").select("*").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
          sb.from("profiles").select("*").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        ]);
        const adminMap = new Map<string, string>(); (adminRoles ?? []).forEach((r: any) => adminMap.set(r.user_id, r.role));
        const subMap = new Map<string, any>(); (subs ?? []).forEach((s: any) => subMap.set(s.user_id, s));
        const profMap = new Map<string, any>(); (profs ?? []).forEach((p: any) => profMap.set(p.user_id, p));

        return json(users.map((u: any) => {
          const elevated = adminMap.get(u.id);
          const legacyAdmin = (userRoles ?? []).some((r: any) => r.user_id === u.id && r.role === "admin");
          const role = elevated ?? (legacyAdmin ? "admin" : "user");
          const sub = subMap.get(u.id);
          const prof = profMap.get(u.id);
          return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            role,
            account_status: prof?.account_status ?? "active",
            display_name: prof?.display_name || u.user_metadata?.full_name || u.user_metadata?.name || "",
            avatar_url: prof?.avatar_url || u.user_metadata?.avatar_url || "",
            subscription_status: sub?.subscription_status ?? "free",
            premium_started_at: sub?.premium_started_at,
            premium_expires_at: sub?.premium_expires_at,
            credit_points: sub?.credit_points ?? 0,
            banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
          };
        }));
      }

      case "update-role": {
        const { userId, role } = body as { userId: string; role: "super_admin" | "admin" | "user" };
        if (!userId || !["super_admin", "admin", "user"].includes(role)) return json({ error: "Invalid input" }, 400);
        if (role === "super_admin" && c.role !== "super_admin") return json({ error: "Super admin only" }, 403);

        if (role === "user") {
          await sb.from("admin_roles").delete().eq("user_id", userId);
          await sb.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        } else {
          await sb.from("admin_roles").upsert({ user_id: userId, role, granted_by: c.user.id }, { onConflict: "user_id" });
          // mirror to user_roles for legacy components
          await sb.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        }
        await logAction(c, "update-role", "user", userId, { role });
        return json({ success: true });
      }

      case "suspend-user": {
        const { userId, suspend } = body as { userId: string; suspend: boolean };
        await sb.auth.admin.updateUserById(userId, { ban_duration: suspend ? "8760h" : "none" });
        await sb.from("profiles").update({ account_status: suspend ? "suspended" : "active" }).eq("user_id", userId);
        await logAction(c, suspend ? "suspend-user" : "reactivate-user", "user", userId);
        return json({ success: true });
      }

      case "delete-user": {
        const { userId } = body as { userId: string };
        await sb.auth.admin.deleteUser(userId);
        await logAction(c, "delete-user", "user", userId);
        return json({ success: true });
      }

      // ============ SUBSCRIPTIONS ============
      case "set-subscription": {
        const { userId, status, days, expiresAt } = body as { userId: string; status: "free" | "premium"; days?: number; expiresAt?: string };
        const patch: Record<string, unknown> = { subscription_status: status, user_id: userId };
        if (status === "premium") {
          patch.premium_started_at = new Date().toISOString();
          if (expiresAt) patch.premium_expires_at = expiresAt;
          else if (days) patch.premium_expires_at = new Date(Date.now() + days * 86400_000).toISOString();
          else patch.premium_expires_at = new Date(Date.now() + 30 * 86400_000).toISOString();
        } else {
          patch.premium_expires_at = null;
          patch.premium_started_at = null;
        }
        await sb.from("user_subscriptions").upsert(patch, { onConflict: "user_id" });
        await logAction(c, "set-subscription", "user", userId, { status, days, expiresAt });
        return json({ success: true });
      }

      case "extend-premium": {
        const { userId, days } = body as { userId: string; days: number };
        const { data: cur } = await sb.from("user_subscriptions").select("*").eq("user_id", userId).maybeSingle();
        const base = cur?.premium_expires_at && new Date(cur.premium_expires_at) > new Date()
          ? new Date(cur.premium_expires_at) : new Date();
        const newExp = new Date(base.getTime() + days * 86400_000).toISOString();
        await sb.from("user_subscriptions").upsert({
          user_id: userId, subscription_status: "premium",
          premium_started_at: cur?.premium_started_at ?? new Date().toISOString(),
          premium_expires_at: newExp,
        }, { onConflict: "user_id" });
        await logAction(c, "extend-premium", "user", userId, { days, newExp });
        return json({ success: true, newExp });
      }

      // ============ CREDITS ============
      case "adjust-credits": {
        const { userId, delta, set, reason } = body as { userId: string; delta?: number; set?: number; reason: string };
        const { data: cur } = await sb.from("user_subscriptions").select("credit_points").eq("user_id", userId).maybeSingle();
        const current = cur?.credit_points ?? 0;
        const next = set !== undefined ? set : current + (delta ?? 0);
        await sb.from("user_subscriptions").upsert({ user_id: userId, credit_points: next }, { onConflict: "user_id" });
        await sb.from("credit_history").insert({
          user_id: userId, delta: next - current, balance_after: next,
          reason: reason || "admin adjustment", admin_id: c.user.id,
        });
        await logAction(c, "adjust-credits", "user", userId, { delta: next - current, balance_after: next, reason });
        return json({ success: true, balance: next });
      }

      case "credit-history": {
        const userId = url.searchParams.get("userId");
        const q = sb.from("credit_history").select("*").order("created_at", { ascending: false }).limit(200);
        const { data } = userId ? await q.eq("user_id", userId) : await q;
        return json(data ?? []);
      }

      // ============ TEMPLATES ============
      case "templates": {
        const { data } = await sb.from("shared_templates").select("*").order("created_at", { ascending: false });
        const ownerIds = [...new Set((data ?? []).map((t: any) => t.owner_id))];
        const ownerMap: Record<string, string> = {};
        for (const oid of ownerIds) {
          const { data: u } = await sb.auth.admin.getUserById(oid as string);
          if (u?.user) ownerMap[oid as string] = u.user.email || "unknown";
        }
        return json((data ?? []).map((t: any) => ({ ...t, owner_email: ownerMap[t.owner_id] || "unknown" })));
      }

      case "update-template": {
        const { templateId, patch } = body as { templateId: string; patch: Record<string, unknown> };
        const allowed: Record<string, unknown> = {};
        for (const k of ["title", "description", "tags", "category", "is_public", "status", "is_featured", "is_trending", "is_staff_pick"]) {
          if (k in patch) allowed[k] = (patch as any)[k];
        }
        const { error } = await sb.from("shared_templates").update(allowed).eq("id", templateId);
        if (error) return json({ error: error.message }, 500);
        await logAction(c, "update-template", "template", templateId, allowed);
        return json({ success: true });
      }

      case "delete-template": {
        const { templateId } = body as { templateId: string };
        await sb.from("shared_templates").delete().eq("id", templateId);
        await logAction(c, "delete-template", "template", templateId);
        return json({ success: true });
      }

      // ============ REPORTS ============
      case "reports": {
        const { data } = await sb.from("template_reports").select("*, shared_templates(title,owner_id)").order("created_at", { ascending: false });
        const reporterIds = [...new Set((data ?? []).map((r: any) => r.reporter_id))];
        const reporterMap: Record<string, string> = {};
        for (const id of reporterIds) {
          const { data: u } = await sb.auth.admin.getUserById(id as string);
          if (u?.user) reporterMap[id as string] = u.user.email || "unknown";
        }
        return json((data ?? []).map((r: any) => ({ ...r, reporter_email: reporterMap[r.reporter_id] })));
      }

      case "resolve-report": {
        const { reportId, action: resolution, templateId, ownerId } = body as { reportId: string; action: "ignore" | "remove" | "suspend"; templateId?: string; ownerId?: string };
        if (resolution === "remove" && templateId) {
          await sb.from("shared_templates").update({ status: "deleted", is_public: false }).eq("id", templateId);
        }
        if (resolution === "suspend" && ownerId) {
          await sb.auth.admin.updateUserById(ownerId, { ban_duration: "8760h" });
          await sb.from("profiles").update({ account_status: "suspended" }).eq("user_id", ownerId);
        }
        await sb.from("template_reports").update({
          status: resolution === "ignore" ? "ignored" : "resolved",
          resolved_by: c.user.id, resolved_at: new Date().toISOString(),
        }).eq("id", reportId);
        await logAction(c, "resolve-report", "report", reportId, { resolution });
        return json({ success: true });
      }

      // ============ ANALYTICS ============
      case "analytics": {
        const days = parseInt(url.searchParams.get("days") || "30");
        const since = new Date(Date.now() - days * 86400_000).toISOString();
        const [{ data: users }, { data: tmpls }, { data: exps }] = await Promise.all([
          sb.auth.admin.listUsers({ perPage: 1000 }),
          sb.from("shared_templates").select("created_at").gte("created_at", since),
          sb.from("export_logs").select("created_at,format").gte("created_at", since),
        ]);
        const userRows = (users?.users ?? []).filter((u: any) => new Date(u.created_at) > new Date(since));
        const { data: subs } = await sb.from("user_subscriptions").select("created_at,subscription_status,premium_started_at").gte("premium_started_at", since);

        const bucket = (rows: { created_at: string }[]) => {
          const m: Record<string, number> = {};
          rows.forEach(r => {
            const d = new Date(r.created_at).toISOString().slice(0, 10);
            m[d] = (m[d] ?? 0) + 1;
          });
          return m;
        };
        return json({
          userGrowth: bucket(userRows.map((u: any) => ({ created_at: u.created_at }))),
          premiumGrowth: bucket((subs ?? []).filter((s: any) => s.premium_started_at).map((s: any) => ({ created_at: s.premium_started_at }))),
          templateGrowth: bucket(tmpls ?? []),
          exportActivity: bucket(exps ?? []),
        });
      }

      // ============ AUDIT LOGS ============
      case "audit-logs": {
        if (c.role !== "super_admin") return json({ error: "Super admin only" }, 403);
        const { data } = await sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
        return json(data ?? []);
      }

      // ============ SETTINGS ============
      case "settings": {
        const { data } = await sb.from("site_settings").select("*");
        const out: Record<string, unknown> = {};
        (data ?? []).forEach((s: any) => { out[s.key] = s.value; });
        return json(out);
      }

      case "update-settings": {
        if (c.role !== "super_admin") return json({ error: "Super admin only" }, 403);
        const { settings } = body as { settings: Record<string, unknown> };
        for (const [key, value] of Object.entries(settings)) {
          await sb.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString(), updated_by: c.user.id });
        }
        await logAction(c, "update-settings", "settings", null, settings as Record<string, unknown>);
        return json({ success: true });
      }

      default:
        return json({ error: "Unknown action: " + action }, 404);
    }
  } catch (e: any) {
    return json({ error: e.message }, 403);
  }
});