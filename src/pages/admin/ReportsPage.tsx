import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const api = useAdminApi();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); api.getReports().then(setReports).finally(() => setLoading(false)); };
  useEffect(load, []);

  const act = async (r: any, action: "ignore" | "remove" | "suspend") => {
    try {
      await api.resolveReport(r.id, action, { templateId: r.template_id, ownerId: r.shared_templates?.owner_id });
      toast.success("Done"); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const pending = reports.filter(r => r.status === "pending");
  const resolved = reports.filter(r => r.status !== "pending");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-mono font-bold text-foreground">Template Reports</h1>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Pending ({pending.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto my-10" /> : pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending reports.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Template</TableHead><TableHead>Reporter</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pending.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">
                        <a href={`/use-template/${r.template_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                          {r.shared_templates?.title || r.template_id.slice(0, 8)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.reporter_email}</TableCell>
                      <TableCell className="text-sm">
                        <div>{r.reason}</div>
                        {r.details && <div className="text-xs text-muted-foreground">{r.details}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => act(r, "ignore")}>Ignore</Button>
                          <Button size="sm" variant="destructive" onClick={() => act(r, "remove")}>Remove</Button>
                          <Button size="sm" variant="destructive" onClick={() => act(r, "suspend")}>Suspend creator</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Resolved ({resolved.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Template</TableHead><TableHead>Reason</TableHead><TableHead>Outcome</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {resolved.slice(0, 30).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.shared_templates?.title || r.template_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm">{r.reason}</TableCell>
                    <TableCell><Badge variant={r.status === "ignored" ? "outline" : "secondary"}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : "—"}</TableCell>
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