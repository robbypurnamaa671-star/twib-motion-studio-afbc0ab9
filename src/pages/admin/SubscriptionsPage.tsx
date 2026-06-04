import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

function ManageDialog({ user, onDone }: { user: any; onDone: () => void }) {
  const api = useAdminApi();
  const [days, setDays] = useState("30");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<any>, msg: string) => {
    setBusy(true);
    try { await fn(); toast.success(msg); onDone(); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Manage subscription · {user.email}</DialogTitle></DialogHeader>
      <div className="space-y-3 text-sm">
        <div>Current: <Badge>{user.subscription_status}</Badge>{user.premium_expires_at && <span className="ml-2 text-muted-foreground">expires {new Date(user.premium_expires_at).toLocaleDateString()}</span>}</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Grant / extend (days)</label>
            <Input type="number" value={days} onChange={e => setDays(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Or custom expiry</label>
            <Input type="date" value={expires} onChange={e => setExpires(e.target.value)} />
          </div>
        </div>
      </div>
      <DialogFooter className="flex-wrap gap-2">
        <Button disabled={busy} variant="secondary" onClick={() => run(() => api.setSubscription(user.id, "premium", expires ? { expiresAt: new Date(expires).toISOString() } : { days: parseInt(days) }), "Premium activated")}>Activate / Set</Button>
        <Button disabled={busy} variant="secondary" onClick={() => run(() => api.extendPremium(user.id, parseInt(days)), "Premium extended")}>Extend by {days}d</Button>
        <Button disabled={busy} variant="destructive" onClick={() => run(() => api.setSubscription(user.id, "free"), "Reverted to free")}>Cancel / Convert to Free</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function AdminSubscriptions() {
  const api = useAdminApi();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFor, setOpenFor] = useState<string | null>(null);

  const load = () => { setLoading(true); api.getUsers().then(setUsers).finally(() => setLoading(false)); };
  useEffect(load, []);

  const filtered = useMemo(() => users.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase())), [users, search]);
  const premium = users.filter(u => u.subscription_status === "premium").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-mono font-bold text-foreground">Subscriptions</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Premium users</CardTitle></CardHeader><CardContent><div className="text-3xl font-mono font-bold flex items-center gap-2"><Crown className="w-6 h-6 text-primary" />{premium}</div></CardContent></Card>
          <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Free users</CardTitle></CardHeader><CardContent><div className="text-3xl font-mono font-bold">{users.length - premium}</div></CardContent></Card>
          <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Monthly price</CardTitle></CardHeader><CardContent><div className="text-3xl font-mono font-bold">$2</div></CardContent></Card>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Manage subscriptions</CardTitle>
            <Input placeholder="Search by email…" value={search} onChange={e => setSearch(e.target.value)} className="mt-2 max-w-sm" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>{u.subscription_status === "premium" ? <Badge className="bg-primary/20 text-primary">Premium</Badge> : <Badge variant="outline">Free</Badge>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.premium_started_at ? new Date(u.premium_started_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.premium_expires_at ? new Date(u.premium_expires_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-sm">{u.credit_points}</TableCell>
                      <TableCell>
                        <Dialog open={openFor === u.id} onOpenChange={(o) => setOpenFor(o ? u.id : null)}>
                          <DialogTrigger asChild><Button size="sm" variant="outline">Manage</Button></DialogTrigger>
                          {openFor === u.id && <ManageDialog user={u} onDone={() => { setOpenFor(null); load(); }} />}
                        </Dialog>
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
