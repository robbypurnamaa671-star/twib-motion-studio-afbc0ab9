import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Loader2 } from "lucide-react";

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const { isSuperAdmin, loading } = useAdminRole();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
}