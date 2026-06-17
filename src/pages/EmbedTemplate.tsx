import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Loader2, ExternalLink } from "lucide-react";

type Tpl = {
  id: string; slug: string; title: string; bottom_layer_url: string; preview_url: string | null;
  profiles?: { username: string | null; display_name: string | null } | null;
};

export default function EmbedTemplate() {
  const { slug } = useParams<{ slug: string }>();
  const [tpl, setTpl] = useState<Tpl | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("shared_templates")
        .select("id,slug,title,bottom_layer_url,preview_url,profiles:owner_id(username,display_name)")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      setTpl(data as unknown as Tpl | null);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead title={tpl ? `${tpl.title} · Embed` : "Embed"} noindex canonical={`https://twibmotion.com/embed/${slug}`} />
      {loading || !tpl ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="flex-1 flex flex-col p-3 gap-3">
          <a href={`https://twibmotion.com/template/${tpl.slug}`} target="_blank" rel="noopener" className="flex-1 block rounded-lg overflow-hidden bg-card border border-border">
            <img src={tpl.preview_url || tpl.bottom_layer_url} alt={tpl.title} className="w-full h-full object-contain" />
          </a>
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="min-w-0">
              <p className="text-foreground font-semibold truncate">{tpl.title}</p>
              {tpl.profiles?.username && <p className="text-muted-foreground truncate">by @{tpl.profiles.username}</p>}
            </div>
            <Link to={`/use-template/${tpl.id}`} target="_top" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground whitespace-nowrap">
              Use on TwibMotion <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}