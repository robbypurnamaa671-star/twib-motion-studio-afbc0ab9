import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/seo-content";

interface Row {
  id: string; slug: string; title: string; meta_description: string;
  excerpt: string; content_md: string; cover_image_url: string | null;
  category: string | null; tags: string[]; related_slugs: string[];
  related_seo_slugs: string[]; is_published: boolean; published_at: string | null; updated_at: string;
}

type Form = Omit<Row, "id" | "updated_at"> & { id?: string };

const empty: Form = {
  slug: "", title: "", meta_description: "", excerpt: "", content_md: "",
  cover_image_url: "", category: "", tags: [], related_slugs: [], related_seo_slugs: [],
  is_published: false, published_at: null,
};

export default function BlogPostsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [tagsText, setTagsText] = useState("");
  const [relText, setRelText] = useState("");
  const [seoText, setSeoText] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("blog_posts") as any).select("*").order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setTagsText(""); setRelText(""); setSeoText(""); setOpen(true); };
  const openEdit = (r: Row) => {
    setForm({ ...r });
    setTagsText((r.tags || []).join(", "));
    setRelText((r.related_slugs || []).join(", "));
    setSeoText((r.related_seo_slugs || []).join(", "));
    setOpen(true);
  };

  const save = async () => {
    const slug = slugify(form.slug || form.title);
    if (!slug || !form.title || !form.meta_description) { toast.error("Fill required fields"); return; }
    setSaving(true);
    const payload: any = {
      slug, title: form.title, meta_description: form.meta_description,
      excerpt: form.excerpt, content_md: form.content_md, cover_image_url: form.cover_image_url || null,
      category: form.category || null,
      tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
      related_slugs: relText.split(",").map((s) => s.trim()).filter(Boolean),
      related_seo_slugs: seoText.split(",").map((s) => s.trim()).filter(Boolean),
      is_published: form.is_published,
      published_at: form.is_published ? (form.published_at || new Date().toISOString()) : null,
    };
    const { error } = form.id
      ? await (supabase.from("blog_posts") as any).update(payload).eq("id", form.id)
      : await (supabase.from("blog_posts") as any).insert([payload]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Updated" : "Created");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await (supabase.from("blog_posts") as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-mono font-bold text-foreground">Blog Posts</h1>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New Post</Button>
        </div>
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">All Posts ({rows.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No blog posts yet.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Slug</TableHead><TableHead>Published</TableHead><TableHead>Updated</TableHead><TableHead className="w-32 text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">/blog/{r.slug}</TableCell>
                      <TableCell className="text-sm">{r.is_published ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <a href={`/blog/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex"><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Preview"><ExternalLink className="w-4 h-4" /></Button></a>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" /></div>
              <div><Label>Meta Description *</Label><Textarea rows={2} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} /></div>
              <div><Label>Excerpt</Label><Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
              <div><Label>Cover Image URL</Label><Input value={form.cover_image_url || ""} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="tutorial / guide / ideas" /></div>
              <div><Label>Tags (comma-separated)</Label><Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} /></div>
              <div><Label>Related blog slugs (comma-separated)</Label><Input value={relText} onChange={(e) => setRelText(e.target.value)} /></div>
              <div><Label>Related SEO slugs (comma-separated)</Label><Input value={seoText} onChange={(e) => setSeoText(e.target.value)} placeholder="wisuda, animated-twibbon-maker" /></div>
              <div><Label>Content (Markdown)</Label><Textarea rows={14} className="font-mono text-xs" value={form.content_md} onChange={(e) => setForm({ ...form, content_md: e.target.value })} /></div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Label htmlFor="pub">Published</Label>
                <Switch id="pub" checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{form.id ? "Save" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}