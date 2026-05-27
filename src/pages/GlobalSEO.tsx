import { useEffect, useState, useMemo } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import SeoLanding from "@/components/seo/SeoLanding";
import { breadcrumbJsonLd, howToJsonLd, DEFAULT_HOWTO } from "@/lib/seo-content";
import { fetchRelatedSeoPages, fetchCategoryPages, type RelatedLink } from "@/lib/seo-links";

const BASE_URL = "https://twibmotion.com";

const GlobalSEO = () => {
  const { pathname } = useLocation();
  const [page, setPage] = useState<any>(null);
  const [related, setRelated] = useState<RelatedLink[]>([]);
  const [categoryRelated, setCategoryRelated] = useState<RelatedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from("seo_pages") as any).select("*").eq("route_path", pathname).eq("page_type", "global").maybeSingle();
      if (!mounted) return;
      if (!data) { setNotFound(true); setLoading(false); return; }
      setPage(data);
      const tasks: Promise<void>[] = [];
      tasks.push((async () => { const r = await fetchRelatedSeoPages(data.related_slugs || []); if (mounted) setRelated(r); })());
      if (data.category) tasks.push((async () => { const r = await fetchCategoryPages(data.category, data.slug); if (mounted) setCategoryRelated(r); })());
      await Promise.all(tasks);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [pathname]);

  const canonical = `${BASE_URL}${pathname}`;

  const jsonLd = useMemo(() => {
    if (!page) return undefined;
    const blocks: object[] = [
      { "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.meta_description, url: canonical },
      breadcrumbJsonLd(BASE_URL, [
        { name: "Home", path: "/" },
        { name: page.keyword, path: pathname },
      ]),
      howToJsonLd(`How to create a ${page.keyword}`, page.howto_json?.length ? page.howto_json : DEFAULT_HOWTO),
    ];
    if (page.faq_json?.length) {
      blocks.push({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: page.faq_json.map((f: any) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
      });
    }
    return blocks;
  }, [page, canonical, pathname]);

  if (notFound) return <Navigate to="/" replace />;

  return (
    <SeoShell>
      <SEOHead title={page?.title} description={page?.meta_description} canonical={canonical} ogUrl={canonical} ogType="article" noindex={page ? !page.is_indexable : false} jsonLd={jsonLd} />
      {loading || !page ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{page.keyword}</span>
          </nav>
          <SeoLanding keyword={page.keyword} h1={page.h1} intro={page.intro_text} faq={page.faq_json || []} benefits={page.benefits_json || []} howto={page.howto_json || []} related={related} categoryRelated={categoryRelated} />
        </>
      )}
    </SeoShell>
  );
};

export default GlobalSEO;