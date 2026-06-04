import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function AdjustDialog({ user, onDone }: { user: any; onDone: () => void }) {
  const api = useAdminApi();
  const [delta, setDelta] = useState("0");
  const [setVal, setSetVal] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (mode: "delta" | "set" | "reset") => {
    setBusy(true);
    try {
      if (mode === "delta") await api.adjustCredits(user.id, { delta: parseInt(delta) || 0, reason: reason || "admin adjustment" });
      if (mode === "set") await api.adjustCredits(user.id, { set: parseInt(setVal) || 0, reason: reason || "admin set" });
      if (mode === "reset") await api.adjustCredits(user.id, { set: 20, reason: "reset to default" });
      toast.success("Credits updated"); onDone();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Adjust credits · {user.email}</DialogTitle></DialogHeader>
      <div className="space-y-3 text-sm">
        <div>Current balance: <strong>{user.credit_points}</strong></div>
        <Input placeholder="Reason (required)" value={reason} onChange={e => setReason(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Add / subtract (use - for subtract)</label>
            <Input type="number" value={delta} onChange={e => setDelta(e.target.value)} />
            <Button disabled={busy} size="sm" className="mt-1" onClick={() => submit("delta")}>Apply delta</Button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Set exact value</label>
            <Input type="number" value={setVal} onChange={e => setSetVal(e.target.value)} />
            <Button disabled={busy} size="sm" className="mt-1" onClick={() => submit("set")}>Set value</Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button disabled={busy} variant="outline" onClick={() => submit("reset")}>Reset to 20</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function CreditsPage() {
  const api = useAdminApi();
  const [users, setUsers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFor, setOpenFor] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.getUsers(), api.getCreditHistory()])
      .then(([u, h]) => { setUsers(u); setHistory(h); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => users.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase())), [users, search]);
  const emailById = useMemo(() => Object.fromEntries(users.map(u => [u.id, u.email])), [users]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-mono font-bold text-foreground">Credits</h1>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">User balances</CardTitle>
            <Input placeholder="Search by email…" value={search} onChange={e => setSearch(e.target.value)} className="mt-2 max-w-sm" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto my-10" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Plan</TableHead><TableHead>Credits</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.subscription_status}</TableCell>
                      <TableCell className="text-sm font-mono">{u.credit_points}</TableCell>
                      <TableCell>
                        <Dialog open={openFor === u.id} onOpenChange={o => setOpenFor(o ? u.id : null)}>
                          <DialogTrigger asChild><Button size="sm" variant="outline">Adjust</Button></DialogTrigger>
                          {openFor === u.id && <AdjustDialog user={u} onDone={() => { setOpenFor(null); load(); }} />}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Recent credit history</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>When</TableHead><TableHead>User</TableHead><TableHead>Δ</TableHead><TableHead>Balance after</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
              <TableBody>
                {history.slice(0, 50).map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{emailById[h.user_id] || h.user_id.slice(0, 8)}</TableCell>
                    <TableCell className={"text-sm font-mono " + (h.delta >= 0 ? "text-primary" : "text-destructive")}>{h.delta > 0 ? "+" : ""}{h.delta}</TableCell>
                    <TableCell className="text-sm">{h.balance_after}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{h.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}