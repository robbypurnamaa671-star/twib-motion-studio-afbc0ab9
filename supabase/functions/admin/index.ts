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

async function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Not authenticated");

  const supabase = await getAdminClient();
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Invalid token");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roles) throw new Error("Not an admin");
  return { user, supabase };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    // path[0] = "admin", path[1] = action
    const action = path[1] || url.searchParams.get("action") || "";

    // Check role endpoint (doesn't require admin)
    if (action === "check-role") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ role: null });
      const supabase = await getAdminClient();
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return json({ role: null });

      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return json({ role: adminRole ? "admin" : "user" });
    }

    // All other actions require admin
    const { supabase } = await verifyAdmin(req);

    switch (action) {
      case "stats": {
        const [users, templates] = await Promise.all([
          supabase.auth.admin.listUsers({ perPage: 1000 }),
          supabase.from("shared_templates").select("id", { count: "exact", head: true }),
        ]);
        return json({
          totalUsers: users.data?.users?.length ?? 0,
          totalTemplates: templates.count ?? 0,
        });
      }

      case "users": {
        const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const users = data?.users ?? [];
        // Get all roles
        const { data: allRoles } = await supabase.from("user_roles").select("*");
        const roleMap: Record<string, string> = {};
        allRoles?.forEach((r: any) => { roleMap[r.user_id] = r.role; });

        return json(
          users.map((u: any) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            role: roleMap[u.id] || "user",
            display_name: u.user_metadata?.full_name || u.user_metadata?.name || "",
            avatar_url: u.user_metadata?.avatar_url || "",
          }))
        );
      }

      case "update-role": {
        const body = await req.json();
        const { userId, role } = body;
        if (!userId || !["admin", "user"].includes(role)) {
          return json({ error: "Invalid input" }, 400);
        }
        // Upsert role
        const { error } = await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

        if (role === "user") {
          // Remove admin role if demoting
          await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", "admin");
        }
        if (role === "admin") {
          // Ensure admin role exists
          await supabase
            .from("user_roles")
            .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        }

        return json({ success: true });
      }

      case "templates": {
        const { data, error } = await supabase
          .from("shared_templates")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 500);

        // Get owner emails
        const ownerIds = [...new Set((data || []).map((t: any) => t.owner_id))];
        const ownerMap: Record<string, string> = {};
        for (const oid of ownerIds) {
          const { data: u } = await supabase.auth.admin.getUserById(oid as string);
          if (u?.user) ownerMap[oid as string] = u.user.email || "unknown";
        }

        return json(
          (data || []).map((t: any) => ({
            ...t,
            owner_email: ownerMap[t.owner_id] || "unknown",
          }))
        );
      }

      case "delete-template": {
        const body = await req.json();
        const { error } = await supabase
          .from("shared_templates")
          .delete()
          .eq("id", body.templateId);
        if (error) return json({ error: error.message }, 500);
        return json({ success: true });
      }

      default:
        return json({ error: "Unknown action" }, 404);
    }
  } catch (e: any) {
    return json({ error: e.message }, 403);
  }
});
