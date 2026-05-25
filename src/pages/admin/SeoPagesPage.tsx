import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FaqItem { question: string; answer: string }

interface SeoPageRow {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  meta_description: string;
  intro_text: string;
  faq_json: FaqItem[];
  featured_template_ids: string[];
  related_slugs: string[];
  is_indexable: boolean;
  updated_at: string;
}

type FormState = Omit<SeoPageRow, "id" | "updated_at"> & { id?: string };

const emptyForm: FormState = {
  slug: "",
  keyword: "",
  title: "",
  meta_description: "",
  intro_text: "",
  faq_json: [],
  featured_template_ids: [],
  related_slugs: [],
  is_indexable: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function SeoPagesPage() {
  const [rows, setRows] = useState<SeoPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [faqText, setFaqText] = useState("[]");
  const [tplText, setTplText] = useState("");
  const [relText, setRelText] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("seo_pages")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as unknown as SeoPageRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(emptyForm);
    setFaqText("[]");
    setTplText("");
    setRelText("");
    setOpen(true);
  };

  const openEdit = (row: SeoPageRow) => {
    setForm({
      id: row.id,
      slug: row.slug,
      keyword: row.keyword,
      title: row.title,
      meta_description: row.meta_description,
      intro_text: row.intro_text,
      faq_json: row.faq_json || [],
      featured_template_ids: row.featured_template_ids || [],
      related_slugs: row.related_slugs || [],
      is_indexable: row.is_indexable,
    });
    setFaqText(JSON.stringify(row.faq_json || [], null, 2));
    setTplText((row.featured_template_ids || []).join(", "));
    setRelText((row.related_slugs || []).join(", "));
    setOpen(true);
  };

  const save = async () => {
    let faqParsed: FaqItem[];
    try {
      faqParsed = JSON.parse(faqText || "[]");
      if (!Array.isArray(faqParsed)) throw new Error("FAQ must be an array");
    } catch (e) {
      toast.error("Invalid FAQ JSON: " + (e as Error).message);
      return;
    }
    const slug = slugify(form.slug || form.keyword);
    if (!slug || !form.keyword || !form.title || !form.meta_description || !form.intro_text) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    const payload = {
      slug,
      keyword: form.keyword,
      title: form.title,
      meta_description: form.meta_description,
      intro_text: form.intro_text,
      faq_json: faqParsed,
      featured_template_ids: tplText.split(",").map((s) => s.trim()).filter(Boolean),
      related_slugs: relText.split(",").map((s) => s.trim()).filter(Boolean).map(slugify),
      is_indexable: form.is_indexable,
    };
    const { error } = form.id
      ? await supabase.from("seo_pages").update(payload).eq("id", form.id)
      : await supabase.from("seo_pages").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "SEO page updated" : "SEO page created");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this SEO page?")) return;
    const { error } = await supabase.from("seo_pages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-mono font-bold text-foreground">Programmatic SEO Pages</h1>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New SEO Page</Button>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">All SEO Pages ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No SEO pages yet. Create one to start ranking on new keywords.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Indexable</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.keyword}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">/twibbon/{r.slug}</TableCell>
                      <TableCell className="text-sm">{r.is_indexable ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <a href={`/twibbon/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex">
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Preview"><ExternalLink className="w-4 h-4" /></Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)} aria-label="Edit"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(r.id)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
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
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit SEO Page" : "New SEO Page"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Keyword *</Label>
                  <Input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="Wisuda" />
                </div>
                <div>
                  <Label>Slug (auto from keyword)</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="wisuda" />
                </div>
              </div>
              <div>
                <Label>Meta Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Create Twibbon Wisuda Online – Free Twibbon Maker | TwibMotion" />
              </div>
              <div>
                <Label>Meta Description *</Label>
                <Textarea rows={2} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
              </div>
              <div>
                <Label>Intro Text *</Label>
                <Textarea rows={4} value={form.intro_text} onChange={(e) => setForm({ ...form, intro_text: e.target.value })} />
              </div>
              <div>
                <Label>Featured Template IDs (comma-separated)</Label>
                <Input value={tplText} onChange={(e) => setTplText(e.target.value)} placeholder="uuid, uuid, uuid" />
              </div>
              <div>
                <Label>Related Slugs (comma-separated)</Label>
                <Input value={relText} onChange={(e) => setRelText(e.target.value)} placeholder="graduation, sekolah" />
              </div>
              <div>
                <Label>FAQ JSON — array of {`{question, answer}`}</Label>
                <Textarea rows={6} className="font-mono text-xs" value={faqText} onChange={(e) => setFaqText(e.target.value)} />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Label htmlFor="indexable">Indexable (include in sitemap, allow search engines)</Label>
                <Switch id="indexable" checked={form.is_indexable} onCheckedChange={(v) => setForm({ ...form, is_indexable: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {form.id ? "Save changes" : "Create page"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}