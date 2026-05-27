import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { breadcrumbJsonLd } from "@/lib/seo-content";

const BASE_URL = "https://twibmotion.com";

const TemplateSEO = () => {
  const { slug } = useParams<{ slug: string }>();
  const [row, setRow] = useState<any>(null);
  const [tpl, setTpl] = useState<any>(null);
  const [more, setMore] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      const { data } = await (supabase.from("template_seo") as any).select("*").eq("slug", slug).eq("is_indexable", true).maybeSingle();
      if (!mounted) return;
      if (!data) { setNotFound(true); setLoading(false); return; }
      setRow(data);
      const { data: t } = await supabase.from("shared_templates").select("id, title, bottom_layer_url, canvas_ratio, canvas_w, canvas_h").eq("id", data.template_id).maybeSingle();
      if (mounted) setTpl(t);
      const { data: others } = await (supabase.from("template_seo") as any).select("slug, title").eq("is_indexable", true).neq("slug", slug).limit(6);
      if (mounted) { setMore((others as any[]) || []); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [slug]);

  const canonical = `${BASE_URL}/template/${slug}`;
  const jsonLd = useMemo(() => {
    if (!row || !tpl) return undefined;
    return [
      { "@context": "https://schema.org", "@type": "CreativeWork", name: row.title, description: row.meta_description, url: canonical, image: tpl.bottom_layer_url },
      breadcrumbJsonLd(BASE_URL, [{ name: "Home", path: "/" }, { name: "Templates", path: "/use-template" }, { name: row.title, path: `/template/${slug}` }]),
    ];
  }, [row, tpl, canonical, slug]);

  if (notFound) return <Navigate to="/" replace />;

  return (
    <SeoShell>
      <SEOHead title={row?.title} description={row?.meta_description} canonical={canonical} ogUrl={canonical} ogType="article" jsonLd={jsonLd} />
      {loading || !row || !tpl ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Template</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4">{row.title}</h1>
          <p className="text-muted-foreground text-lg mb-6">{row.meta_description}</p>
          <img src={tpl.bottom_layer_url} alt={row.title} width={tpl.canvas_w} height={tpl.canvas_h} className="w-full max-w-md rounded-lg border border-border bg-muted mb-6" loading="lazy" />
          <Link to={`/use-template/${tpl.id}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity">
            Use This Template <ArrowRight className="w-4 h-4" />
          </Link>
          {row.intro_text && <p className="mt-8 text-muted-foreground leading-relaxed">{row.intro_text}</p>}
          {row.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {row.tags.map((t: string) => <span key={t} className="text-xs font-mono px-2 py-1 rounded border border-border text-muted-foreground">#{t}</span>)}
            </div>
          )}
          {more.length > 0 && (
            <section className="mt-12 border-t border-border pt-10">
              <h2 className="text-xl font-mono font-bold text-foreground mb-6">More Templates</h2>
              <div className="flex flex-wrap gap-2">
                {more.map((m) => (
                  <Link key={m.slug} to={`/template/${m.slug}`} className="px-3 py-2 rounded-lg border border-border text-sm font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors">{m.title}</Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </SeoShell>
  );
};

export default TemplateSEO;