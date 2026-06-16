import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { TemplateGrid } from "@/components/community/TemplateGrid";
import { CreatorCard } from "@/components/community/CreatorCard";
import { breadcrumbJsonLd } from "@/lib/seo-content";
import {
  fetchByCategory,
  fetchFeaturedCreators,
  type CommunityTemplate,
  type FeaturedCreator,
} from "@/lib/community-queries";

const BASE = "https://twib-motion-studio.lovable.app";

export default function CommunityCategory() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [top, setTop] = useState<CommunityTemplate[]>([]);
  const [fresh, setFresh] = useState<CommunityTemplate[]>([]);
  const [creators, setCreators] = useState<FeaturedCreator[]>([]);
  const pretty = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  useEffect(() => {
    fetchByCategory(slug, 24).then((rows) => {
      setTop([...rows].sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0)));
      setFresh([...rows].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 12));
    });
    fetchFeaturedCreators(6).then(setCreators);
  }, [slug]);

  const url = `${BASE}/community/category/${slug}`;
  const title = `Template Twibbon ${pretty} | Komunitas TwibMotion`;
  const description = `Koleksi template twibbon ${pretty} dari kreator komunitas TwibMotion. Gunakan gratis, edit di browser, export HD.`;

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url, description },
    breadcrumbJsonLd(BASE, [
      { name: "Home", path: "/" },
      { name: "Community", path: "/community" },
      { name: pretty, path: `/community/category/${slug}` },
    ]),
  ];

  return (
    <SeoShell>
      <SEOHead title={title} description={description} canonical={url} ogUrl={url} jsonLd={jsonLd} />
      <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary">Home</Link> <span className="mx-2">/</span>
        <Link to="/community" className="hover:text-primary">Community</Link> <span className="mx-2">/</span>
        <span className="text-foreground">{pretty}</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-3">Template Twibbon {pretty}</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">{description}</p>

      <h2 className="text-xl font-mono font-bold text-foreground mb-4">Top Templates</h2>
      <TemplateGrid items={top.slice(0, 12)} emptyText={`Belum ada template ${pretty}.`} />

      {fresh.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">New in {pretty}</h2>
          <TemplateGrid items={fresh} />
        </section>
      )}

      {creators.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">Featured Creators</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {creators.map((c) => <CreatorCard key={c.user_id} c={c} />)}
          </div>
        </section>
      )}
    </SeoShell>
  );
}