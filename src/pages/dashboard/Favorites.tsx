import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FavRow {
  template_id: string;
  shared_templates: {
    id: string;
    slug: string | null;
    title: string;
    preview_url: string | null;
    bottom_layer_url: string;
    owner_id: string;
  } | null;
}

export default function Favorites() {
  const { user } = useAuth();
  const [rows, setRows] = useState<FavRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("template_favorites")
      .select("template_id, shared_templates(id, slug, title, preview_url, bottom_layer_url, owner_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as FavRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const unfavorite = async (templateId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("template_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("template_id", templateId);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    setRows((r) => r.filter((row) => row.template_id !== templateId));
  };

  return (
    <DashboardLayout title="Favorites" description="Templates you've saved.">
      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You haven't favorited any templates yet. Browse the <Link to="/" className="text-primary underline">community gallery</Link>.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {rows.map((r) => {
            const t = r.shared_templates;
            if (!t) return null;
            return (
              <div key={t.id} className="relative group">
                <Link
                  to={`/template/${t.slug || t.id}`}
                  className="block aspect-square overflow-hidden rounded-lg border border-border bg-card"
                >
                  {(t.preview_url || t.bottom_layer_url) && (
                    <ProgressiveImage src={(t.preview_url || t.bottom_layer_url)!} alt={t.title} />
                  )}
                </Link>
                <button
                  onClick={() => unfavorite(t.id)}
                  aria-label="Remove from favorites"
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur border border-border text-primary"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
                <p className="text-xs font-mono text-foreground truncate mt-2">{t.title}</p>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}