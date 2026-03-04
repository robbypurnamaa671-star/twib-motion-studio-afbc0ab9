import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesPage() {
  const api = useAdminApi();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getTemplates().then(setTemplates).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await api.deleteTemplate(id);
      toast.success("Template deleted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-mono font-bold text-foreground">Manage Templates</h1>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">All Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No templates yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Canvas</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm font-medium">{t.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.owner_email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.canvas_ratio} ({t.canvas_w}×{t.canvas_h})
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
