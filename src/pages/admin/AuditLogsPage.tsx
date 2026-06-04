import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SuperAdminGuard } from "@/components/admin/SuperAdminGuard";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function AuditLogsPage() {
  const api = useAdminApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { api.getAuditLogs().then(setLogs).finally(() => setLoading(false)); }, []);

  const filtered = logs.filter(l => !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.admin_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.target_type?.toLowerCase().includes(search.toLowerCase()));

  return (
    <SuperAdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-mono font-bold text-foreground">Audit Logs</h1>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">All admin actions ({filtered.length})</CardTitle>
              <Input placeholder="Search action / admin / target…" value={search} onChange={e => setSearch(e.target.value)} className="mt-2 max-w-sm" />
            </CardHeader>
            <CardContent>
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto my-10" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{l.admin_email || l.admin_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm font-mono text-primary">{l.action}</TableCell>
                        <TableCell className="text-xs">{l.target_type}{l.target_id ? ` · ${String(l.target_id).slice(0, 8)}` : ""}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-md truncate">{JSON.stringify(l.details)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </SuperAdminGuard>
  );
}