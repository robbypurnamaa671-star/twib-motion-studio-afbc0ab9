import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Ban, RotateCcw, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";

type AdminUser = {
  id: string; email: string; created_at: string; last_sign_in_at?: string;
  role: "super_admin" | "admin" | "user";
  account_status: "active" | "suspended";
  display_name: string; avatar_url: string;
  subscription_status: "free" | "premium"; credit_points: number;
  premium_expires_at?: string; banned?: boolean;
};

export default function UsersPage() {
  const api = useAdminApi();
  const { isSuperAdmin } = useAdminRole();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_desc");

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    let r = [...users];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(u => u.email?.toLowerCase().includes(s) || u.display_name?.toLowerCase().includes(s));
    }
    if (filterRole !== "all") r = r.filter(u => u.role === filterRole);
    if (filterStatus !== "all") r = r.filter(u => u.subscription_status === filterStatus);
    r.sort((a, b) => {
      if (sortBy === "created_desc") return +new Date(b.created_at) - +new Date(a.created_at);
      if (sortBy === "created_asc") return +new Date(a.created_at) - +new Date(b.created_at);
      if (sortBy === "email") return (a.email || "").localeCompare(b.email || "");
      return 0;
    });
    return r;
  }, [users, search, filterRole, filterStatus, sortBy]);

  const handleRoleChange = async (userId: string, role: string) => {
    try { await api.updateRole(userId, role); toast.success("Role updated"); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleSuspend = async (userId: string, suspend: boolean) => {
    try { await api.suspendUser(userId, suspend); toast.success(suspend ? "User suspended" : "User reactivated"); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleDelete = async (userId: string) => {
    try { await api.deleteUser(userId); toast.success("User deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-mono font-bold text-foreground">User Management</h1>

        <Card className="rounded-2xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">All Users ({filtered.length})</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Subscription" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Newest first</SelectItem>
                  <SelectItem value="created_asc">Oldest first</SelectItem>
                  <SelectItem value="email">Email A→Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-muted" />}
                          <span className="text-sm">{u.display_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        {u.banned || u.account_status === "suspended"
                          ? <Badge variant="destructive">Suspended</Badge>
                          : <Badge variant="secondary">Active</Badge>}
                      </TableCell>
                      <TableCell>
                        {u.subscription_status === "premium"
                          ? <Badge className="bg-primary/20 text-primary"><Crown className="w-3 h-3 mr-1" />Premium</Badge>
                          : <Badge variant="outline">Free</Badge>}
                      </TableCell>
                      <TableCell className="text-sm">{u.credit_points}</TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">user</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                            {isSuperAdmin && <SelectItem value="super_admin">super_admin</SelectItem>}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title={u.banned ? "Reactivate" : "Suspend"}
                            onClick={() => handleSuspend(u.id, !u.banned)}>
                            {u.banned ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4 text-amber-500" />}
                          </Button>
                          {isSuperAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                                  <AlertDialogDescription>This permanently removes {u.email}. This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
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
