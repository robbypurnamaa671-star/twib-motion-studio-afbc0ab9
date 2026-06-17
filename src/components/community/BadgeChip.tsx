import { Flame, Star, Crown, Sparkles, TrendingUp } from "lucide-react";

export type BadgeKind = "trending" | "popular" | "featured" | "new" | "editors_pick";

const MAP: Record<BadgeKind, { label: string; Icon: typeof Flame; cls: string }> = {
  trending: { label: "Trending", Icon: TrendingUp, cls: "bg-orange-500/15 text-orange-400 border-orange-500/40" },
  popular: { label: "Popular", Icon: Flame, cls: "bg-red-500/15 text-red-400 border-red-500/40" },
  featured: { label: "Featured", Icon: Star, cls: "bg-primary/15 text-primary border-primary/40" },
  new: { label: "New", Icon: Sparkles, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" },
  editors_pick: { label: "Editor's Pick", Icon: Crown, cls: "bg-purple-500/15 text-purple-400 border-purple-500/40" },
};

export function BadgeChip({ kind }: { kind: BadgeKind }) {
  const b = MAP[kind];
  if (!b) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${b.cls}`}>
      <b.Icon className="w-3 h-3" />
      {b.label}
    </span>
  );
}

export function computeBadges(t: {
  is_trending?: boolean | null;
  is_featured?: boolean | null;
  is_staff_pick?: boolean | null;
  usage_count?: number | null;
  view_count?: number | null;
  like_count?: number | null;
  created_at?: string | null;
}): BadgeKind[] {
  const out: BadgeKind[] = [];
  if (t.is_trending) out.push("trending");
  if (t.is_featured) out.push("featured");
  if (t.is_staff_pick) out.push("editors_pick");
  const score = (t.usage_count ?? 0) * 3 + (t.like_count ?? 0) * 2 + (t.view_count ?? 0);
  if (score >= 500 && !out.includes("trending")) out.push("popular");
  if (t.created_at) {
    const ageDays = (Date.now() - new Date(t.created_at).getTime()) / 86400000;
    if (ageDays < 7) out.push("new");
  }
  return out.slice(0, 3);
}

export default BadgeChip;