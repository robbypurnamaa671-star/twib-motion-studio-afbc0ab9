import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Users, Search, Heart, Eye, Play, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { FavoriteButton } from "@/components/community/FavoriteButton";

type PublicTwibbon = {
  id: string;
  slug: string | null;
  title: string | null;
  bottom_layer_url: string | null;
  preview_url: string | null;
  canvas_ratio: string | null;
  category: string | null;
  owner_id: string | null;
  view_count: number | null;
  usage_count: number | null;
  like_count: number | null;
  profiles?: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

const PAGE_SIZE = 20;
const ALL = "all";
const CACHE_TTL_MS = 60_000;

const ANIMATED_IMAGE_RE = /\.(gif|webp|apng)(\?|#|$)/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

function isAnimatedImage(url: string | null | undefined): boolean {
  return !!url && ANIMATED_IMAGE_RE.test(url);
}
function isVideo(url: string | null | undefined): boolean {
  return !!url && VIDEO_RE.test(url);
}
const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: ALL, label: "All" },
  { value: "graduation", label: "Graduation" },
  { value: "religious", label: "Religious" },
  { value: "school", label: "School" },
  { value: "campaign", label: "Campaign" },
  { value: "event", label: "Event" },
  { value: "community", label: "Community" },
];

const RATIO_FILTERS: { value: string; label: string }[] = [
  { value: ALL, label: "All ratios" },
  { value: "1:1", label: "Square 1:1" },
  { value: "9:16", label: "Vertical 9:16" },
  { value: "16:9", label: "Landscape 16:9" },
];

type Sort = "newest" | "popular" | "used" | "viewed";
const SORT_FILTERS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most liked" },
  { value: "used", label: "Most used" },
  { value: "viewed", label: "Most viewed" },
];

const SORT_COL: Record<Sort, string> = {
  newest: "created_at",
  popular: "like_count",
  used: "usage_count",
  viewed: "view_count",
};

type TwibbonType = "moving" | "static";

type CacheEntry = { ts: number; rows: PublicTwibbon[] };
const memoryCache = new Map<string, CacheEntry>();

function cacheKey(type: TwibbonType, category: string, ratio: string, sort: Sort, q: string) {
  return `${type}|${category}|${ratio}|${sort}|${q}`;
}

// Patterns used to detect animated/video bottom layers server-side.
const MOVING_EXTS = ["mp4", "webm", "mov", "m4v", "gif", "apng"];
const MOVING_OR = MOVING_EXTS.map((ext) => `bottom_layer_url.ilike.%.${ext}%`).join(",");

