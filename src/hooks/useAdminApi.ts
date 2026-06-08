import { supabase, SUPABASE_PROJECT_REF } from "@/integrations/supabase/client";

async function adminFetch(action: string, method = "GET", body?: unknown, query: Record<string, string> = {}) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const opts: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);

  const qs = new URLSearchParams({ action, ...query }).toString();
  const res = await fetch(`https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/admin?${qs}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function useAdminApi() {
  return {
    // dashboard
    getStats: () => adminFetch("stats"),
    getRecentActivity: () => adminFetch("recent-activity"),
    // users
    getUsers: () => adminFetch("users"),
    updateRole: (userId: string, role: string) => adminFetch("update-role", "POST", { userId, role }),
    suspendUser: (userId: string, suspend: boolean) => adminFetch("suspend-user", "POST", { userId, suspend }),
    deleteUser: (userId: string) => adminFetch("delete-user", "POST", { userId }),
    // subscriptions
    setSubscription: (userId: string, status: "free" | "premium", opts: { days?: number; expiresAt?: string } = {}) =>
      adminFetch("set-subscription", "POST", { userId, status, ...opts }),
    extendPremium: (userId: string, days: number) => adminFetch("extend-premium", "POST", { userId, days }),
    // credits
    adjustCredits: (userId: string, opts: { delta?: number; set?: number; reason: string }) =>
      adminFetch("adjust-credits", "POST", { userId, ...opts }),
    getCreditHistory: (userId?: string) => adminFetch("credit-history", "GET", undefined, userId ? { userId } : {}),
    // templates
    getTemplates: () => adminFetch("templates"),
    updateTemplate: (templateId: string, patch: Record<string, unknown>) => adminFetch("update-template", "POST", { templateId, patch }),
    deleteTemplate: (templateId: string) => adminFetch("delete-template", "POST", { templateId }),
    // reports
    getReports: () => adminFetch("reports"),
    resolveReport: (reportId: string, action: "ignore" | "remove" | "suspend", extras: { templateId?: string; ownerId?: string } = {}) =>
      adminFetch("resolve-report", "POST", { reportId, action, ...extras }),
    // analytics
    getAnalytics: (days = 30) => adminFetch("analytics", "GET", undefined, { days: String(days) }),
    // audit
    getAuditLogs: () => adminFetch("audit-logs"),
    // settings
    getSettings: () => adminFetch("settings"),
    updateSettings: (settings: Record<string, unknown>) => adminFetch("update-settings", "POST", { settings }),
  };
}
