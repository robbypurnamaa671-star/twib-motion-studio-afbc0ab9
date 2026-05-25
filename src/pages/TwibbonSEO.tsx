import { useEffect, useState, useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Layers, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import UserMenu from "@/components/UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const BASE_URL = "https://twibmotion.com";

interface FaqItem { question: string; answer: string }

interface SeoPage {
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
}

interface Template {
  id: string;
  title: string;
  bottom_layer_url: string;
  canvas_ratio: string;
  canvas_w: number;
  canvas_h: number;
}

const TwibbonSEO = () => {
  const { keyword: slug } = useParams<{ keyword: string }>();
  const [page, setPage] = useState<SeoPage | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [related, setRelated] = useState<Pick<SeoPage, "slug" | "keyword">[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("seo_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!mounted) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const seo = data as unknown as SeoPage;
      setPage(seo);

      if (seo.featured_template_ids?.length) {
        const { data: tpls } = await supabase
          .from("shared_templates")
          .select("id, title, bottom_layer_url, canvas_ratio, canvas_w, canvas_h")
          .in("id", seo.featured_template_ids);
        if (mounted) setTemplates((tpls as Template[]) || []);
      }
      if (seo.related_slugs?.length) {
        const { data: rel } = await supabase
          .from("seo_pages")
          .select("slug, keyword")
          .in("slug", seo.related_slugs)
          .eq("is_indexable", true);
        if (mounted) setRelated((rel as Pick<SeoPage, "slug" | "keyword">[]) || []);
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [slug]);

  const canonical = `${BASE_URL}/twibbon/${slug}`;

  const jsonLd = useMemo(() => {
    if (!page) return undefined;
    const blocks: object[] = [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.meta_description,
        url: canonical,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL + "/" },
          { "@type": "ListItem", position: 2, name: "Twibbon", item: BASE_URL + "/twibbon" },
          { "@type": "ListItem", position: 3, name: page.keyword, item: canonical },
        ],
      },
    ];
    if (page.faq_json?.length) {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faq_json.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }
    return blocks;
  }, [page, canonical]);

  if (notFound) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={page?.title}
        description={page?.meta_description}
        canonical={canonical}
        ogUrl={canonical}
        ogType="article"
        noindex={page ? !page.is_indexable : false}
        jsonLd={jsonLd}
      />

      <header>
        <nav className="border-b border-border px-6 py-4 flex items-center justify-between" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-2" aria-label="TwibMotion home">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-mono font-bold text-lg text-foreground tracking-tight">TwibMotion</span>
          </Link>
          <UserMenu />
        </nav>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        {loading || !page ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-muted-foreground">Twibbon</span>
              <span className="mx-2">/</span>
              <span className="text-foreground">{page.keyword}</span>
            </nav>

            <section className="mb-12">
              <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4 leading-tight">
                Create {page.keyword} Twibbon Online
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">{page.intro_text}</p>
              <Link
                to="/editor"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity glow-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Create your ${page.keyword} twibbon now`}
              >
                Create Your Twibbon Now <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            {templates.length > 0 && (
              <section aria-label="Featured templates" className="mb-12 border-t border-border pt-10">
                <h2 className="text-xl font-mono font-bold text-foreground mb-6">Featured {page.keyword} Templates</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {templates.map((t) => (
                    <Link
                      key={t.id}
                      to={`/use-template/${t.id}`}
                      className="block rounded-lg overflow-hidden border border-border hover:border-primary/60 transition-colors"
                    >
                      <img
                        src={t.bottom_layer_url}
                        alt={`${page.keyword} twibbon template – ${t.title}`}
                        loading="lazy"
                        decoding="async"
                        width={t.canvas_w}
                        height={t.canvas_h}
                        className="w-full h-auto object-cover bg-muted"
                      />
                      <div className="p-3">
                        <div className="text-sm font-mono text-foreground truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.canvas_ratio}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section aria-label="How to create a twibbon" className="mb-12 border-t border-border pt-10">
              <h2 className="text-xl font-mono font-bold text-foreground mb-6">How to Create a {page.keyword} Twibbon</h2>
              <ol className="space-y-4 list-decimal list-inside text-foreground">
                <li><span className="font-semibold">Open the editor</span> — pick a canvas ratio that fits the platform you'll share on.</li>
                <li><span className="font-semibold">Upload your photo, GIF, or video</span> as the bottom layer.</li>
                <li><span className="font-semibold">Add the {page.keyword} twibbon frame</span> on top, then scale and position your media.</li>
                <li><span className="font-semibold">Export</span> as a high-quality image or animated file and share instantly.</li>
              </ol>
            </section>

            {page.faq_json?.length > 0 && (
              <section aria-label="Frequently asked questions" className="mb-12 border-t border-border pt-10">
                <h2 className="text-xl font-mono font-bold text-foreground mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {page.faq_json.map((f, i) => (
                    <div key={i}>
                      <h3 className="font-mono font-semibold text-foreground mb-2">{f.question}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section aria-label="Create your twibbon" className="mb-12 border-t border-border pt-10 text-center">
              <h2 className="text-2xl font-mono font-bold text-foreground mb-4">Ready to design your {page.keyword} twibbon?</h2>
              <Link
                to="/editor"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity"
              >
                Open the Editor <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            {related.length > 0 && (
              <section aria-label="Related twibbon keywords" className="border-t border-border pt-10">
                <h2 className="text-xl font-mono font-bold text-foreground mb-6">Related Twibbon Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      to={`/twibbon/${r.slug}`}
                      className="px-3 py-2 rounded-lg border border-border text-sm font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors"
                    >
                      Twibbon {r.keyword}
                    </Link>
                  ))}
                  <Link to="/" className="px-3 py-2 rounded-lg border border-border text-sm font-mono text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors">
                    All twibbon tools
                  </Link>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border px-6 py-6 text-center flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">TwibMotion — Free Twibbon Maker</p>
        <LanguageSwitcher />
      </footer>
    </div>
  );
};

export default TwibbonSEO;