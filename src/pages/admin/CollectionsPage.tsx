import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Collection } from "@/lib/community-queries";

const EMPTY: Omit<Collection, "id" | "updated_at"> = {
  slug: "",
  title: "",
  description: "",
  cover_url: "",
  match_category: "",
  match_tags: [],
  is_published: true,
  is_indexable: true,
  sort_order: 0,
};

export default function CollectionsPage() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<typeof EMPTY>(EMPTY);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("template_collections")
      .select("*")
      .order("sort_order", { ascending: true });
    setRows((data as unknown as Collection[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createOne() {
    if (!draft.slug || !draft.title) return toast.error("Slug + title required");
    const { error } = await supabase.from("template_collections").insert(draft);
    if (error) return toast.error(error.message);
    setDraft(EMPTY);
    toast.success("Collection created");
    load();
  }

  async function update(c: Collection, patch: Partial<Collection>) {
    const { error } = await supabase.from("template_collections").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  }

  async function remove(c: Collection) {
    if (!confirm(`Delete collection "${c.title}"?`)) return;
    const { error } = await supabase.from("template_collections").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 max-w-5xl">
        <header>
          <h1 className="text-2xl font-mono font-bold">Template Collections</h1>
          <p className="text-sm text-muted-foreground">SEO landing pages that auto-aggregate public templates by category and tags.</p>
        </header>

        <section className="p-4 rounded-lg border border-border bg-card space-y-3">
          <h2 className="font-mono font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> New collection</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <input className="px-3 py-2 rounded-md border border-border bg-background" placeholder="slug (e.g. mpls-2027)" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            <input className="px-3 py-2 rounded-md border border-border bg-background" placeholder="title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <input className="px-3 py-2 rounded-md border border-border bg-background sm:col-span-2" placeholder="description" value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <input className="px-3 py-2 rounded-md border border-border bg-background" placeholder="match_category (optional)" value={draft.match_category || ""} onChange={(e) => setDraft({ ...draft, match_category: e.target.value })} />
            <input className="px-3 py-2 rounded-md border border-border bg-background" placeholder="match_tags comma-separated" value={draft.match_tags.join(",")} onChange={(e) => setDraft({ ...draft, match_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </div>
          <button onClick={createOne} className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm">Create</button>
        </section>

        <section>
          <h2 className="font-mono font-bold text-sm mb-3">Existing</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <ul className="space-y-3">
              {rows.map((c) => (
                <li key={c.id} className="p-4 rounded-lg border border-border bg-card grid sm:grid-cols-[1fr_auto] gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <code className="text-xs font-mono text-muted-foreground">/collections/{c.slug}</code>
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={c.is_published} onChange={(e) => update(c, { is_published: e.target.checked })} /> published</label>
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={c.is_indexable} onChange={(e) => update(c, { is_indexable: e.target.checked })} /> indexable</label>
                    </div>
                    <input defaultValue={c.title} className="w-full px-2 py-1 rounded border border-border bg-background text-sm" onBlur={(e) => e.target.value !== c.title && update(c, { title: e.target.value })} />
                    <textarea defaultValue={c.description || ""} className="w-full px-2 py-1 rounded border border-border bg-background text-sm" rows={2} onBlur={(e) => e.target.value !== (c.description || "") && update(c, { description: e.target.value })} />
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      <input defaultValue={c.match_category || ""} placeholder="match_category" className="px-2 py-1 rounded border border-border bg-background" onBlur={(e) => e.target.value !== (c.match_category || "") && update(c, { match_category: e.target.value || null })} />
                      <input defaultValue={c.match_tags.join(",")} placeholder="match_tags" className="px-2 py-1 rounded border border-border bg-background" onBlur={(e) => update(c, { match_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 justify-end">
                    <button onClick={() => remove(c)} className="px-2 py-1.5 rounded-md border border-destructive/40 text-destructive text-xs inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}