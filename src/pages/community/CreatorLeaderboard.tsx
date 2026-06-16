import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import SeoShell from "@/components/seo/SeoShell";
import { CreatorCard } from "@/components/community/CreatorCard";
import { breadcrumbJsonLd } from "@/lib/seo-content";
import { fetchCreatorLeaderboard, type FeaturedCreator, type LeaderboardSort } from "@/lib/community-queries";

const BASE = "https://twib-motion-studio.lovable.app";

const TABS: { value: LeaderboardSort; label: string }[] = [
  { value: "popular", label: "Most Popular" },
  { value: "used", label: "Most Used" },
  { value: "most-templates", label: "Most Templates" },
  { value: "fastest-growing", label: "Fastest Growing" },
];

export default function CreatorLeaderboard() {
  const [sort, setSort] = useState<LeaderboardSort>("popular");
  const [rows, setRows] = useState<FeaturedCreator[]>([]);

  useEffect(() => { fetchCreatorLeaderboard(sort, 60).then(setRows); }, [sort]);

  const url = `${BASE}/creators`;
  const title = "TwibMotion Creator Leaderboard | Top Twibbon Creators";
  const description = "Leaderboard kreator TwibMotion: paling populer, paling banyak dipakai, paling banyak template, dan paling cepat tumbuh.";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: rows.slice(0, 20).map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE}/creator/${r.username}`,
        name: r.display_name || `@${r.username}`,
      })),
    },
    breadcrumbJsonLd(BASE, [
      { name: "Home", path: "/" },
      { name: "Creators", path: "/creators" },
    ]),
  ];

  return (
    <SeoShell>
      <SEOHead title={title} description={description} canonical={url} ogUrl={url} jsonLd={jsonLd} />
      <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-3 inline-flex items-center gap-2">
        <Trophy className="w-7 h-7 text-primary" /> Creator Leaderboard
      </h1>
      <p className="text-muted-foreground mb-6 max-w-2xl">{description}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setSort(t.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono border ${
              sort === t.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada kreator.</p>
      ) : (
        <ol className="grid sm:grid-cols-2 gap-3">
          {rows.map((c, i) => (
            <li key={c.user_id} className="relative">
              <span className="absolute -left-1 -top-1 z-10 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-mono font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <CreatorCard c={c} />
            </li>
          ))}
        </ol>
      )}

      <p className="text-xs text-muted-foreground font-mono mt-10">
        Jadi kreator unggulan: <Link to="/dashboard/templates" className="text-primary hover:underline">publish template kamu</Link>.
      </p>
    </SeoShell>
  );
}