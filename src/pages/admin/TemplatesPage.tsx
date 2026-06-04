import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, ExternalLink, Edit3, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";

function EditDialog({ t, onDone }: { t: any; onDone: () => void }) {
  const api = useAdminApi();
  const [title, setTitle] = useState(t.title ?? "");
  const [description, setDescription] = useState(t.description ?? "");
  const [tags, setTags] = useState((t.tags ?? []).join(", "));
  const [category, setCategory] = useState(t.category ?? "");
  const [isFeatured, setIsFeatured] = useState(!!t.is_featured);
  const [isTrending, setIsTrending] = useState(!!t.is_trending);
  const [isStaffPick, setIsStaffPick] = useState(!!t.is_staff_pick);
  const [isPublic, setIsPublic] = useState(!!t.is_public);
  const [status, setStatus] = useState(t.status ?? "published");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.updateTemplate(t.id, {
        title, description,
        tags: tags.split(",").map(s => s.trim()).filter(Boolean),
        category,
        is_featured: isFeatured, is_trending: isTrending, is_staff_pick: isStaffPick,
        is_public: isPublic, status,
      });
      toast.success("Template updated"); onDone();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Edit template</DialogTitle></DialogHeader>
      <div className="space-y-3 text-sm">
        <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <Input placeholder="Tags, comma separated" value={tags} onChange={e => setTags(e.target.value)} />
        <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2"><Checkbox checked={isPublic} onCheckedChange={v => setIsPublic(!!v)} /> Public</label>
          <label className="flex items-center gap-2"><Checkbox checked={isFeatured} onCheckedChange={v => setIsFeatured(!!v)} /> Featured</label>
          <label className="flex items-center gap-2"><Checkbox checked={isTrending} onCheckedChange={v => setIsTrending(!!v)} /> Trending</label>
          <label className="flex items-center gap-2"><Checkbox checked={isStaffPick} onCheckedChange={v => setIsStaffPick(!!v)} /> Staff Pick</label>
        </div>
      </div>
      <DialogFooter><Button disabled={busy} onClick={save}>Save changes</Button></DialogFooter>
    </DialogContent>
  );
}

export default function TemplatesPage() {
  const api = useAdminApi();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openFor, setOpenFor] = useState<string | null>(null);

  const load = () => { setLoading(true); api.getTemplates().then(setTemplates).finally(() => setLoading(false)); };
  useEffect(load, []);

  const filtered = useMemo(() => {
    let r = [...templates];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(t => t.title?.toLowerCase().includes(s) || t.owner_email?.toLowerCase().includes(s));
    }
    if (statusFilter !== "all") r = r.filter(t => (t.status ?? "published") === statusFilter);
    return r;
  }, [templates, search, statusFilter]);

  const quick = async (id: string, patch: any, msg: string) => {
    try { await api.updateTemplate(id, patch); toast.success(msg); load(); } catch (e: any) { toast.error(e.message); }
  };
  const del = async (id: string) => {
    try { await api.deleteTemplate(id); toast.success("Template deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-mono font-bold text-foreground">Community Templates</h1>

        <Card className="rounded-2xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">All Templates ({filtered.length})</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Search by title or owner…" value={search} onChange={e => setSearch(e.target.value)} />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto my-10" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Badges</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {t.preview_url || t.bottom_layer_url ? (
                          <img src={t.preview_url || t.bottom_layer_url} alt="" className="w-12 h-12 object-cover rounded" />
                        ) : <div className="w-12 h-12 bg-muted rounded" />}
                      </TableCell>
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">{t.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.owner_email}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "published" ? "secondary" : t.status === "deleted" ? "destructive" : "outline"}>{t.status ?? "published"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {t.is_featured && <Badge className="text-xs">★ Featured</Badge>}
                          {t.is_trending && <Badge className="text-xs">🔥 Trending</Badge>}
                          {t.is_staff_pick && <Badge className="text-xs">✓ Pick</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{t.usage_count ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <a href={`/use-template/${t.id}`} target="_blank" rel="noreferrer" className="p-1 hover:bg-muted rounded" title="View"><ExternalLink className="w-4 h-4" /></a>
                          <Dialog open={openFor === t.id} onOpenChange={o => setOpenFor(o ? t.id : null)}>
                            <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8"><Edit3 className="w-4 h-4" /></Button></DialogTrigger>
                            {openFor === t.id && <EditDialog t={t} onDone={() => { setOpenFor(null); load(); }} />}
                          </Dialog>
                          {t.status !== "hidden"
                            ? <Button size="icon" variant="ghost" className="h-8 w-8" title="Hide" onClick={() => quick(t.id, { status: "hidden", is_public: false }, "Hidden")}><EyeOff className="w-4 h-4" /></Button>
                            : <Button size="icon" variant="ghost" className="h-8 w-8" title="Publish" onClick={() => quick(t.id, { status: "published", is_public: true }, "Published")}><Eye className="w-4 h-4" /></Button>}
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete template?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del(t.id)} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
