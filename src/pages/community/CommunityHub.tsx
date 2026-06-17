import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, TrendingUp, Eye, Wand2, Sparkles, Users, Tag } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { TemplateGrid } from "@/components/community/TemplateGrid";
import { CreatorCard } from "@/components/community/CreatorCard";
import StatsStrip from "@/components/community/StatsStrip";
import NewsletterSignup from "@/components/community/NewsletterSignup";
import { breadcrumbJsonLd } from "@/lib/seo-content";
import {
  fetchTrending,
  fetchMostUsed,
  fetchMostViewed,
  fetchNewest,
  fetchFeaturedCreators,
  fetchCategoryCounts,
  type CommunityTemplate,
  type FeaturedCreator,
  type TrendingWindow,
} from "@/lib/community-queries";

const BASE = "https://twib-motion-studio.lovable.app";

export default function CommunityHub() {
  const [trendingWindow, setTrendingWindow] = useState<TrendingWindow>("week");
  const [trending, setTrending] = useState<CommunityTemplate[]>([]);
  const [used, setUsed] = useState<CommunityTemplate[]>([]);
  const [viewed, setViewed] = useState<CommunityTemplate[]>([]);
  const [newest, setNewest] = useState<CommunityTemplate[]>([]);
  const [creators, setCreators] = useState<FeaturedCreator[]>([]);
  const [cats, setCats] = useState<{ category: string; count: number }[]>([]);

  useEffect(() => {
    fetchTrending(trendingWindow, 8).then(setTrending);
  }, [trendingWindow]);

  useEffect(() => {
    fetchMostUsed(8).then(setUsed);
    fetchMostViewed(8).then(setViewed);
    fetchNewest(8).then(setNewest);
    fetchFeaturedCreators(6).then(setCreators);
    fetchCategoryCounts().then(setCats);
  }, []);

  const url = `${BASE}/community`;
  const title = "Komunitas Template Twibbon | TwibMotion";
  const description =
    "Jelajahi template twibbon trending, paling banyak dipakai, paling banyak dilihat, dan kreator unggulan TwibMotion. Temukan ide untuk MPLS, wisuda, Ramadhan, HUT RI, dan lainnya.";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url,
      description,
    },
    breadcrumbJsonLd(BASE, [
      { name: "Home", path: "/" },
      { name: "Community", path: "/community" },
    ]),
  ];

  return (
    <SeoShell>
      <SEOHead title={title} description={description} canonical={url} ogUrl={url} jsonLd={jsonLd} />
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest mb-3">
          <Users className="w-3.5 h-3.5" /> TwibMotion Community
        </div>
        <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-3">
          Komunitas Template Twibbon
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Trending, paling banyak dipakai, paling banyak dilihat, dan kreator unggulan — semua template publik dari komunitas TwibMotion.
        </p>
        <div className="mt-6">
          <StatsStrip />
        </div>
        <nav className="flex flex-wrap gap-2 mt-5 text-xs font-mono" aria-label="Discovery">
          {[
            { to: "/trending", label: "Trending", Icon: Flame },
            { to: "/popular", label: "Most Liked", Icon: TrendingUp },
            { to: "/new", label: "Newest", Icon: Sparkles },
            { to: "/featured", label: "Featured", Icon: Sparkles },
            { to: "/creators", label: "Creators", Icon: Users },
            { to: "/collections", label: "Collections", Icon: Tag },
          ].map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-primary/60 hover:text-primary"
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </Link>
          ))}
        </nav>
      </header>

      <Section
        title="Trending"
        icon={<Flame className="w-5 h-5 text-primary" />}
        more={{ to: "/trending", label: "All trending" }}
        toolbar={
          <div className="flex gap-1">
            {(["day", "week", "month"] as TrendingWindow[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setTrendingWindow(w)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                  trendingWindow === w
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/60"
                }`}
              >
                {w === "day" ? "Today" : w === "week" ? "This week" : "This month"}
              </button>
            ))}
          </div>
        }
      >
        <TemplateGrid items={trending} emptyText="Belum ada template trending." />
      </Section>

      <Section
        title="Most Used"
        icon={<Wand2 className="w-5 h-5 text-primary" />}
        more={{ to: "/popular", label: "All popular" }}
      >
        <TemplateGrid items={used} />
      </Section>

      <Section
        title="Most Viewed"
        icon={<Eye className="w-5 h-5 text-primary" />}
      >
        <TemplateGrid items={viewed} />
      </Section>

      <Section title="New Templates" icon={<Sparkles className="w-5 h-5 text-primary" />} more={{ to: "/new", label: "All new" }}>
        <TemplateGrid items={newest} />
      </Section>

      <Section title="Featured Creators" icon={<Users className="w-5 h-5 text-primary" />} more={{ to: "/creators", label: "Leaderboard" }}>
        {creators.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kreator unggulan.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {creators.map((c) => <CreatorCard key={c.user_id} c={c} />)}
          </div>
        )}
      </Section>

      <Section title="Popular Categories" icon={<Tag className="w-5 h-5 text-primary" />}>
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link
                key={c.category}
                to={`/community/category/${c.category}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-primary/60 hover:text-primary text-xs font-mono"
              >
                {c.category} <span className="text-muted-foreground">({c.count})</span>
              </Link>
            ))}
          </div>
        )}
      </Section>
      <div className="mb-8">
        <NewsletterSignup source="community" />
      </div>
    </SeoShell>
  );
}

function Section({
  title,
  icon,
  more,
  toolbar,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  more?: { to: string; label: string };
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-xl font-mono font-bold text-foreground inline-flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {toolbar}
          {more && (
            <Link to={more.to} className="text-xs font-mono text-primary inline-flex items-center gap-1 hover:underline">
              {more.label} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}