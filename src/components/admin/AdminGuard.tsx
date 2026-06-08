import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, isSuperAdmin, loading: roleLoading } = useAdminRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    // eslint-disable-next-line no-console
    console.warn("[AdminGuard] redirect →/", {
      path: location.pathname,
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      role,
      isAdmin,
      isSuperAdmin,
      reason: !user ? "no-session" : "not-admin",
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
