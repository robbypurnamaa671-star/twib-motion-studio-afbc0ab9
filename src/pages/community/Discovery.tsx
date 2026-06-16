import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { TemplateGrid } from "@/components/community/TemplateGrid";
import { breadcrumbJsonLd } from "@/lib/seo-content";
import {
  fetchTrending,
  fetchNewest,
  fetchMostLiked,
  fetchFeatured,
  fetchTopFavorited,
  type CommunityTemplate,
} from "@/lib/community-queries";

const BASE = "https://twib-motion-studio.lovable.app";

export type DiscoveryKind = "trending" | "new" | "popular" | "featured" | "favorites";

const META: Record<DiscoveryKind, { path: string; h1: string; title: string; description: string; breadcrumb: string }> = {
  trending: {
    path: "/trending",
    h1: "Trending Twibbon Templates",
    title: "Trending Template Twibbon | TwibMotion",
    description: "Template twibbon paling trending minggu ini di TwibMotion — naik daun berdasarkan views, uses, dan favorites.",
    breadcrumb: "Trending",
  },
  new: {
    path: "/new",
    h1: "New Twibbon Templates",
    title: "Template Twibbon Terbaru | TwibMotion",
    description: "Template twibbon terbaru dari komunitas TwibMotion — selalu fresh, langsung bisa dipakai.",
    breadcrumb: "New",
  },
  popular: {
    path: "/popular",
    h1: "Popular Twibbon Templates",
    title: "Template Twibbon Paling Populer | TwibMotion",
    description: "Template twibbon paling banyak disukai di TwibMotion. Ranking berdasarkan favorites pengguna.",
    breadcrumb: "Popular",
  },
  featured: {
    path: "/featured",
    h1: "Featured Twibbon Templates",
    title: "Featured Template Twibbon | TwibMotion",
    description: "Template twibbon pilihan tim TwibMotion. Kurasi terbaik untuk berbagai event.",
    breadcrumb: "Featured",
  },
  favorites: {
    path: "/favorites",
    h1: "Most Favorited Twibbon Templates",
    title: "Template Twibbon Paling Difavoritkan | TwibMotion",
    description: "Template twibbon yang paling banyak difavoritkan oleh komunitas TwibMotion.",
    breadcrumb: "Favorites",
  },
};

const LOADER: Record<DiscoveryKind, () => Promise<CommunityTemplate[]>> = {
  trending: () => fetchTrending("week", 48),
  new: () => fetchNewest(48),
  popular: () => fetchMostLiked(48),
  featured: () => fetchFeatured(48),
  favorites: () => fetchTopFavorited(48),
};

export default function Discovery({ kind }: { kind: DiscoveryKind }) {
  const meta = META[kind];
  const [items, setItems] = useState<CommunityTemplate[]>([]);
  useEffect(() => { LOADER[kind]().then(setItems); }, [kind]);

  const url = `${BASE}${meta.path}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: meta.title,
      url,
      description: meta.description,
    },
    breadcrumbJsonLd(BASE, [
      { name: "Home", path: "/" },
      { name: "Community", path: "/community" },
      { name: meta.breadcrumb, path: meta.path },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: items.slice(0, 20).map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE}/template/${t.slug || t.id}`,
        name: t.title,
      })),
    },
  ];

  return (
    <SeoShell>
      <SEOHead title={meta.title} description={meta.description} canonical={url} ogUrl={url} jsonLd={jsonLd} />
      <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-3">{meta.h1}</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">{meta.description}</p>
      <TemplateGrid items={items} emptyText="Belum ada template di sini." />
    </SeoShell>
  );
}