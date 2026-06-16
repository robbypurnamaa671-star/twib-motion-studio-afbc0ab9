import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { TemplateGrid } from "@/components/community/TemplateGrid";
import { breadcrumbJsonLd } from "@/lib/seo-content";
import {
  fetchCollectionBySlug,
  fetchTemplatesForCollection,
  type Collection,
  type CommunityTemplate,
} from "@/lib/community-queries";

const BASE = "https://twib-motion-studio.lovable.app";

export default function CollectionPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [c, setC] = useState<Collection | null>(null);
  const [items, setItems] = useState<CommunityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const col = await fetchCollectionBySlug(slug);
      if (!col) { setNotFound(true); setLoading(false); return; }
      setC(col);
      const t = await fetchTemplatesForCollection(col);
      setItems(t);
      setLoading(false);
    })();
  }, [slug]);

  if (notFound) return <Navigate to="/collections" replace />;

  const url = `${BASE}/collections/${slug}`;
  const title = c ? `Koleksi ${c.title} | TwibMotion` : undefined;
  const description = c?.description || (c ? `Koleksi template twibbon ${c.title} dari komunitas TwibMotion.` : undefined);
  const jsonLd = c && [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url, description },
    breadcrumbJsonLd(BASE, [
      { name: "Home", path: "/" },
      { name: "Collections", path: "/collections" },
      { name: c.title, path: `/collections/${slug}` },
    ]),
  ];

  return (
    <SeoShell>
      <SEOHead title={title} description={description} canonical={url} ogUrl={url} noindex={c?.is_indexable === false} jsonLd={jsonLd || undefined} />
      {loading || !c ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link> <span className="mx-2">/</span>
            <Link to="/collections" className="hover:text-primary">Collections</Link> <span className="mx-2">/</span>
            <span className="text-foreground">{c.title}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-3">{c.title}</h1>
          {c.description && <p className="text-muted-foreground mb-8 max-w-2xl">{c.description}</p>}
          <TemplateGrid items={items} emptyText="Belum ada template di koleksi ini." />
        </>
      )}
    </SeoShell>
  );
}