const PublicGallery = ({ createUrl }: { createUrl: string }) => {
  const [category, setCategory] = useState<string>(ALL);
  const [ratio, setRatio] = useState<string>(ALL);
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <section
      className="w-full max-w-5xl mx-auto px-6 py-16 border-t border-border"
      aria-label="Public twibbons created by our users"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest mb-3">
          <Users className="w-3.5 h-3.5" /> Live community
        </div>
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-2">
          Twibbons created by our users
        </h2>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Real public twibbons from the TwibMotion community — split into <strong className="text-foreground">moving</strong> (video/GIF) and <strong className="text-foreground">static</strong> frames so you can see we support both.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates, creators, or themes…"
              aria-label="Search community templates"
              className={`w-full pl-9 pr-3 py-2 rounded-full text-sm bg-card border border-border focus:border-primary outline-none ${focusRing}`}
            />
          </div>
        </div>
        <FilterRow
          label="Category"
          options={CATEGORY_FILTERS}
          value={category}
          onChange={setCategory}
        />
        <FilterRow
          label="Ratio"
          options={RATIO_FILTERS}
          value={ratio}
          onChange={setRatio}
        />
        <FilterRow
          label="Sort"
          options={SORT_FILTERS}
          value={sort}
          onChange={(v) => setSort(v as Sort)}
        />
      </div>

      <TypeSection
        type="moving"
        title="Moving Twibbons"
        subtitle="Animated frames — video (MP4/WebM) and GIF."
        icon={<Play className="w-4 h-4 text-primary" />}
        category={category}
        ratio={ratio}
        sort={sort}
        query={debouncedQ}
      />

      <div className="my-10 border-t border-border" />

      <TypeSection
        type="static"
        title="Static Twibbons"
        subtitle="Classic still frames — PNG and JPG."
        icon={<ImageIcon className="w-4 h-4 text-primary" />}
        category={category}
        ratio={ratio}
        sort={sort}
        query={debouncedQ}
      />

      <div className="text-center mt-10">
        <Link
          to={createUrl}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary font-mono text-sm hover:bg-primary/10 ${focusRing}`}
        >
          Make yours and join the gallery <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
};

const TypeSection = ({
  type,
  title,
  subtitle,
  icon,
  category,
  ratio,
  sort,
  query,
}: {
  type: TwibbonType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  category: string;
  ratio: string;
  sort: Sort;
  query: string;
}) => {
  const [rows, setRows] = useState<PublicTwibbon[]>([]);
  const [loading, setLoading] = useState(true);
  const key = cacheKey(type, category, ratio, sort, query);

  useEffect(() => {
    let active = true;
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setRows(cached.rows);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      let q = supabase
        .from("shared_templates")
        .select(
          "id, slug, title, bottom_layer_url, preview_url, canvas_ratio, category, owner_id, view_count, usage_count, like_count, profiles:owner_id(username, display_name, avatar_url)",
        )
        .eq("is_public", true)
        .is("deleted_at", null)
        .order(SORT_COL[sort], { ascending: false })
        .limit(PAGE_SIZE);

      if (category !== ALL) q = q.eq("category", category);
      if (ratio !== ALL) q = q.eq("canvas_ratio", ratio);
      if (query) {
        const esc = query.replace(/[,%]/g, " ");
        q = q.or(`title.ilike.%${esc}%,description.ilike.%${esc}%`);
      }
      if (type === "moving") {
        q = q.or(MOVING_OR);
      } else {
        for (const ext of MOVING_EXTS) {
          q = q.not("bottom_layer_url", "ilike", `%.${ext}%`);
        }
      }

      const { data } = await q;
      if (!active) return;
      const safeRows = (data ?? []) as unknown as PublicTwibbon[];
      memoryCache.set(key, { ts: Date.now(), rows: safeRows });
      setRows(safeRows);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [key, category, ratio, sort, query, type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-mono font-bold text-foreground text-lg inline-flex items-center gap-2">
            {icon} {title}
            <span className="text-xs font-normal text-muted-foreground">({rows.length})</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No {type} twibbons match these filters yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {rows.map((tw) => (
            <div key={tw.id} className="relative group">
              <Link
                to={`/use-template/${tw.slug || tw.id}`}
                aria-label={`Use public twibbon: ${tw.title ?? "Untitled"}`}
                className={`group block aspect-square overflow-hidden rounded-lg border border-border bg-card relative ${focusRing}`}
              >
                {isVideo(tw.bottom_layer_url) ? (
                  <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105">
                    {tw.preview_url && (
                      <img
                        src={tw.preview_url}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <video
                      src={tw.bottom_layer_url as string}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      aria-label={tw.title ?? "Animated public twibbon by a TwibMotion user"}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : isAnimatedImage(tw.bottom_layer_url) ? (
                  <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105">
                    {tw.preview_url && (
                      <img
                        src={tw.preview_url}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <img
                      src={tw.bottom_layer_url as string}
                      alt={tw.title ?? "Animated public twibbon frame by a TwibMotion user"}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : (tw.preview_url || tw.bottom_layer_url) ? (
                  <ProgressiveImage
                    src={(tw.preview_url || tw.bottom_layer_url) as string}
                    alt={tw.title ?? "Public twibbon frame by a TwibMotion user"}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No preview
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2 z-10">
                  <p className="text-xs font-mono text-foreground truncate">
                    {tw.title ?? "Untitled twibbon"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-0.5">
                    {tw.profiles?.username ? (
                      <span className="truncate">@{tw.profiles.username}</span>
                    ) : <span />}
                    <span className="inline-flex items-center gap-2 shrink-0">
                      {(tw.like_count ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5"><Heart className="w-3 h-3" /> {tw.like_count}</span>
                      )}
                      {(tw.view_count ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5"><Eye className="w-3 h-3" /> {tw.view_count}</span>
                      )}
                    </span>
                  </div>
                </div>
              </Link>
              <FavoriteButton templateId={tw.id} className="absolute top-2 right-2 z-20" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterRow = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap items-center justify-center gap-2">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">
      {label}
    </span>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={active}
          className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${focusRing} ${
            active
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export default PublicGallery;