import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, SUPABASE_PROJECT_REF } from "@/integrations/supabase/client";

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<"super_admin" | "admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch(
          `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/admin?action=check-role`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json().catch(() => ({}));
        const resolved = json.role ?? "user";
        // eslint-disable-next-line no-console
        console.info("[useAdminRole]", { userId: user.id, email: user.email, role: resolved, httpStatus: res.status });
        setRole(resolved);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[useAdminRole] check failed", e);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user, authLoading]);

  return {
    role,
    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    loading: loading || authLoading,
  };
}
