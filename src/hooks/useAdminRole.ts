import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/admin?action=check-role`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        setRole(json.role ?? "user");
      } catch {
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
