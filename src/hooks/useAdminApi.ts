import { supabase } from "@/integrations/supabase/client";

async function adminFetch(action: string, method = "GET", body?: unknown) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);

  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/admin?action=${action}`,
    opts
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function useAdminApi() {
  return {
    getStats: () => adminFetch("stats"),
    getUsers: () => adminFetch("users"),
    updateRole: (userId: string, role: string) =>
      adminFetch("update-role", "POST", { userId, role }),
    getTemplates: () => adminFetch("templates"),
    deleteTemplate: (templateId: string) =>
      adminFetch("delete-template", "POST", { templateId }),
  };
}
