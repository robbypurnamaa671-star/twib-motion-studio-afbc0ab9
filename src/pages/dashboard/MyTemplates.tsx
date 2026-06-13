import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { Eye, MousePointerClick, Trash2, Edit3, Globe, Lock, Save, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Template {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  preview_url: string | null;
  bottom_layer_url: string;
  visibility: string;
  is_public: boolean;
  view_count: number;
  usage_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
}

type Tab = "all" | "public" | "private" | "draft";

export default function MyTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("shared_templates")
      .select("id, slug, title, description, category, tags, preview_url, bottom_layer_url, visibility, is_public, view_count, usage_count, download_count, created_at, updated_at")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    setTemplates((data ?? []) as Template[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(
    () => (tab === "all" ? templates : templates.filter((t) => t.visibility === tab)),
    [templates, tab],
  );

  const softDelete = async (id: string) => {
    if (!confirm("Move this template to trash? It will be hidden from the community.")) return;
    const { error } = await supabase
      .from("shared_templates")
      .update({ deleted_at: new Date().toISOString(), is_public: false, visibility: "private" })
      .eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Template deleted" });
    load();
  };

  const togglePublish = async (t: Template) => {
    const next = t.visibility === "public" ? "private" : "public";
    const { error } = await supabase
      .from("shared_templates")
      .update({
        visibility: next,
        is_public: next === "public",
        published_at: next === "public" ? new Date().toISOString() : null,
      })
      .eq("id", t.id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: next === "public" ? "Published to community" : "Removed from community" });
    load();
  };

  return (
    <DashboardLayout title="My Templates" description="Manage your twibbon templates.">
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["all", "public", "private", "draft"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest border transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground"
            }`}
          >
            {t}
            {tab === t || t === "all" ? "" : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No templates here yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <article key={t.id} className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
              <div className="aspect-square bg-secondary relative">
                {(t.preview_url || t.bottom_layer_url) && (
                  <ProgressiveImage src={(t.preview_url || t.bottom_layer_url)!} alt={t.title} />
                )}
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest ${
                    t.visibility === "public"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : t.visibility === "draft"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {t.visibility}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-mono font-bold truncate" title={t.title}>
                  {t.title}
                </h3>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground font-mono">
                  <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {t.view_count ?? 0}</span>
                  <span className="inline-flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {t.usage_count ?? 0}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">
                  Updated {new Date(t.updated_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setEditing(t)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-border text-xs font-mono hover:bg-secondary"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => togglePublish(t)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-border text-xs font-mono hover:bg-secondary"
                  >
                    {t.visibility === "public" ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    {t.visibility === "public" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => softDelete(t.id)}
                    className="inline-flex items-center justify-center px-2 py-1.5 rounded-md border border-destructive/40 text-destructive text-xs hover:bg-destructive/10"
                    aria-label="Delete template"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <EditDrawer
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function EditDrawer({
  template,
  onClose,
  onSaved,
}: {
  template: Template;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description ?? "");
  const [category, setCategory] = useState(template.category ?? "");
  const [tagsStr, setTagsStr] = useState((template.tags ?? []).join(", "));
  const [visibility, setVisibility] = useState(template.visibility);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const tags = tagsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    const { error } = await supabase
      .from("shared_templates")
      .update({
        title: title.trim() || "Untitled Template",
        description: description.trim() || null,
        category: category.trim() || null,
        tags,
        visibility,
        is_public: visibility === "public",
        published_at:
          visibility === "public" && template.visibility !== "public"
            ? new Date().toISOString()
            : undefined,
      })
      .eq("id", template.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved" });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-card border-l border-border p-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono font-bold">Edit template</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <LabeledInput label="Title" value={title} onChange={setTitle} maxLength={100} />
          <LabeledTextarea label="Description" value={description} onChange={setDescription} maxLength={500} />
          <LabeledInput label="Category" value={category} onChange={setCategory} maxLength={40} />
          <LabeledInput
            label="Tags (comma-separated)"
            value={tagsStr}
            onChange={setTagsStr}
            placeholder="ramadan, modern, green"
          />
          <label className="block">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Visibility</span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="draft">Draft</option>
              <option value="private">Private</option>
              <option value="public">Public (community)</option>
            </select>
          </label>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-none"
      />
    </label>
  );
}