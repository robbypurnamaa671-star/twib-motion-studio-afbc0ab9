import { useEffect, useState, useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import SeoLanding from "@/components/seo/SeoLanding";
import { breadcrumbJsonLd, howToJsonLd, DEFAULT_HOWTO } from "@/lib/seo-content";
import { fetchRelatedSeoPages, fetchCategoryPages, fetchRelatedBlogPosts, type RelatedLink } from "@/lib/seo-links";

const BASE_URL = "https://twibmotion.com";

interface FaqItem { question: string; answer: string }
interface BenefitItem { title: string; description: string }
interface HowtoItem { title: string; description: string }

interface SeoPage {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  meta_description: string;
  intro_text: string;
  h1: string | null;
  category: string | null;
  faq_json: FaqItem[];
  benefits_json: BenefitItem[];
  howto_json: HowtoItem[];
  featured_template_ids: string[];
  related_slugs: string[];
  is_indexable: boolean;
}

interface Template {
  id: string; title: string; bottom_layer_url: string;
  canvas_ratio: string; canvas_w: number; canvas_h: number;
}

const TwibbonSEO = () => {
  const { keyword: slug } = useParams<{ keyword: string }>();
  const [page, setPage] = useState<SeoPage | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [related, setRelated] = useState<RelatedLink[]>([]);
  const [categoryRelated, setCategoryRelated] = useState<RelatedLink[]>([]);
  const [blogLinks, setBlogLinks] = useState<{ slug: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from("seo_pages") as any).select("*").eq("slug", slug).eq("page_type", "keyword").maybeSingle();
      if (!mounted) return;
      if (!data) { setNotFound(true); setLoading(false); return; }
      const seo = data as unknown as SeoPage;
      setPage(seo);

      const tasks: Promise<unknown>[] = [];
      if (seo.featured_template_ids?.length) {
        tasks.push(
          supabase.from("shared_templates").select("id, title, bottom_layer_url, canvas_ratio, canvas_w, canvas_h").in("id", seo.featured_template_ids).then(({ data: t }) => mounted && setTemplates((t as Template[]) || []))
        );
      }
      tasks.push(fetchRelatedSeoPages(seo.related_slugs || []).then((r) => mounted && setRelated(r)));
      if (seo.category) tasks.push(fetchCategoryPages(seo.category, seo.slug).then((r) => mounted && setCategoryRelated(r)));
      tasks.push(
        (supabase.from("blog_posts") as any).select("slug, title").contains("related_seo_slugs", [seo.slug]).eq("is_published", true).limit(5)
          .then(({ data: b }: { data: { slug: string; title: string }[] | null }) => mounted && setBlogLinks(b || []))
      );
      await Promise.all(tasks);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [slug]);

  const canonical = `${BASE_URL}/twibbon/${slug}`;

  const jsonLd = useMemo(() => {
    if (!page) return undefined;
    const blocks: object[] = [
      { "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.meta_description, url: canonical },
      breadcrumbJsonLd(BASE_URL, [
        { name: "Home", path: "/" },
        { name: "Twibbon", path: "/twibbon" },
        { name: page.keyword, path: `/twibbon/${slug}` },
      ]),
      howToJsonLd(`How to create a ${page.keyword} twibbon`, (page.howto_json?.length ? page.howto_json : DEFAULT_HOWTO)),
    ];
    if (page.faq_json?.length) {
      blocks.push({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: page.faq_json.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
      });
    }
    return blocks;
  }, [page, canonical, slug]);

  if (notFound) return <Navigate to="/" replace />;

  return (
    <SeoShell>
      <SEOHead
        title={page?.title}
        description={page?.meta_description}
        canonical={canonical}
        ogUrl={canonical}
        ogType="article"
        noindex={page ? !page.is_indexable : false}
        jsonLd={jsonLd}
      />
      {loading || !page ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-muted-foreground">Twibbon</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">{page.keyword}</span>
          </nav>
          <SeoLanding
            keyword={page.keyword}
            h1={page.h1}
            intro={page.intro_text}
            faq={page.faq_json || []}
            benefits={page.benefits_json || []}
            howto={page.howto_json || []}
            templates={templates}
            related={related}
            categoryRelated={categoryRelated}
            blogLinks={blogLinks}
          />
        </>
      )}
    </SeoShell>
  );
};

export default TwibbonSEO;