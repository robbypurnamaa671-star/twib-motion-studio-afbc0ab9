import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Crown, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSubscriptions() {
  const api = useAdminApi();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ premium: 0, free: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const allUsers = await api.getUsers();
        // Get subscription data from admin edge function
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/admin?action=users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const usersData = await res.json();
        setUsers(usersData);

        // Count premium vs free (we'll enhance this later)
        let premium = 0;
        let free = 0;
        // For now just show user counts
        free = usersData.length;
        setStats({ premium, free });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-mono font-bold text-foreground">Subscriptions</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-foreground">
                {users.length}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Premium Plan
              </CardTitle>
              <Crown className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-foreground">
                $12<span className="text-sm text-muted-foreground">/month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">User Subscription Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted" />
                          )}
                          <span className="text-sm">{u.display_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.role}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
