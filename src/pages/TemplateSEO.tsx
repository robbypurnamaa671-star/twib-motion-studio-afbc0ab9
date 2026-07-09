import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { breadcrumbJsonLd } from "@/lib/seo-content";
import { trackView } from "@/lib/view-tracking";
import { FavoriteButton } from "@/components/community/FavoriteButton";
import { StatBadges } from "@/components/community/StatBadges";
import { RelatedRail } from "@/components/community/RelatedRail";
import { ShareBar } from "@/components/share/ShareBar";
import { CloneButton } from "@/components/share/CloneButton";
import { EmbedCodeDialog } from "@/components/share/EmbedCodeDialog";
import { BadgeChip, computeBadges } from "@/components/community/BadgeChip";
import { useAuth } from "@/contexts/AuthContext";

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
  owner_id?: string | null;
  view_count?: number | null;
  usage_count?: number | null;
  like_count?: number | null;
  download_count?: number | null;
  is_public?: boolean | null;
  profiles?: { username: string | null; display_name: string | null; avatar_url: string | null; bio: string | null } | null;
};

const TemplateSEO = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [tpl, setTpl] = useState<Tpl | null>(null);
  const [related, setRelated] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [meUsername, setMeUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setMeUsername(null); return; }
    supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setMeUsername((data as { username: string | null } | null)?.username ?? null));
  }, [user]);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shared_templates")
        .select("id,title,slug,description,category,tags,bottom_layer_url,preview_url,canvas_ratio,canvas_w,canvas_h,created_at,owner_id,view_count,usage_count,like_count,download_count,is_public,profiles:owner_id(username,display_name,avatar_url,bio)")
        .eq("slug", slug)
        .is("deleted_at", null)
        .maybeSingle();
      if (!mounted) return;
      if (!data) { setNotFound(true); setLoading(false); return; }
      setTpl(data as unknown as Tpl);
      trackView((data as { id: string }).id);
      if (!(data as Tpl).is_public) {
        setRelated([]);
        setLoading(false);
        return;
      }
      let rq = supabase
        .from("shared_templates")
        .select("id,title,slug,description,category,tags,bottom_layer_url,preview_url,canvas_ratio,canvas_w,canvas_h,created_at,profiles:owner_id(username,display_name,avatar_url)")
        .eq("is_public", true)
        .is("deleted_at", null)
        .neq("slug", slug)
        .limit(6);
      if (data.category) rq = rq.eq("category", data.category);
      const { data: rel } = await rq;
      if (mounted) {
        setRelated(((rel as unknown) as Tpl[]) || []);
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
  const ogAlt = tpl
    ? `Template Twibbon ${tpl.title}${tpl.profiles?.username ? ` oleh @${tpl.profiles.username}` : ""}`
    : altText;
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
      <SEOHead
        title={title}
        description={description}
        canonical={canonical}
        ogUrl={canonical}
        ogType="article"
        ogImage={imageUrl || undefined}
        ogImageAlt={ogAlt}
        ogImageWidth={tpl?.canvas_w || undefined}
        ogImageHeight={tpl?.canvas_h || undefined}
        jsonLd={jsonLd}
        noindex={tpl ? !tpl.is_public : undefined}
      />
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

          <div className="flex flex-wrap gap-1.5 mb-4">
            {computeBadges({
              is_trending: undefined,
              is_featured: undefined,
              is_staff_pick: undefined,
              usage_count: tpl.usage_count,
              view_count: tpl.view_count,
              like_count: tpl.like_count,
              created_at: tpl.created_at,
            }).map((b) => (
              <BadgeChip key={b} kind={b} />
            ))}
          </div>

          <StatBadges
            views={tpl.view_count}
            uses={tpl.usage_count}
            downloads={tpl.download_count}
            likes={tpl.like_count}
            publishedAt={tpl.created_at}
          />

          {tpl.profiles?.username && (
            <Link
              to={`/creator/${tpl.profiles.username}`}
              className="inline-flex items-center gap-3 mb-6 p-3 rounded-lg border border-border bg-card hover:border-primary/60 transition-colors"
            >
              {tpl.profiles.avatar_url ? (
                <img src={tpl.profiles.avatar_url} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-mono">
                  {(tpl.profiles.display_name || tpl.profiles.username || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs text-muted-foreground font-mono">Dibuat oleh</div>
                <div className="text-sm font-mono font-bold text-foreground">
                  {tpl.profiles.display_name || `@${tpl.profiles.username}`}
                </div>
              </div>
            </Link>
          )}

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
            <CloneButton templateId={tpl.id} slug={tpl.slug} />
            <a
              href={imageUrl}
              download={downloadName}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors"
            >
              Download Preview
            </a>
            <FavoriteButton templateId={tpl.id} size="md" />
            <EmbedCodeDialog slug={tpl.slug} />
          </div>

          <div className="mb-8">
            <ShareBar url={canonical} title={`Template Twibbon ${tpl.title} on TwibMotion`} refUsername={meUsername} />
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
                    {m.profiles?.username && (
                      <p className="text-[11px] font-mono text-muted-foreground truncate">@{m.profiles.username}</p>
                    )}
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Jelajahi lebih banyak di <Link to="/use-template" className="text-primary hover:underline">galeri template</Link> atau baca tips di <Link to="/blog" className="text-primary hover:underline">blog</Link>.
              </p>
            </section>
          )}

          <RelatedRail
            templateId={tpl.id}
            ownerId={tpl.owner_id ?? null}
            category={tpl.category}
            tags={tpl.tags}
            creatorUsername={tpl.profiles?.username ?? null}
          />
        </>
      )}
    </SeoShell>
  );
};

export default TemplateSEO;