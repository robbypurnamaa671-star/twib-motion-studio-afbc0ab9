import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { breadcrumbJsonLd } from "@/lib/seo-content";

const BASE_URL = "https://twibmotion.com";

type Tpl = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  bottom_layer_url: string;
  preview_url: string | null;
  canvas_ratio: string;
  canvas_w: number;
  canvas_h: number;
  created_at: string;
};

const TemplateSEO = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tpl, setTpl] = useState<Tpl | null>(null);
  const [related, setRelated] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shared_templates")
        .select("id,title,slug,description,category,tags,bottom_layer_url,preview_url,canvas_ratio,canvas_w,canvas_h,created_at")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      if (!mounted) return;
      if (!data) { setNotFound(true); setLoading(false); return; }
      setTpl(data as Tpl);
      let rq = supabase
        .from("shared_templates")
        .select("id,title,slug,description,category,tags,bottom_layer_url,preview_url,canvas_ratio,canvas_w,canvas_h,created_at")
        .eq("is_public", true)
        .neq("slug", slug)
        .limit(6);
      if (data.category) rq = rq.eq("category", data.category);
      const { data: rel } = await rq;
      if (mounted) {
        setRelated((rel as Tpl[]) || []);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  const canonical = `${BASE_URL}/template/${slug}`;
  const title = tpl ? `Template Twibbon ${tpl.title} Gratis | TwibMotion` : undefined;
  const description = tpl
    ? `Gunakan dan kustomisasi Template Twibbon ${tpl.title} online secara gratis. Upload foto, GIF, atau video — export HD langsung dari browser.`
    : undefined;
  const imageUrl = tpl?.preview_url || tpl?.bottom_layer_url || "";
  const altText = tpl ? `Template Twibbon ${tpl.title}` : "";
  const downloadName = tpl ? `template-twibbon-${tpl.slug}.png` : "template.png";

  const jsonLd = useMemo(() => {
    if (!tpl) return undefined;
    return [
      {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: tpl.title,
        description,
        url: canonical,
        image: imageUrl,
        dateCreated: tpl.created_at,
        keywords: (tpl.tags || []).join(", "),
        genre: tpl.category || undefined,
      },
      {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        contentUrl: imageUrl,
        url: imageUrl,
        name: altText,
        caption: altText,
        description,
        width: tpl.canvas_w,
        height: tpl.canvas_h,
        license: canonical,
        acquireLicensePage: canonical,
      },
      breadcrumbJsonLd(BASE_URL, [
        { name: "Home", path: "/" },
        { name: "Templates", path: "/use-template" },
        ...(tpl.category ? [{ name: tpl.category, path: `/use-template?category=${encodeURIComponent(tpl.category)}` }] : []),
        { name: tpl.title, path: `/template/${slug}` },
      ]),
    ];
  }, [tpl, canonical, slug, description, imageUrl, altText]);

  if (notFound) return <Navigate to="/" replace />;

  return (
    <SeoShell>
      <SEOHead title={title} description={description} canonical={canonical} ogUrl={canonical} ogType="article" jsonLd={jsonLd} />
      {loading || !tpl ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/use-template" className="hover:text-primary">Templates</Link>
            {tpl.category && (
              <>
                <span className="mx-2">/</span>
                <Link to={`/use-template?category=${encodeURIComponent(tpl.category)}`} className="hover:text-primary">{tpl.category}</Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-foreground">{tpl.title}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4">
            Template Twibbon {tpl.title}
          </h1>
          <p className="text-muted-foreground text-lg mb-6">{description}</p>

          <figure className="mb-8">
            <img
              src={imageUrl}
              alt={altText}
              title={altText}
              width={tpl.canvas_w}
              height={tpl.canvas_h}
              className="w-full max-w-md rounded-lg border border-border bg-muted"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="sr-only">{altText}</figcaption>
          </figure>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Link
              to={`/use-template/${tpl.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity"
            >
              Gunakan Template Ini <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={imageUrl}
              download={downloadName}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors"
            >
              Download Preview
            </a>
          </div>

          {tpl.description && (
            <section className="mb-8">
              <h2 className="text-xl font-mono font-bold text-foreground mb-3">Tentang Template</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{tpl.description}</p>
            </section>
          )}

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 text-sm">
            {tpl.category && (
              <div>
                <dt className="font-mono text-muted-foreground">Kategori</dt>
                <dd className="text-foreground">
                  <Link className="hover:text-primary" to={`/use-template?category=${encodeURIComponent(tpl.category)}`}>{tpl.category}</Link>
                </dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-muted-foreground">Rasio</dt>
              <dd className="text-foreground">{tpl.canvas_ratio}</dd>
            </div>
            <div>
              <dt className="font-mono text-muted-foreground">Ukuran</dt>
              <dd className="text-foreground">{tpl.canvas_w}×{tpl.canvas_h}</dd>
            </div>
          </dl>

          {tpl.tags && tpl.tags.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tpl.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/twibbon/${t.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-xs font-mono px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="mt-12 border-t border-border pt-10">
              <h2 className="text-xl font-mono font-bold text-foreground mb-6">
                Template {tpl.category ? tpl.category : "Lainnya"}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {related.map((m) => (
                  <Link key={m.id} to={`/template/${m.slug}`} className="group block">
                    <div className="aspect-square rounded-lg border border-border bg-muted overflow-hidden mb-2">
                      <img
                        src={m.preview_url || m.bottom_layer_url}
                        alt={`Template Twibbon ${m.title}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-sm font-mono text-foreground group-hover:text-primary truncate">{m.title}</p>
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Jelajahi lebih banyak di <Link to="/use-template" className="text-primary hover:underline">galeri template</Link> atau baca tips di <Link to="/blog" className="text-primary hover:underline">blog</Link>.
              </p>
            </section>
          )}
        </>
      )}
    </SeoShell>
  );
};

export default TemplateSEO;