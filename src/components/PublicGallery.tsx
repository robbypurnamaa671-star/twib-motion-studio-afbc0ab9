import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProgressiveImage } from "@/components/ProgressiveImage";

type PublicTwibbon = {
  id: string;
  title: string | null;
  bottom_layer_url: string | null;
  preview_url: string | null;
  canvas_ratio: string | null;
  category: string | null;
};

const PAGE_SIZE = 12;
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

type CacheEntry = { ts: number; rows: PublicTwibbon[]; count: number };
const memoryCache = new Map<string, CacheEntry>();

function cacheKey(category: string, ratio: string, page: number) {
  return `${category}|${ratio}|${page}`;
}

const PublicGallery = ({ createUrl }: { createUrl: string }) => {
  const [category, setCategory] = useState<string>(ALL);
  const [ratio, setRatio] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<PublicTwibbon[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const key = cacheKey(category, ratio, page);

  useEffect(() => {
    let active = true;
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setRows(cached.rows);
      setTotalCount(cached.count);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      let query = supabase
        .from("shared_templates")
        .select("id, title, bottom_layer_url, preview_url, canvas_ratio, category", { count: "exact" })
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (category !== ALL) query = query.eq("category", category);
      if (ratio !== ALL) query = query.eq("canvas_ratio", ratio);

      const { data, count } = await query;
      if (!active) return;
      const safeRows = (data ?? []) as PublicTwibbon[];
      const safeCount = count ?? 0;
      memoryCache.set(key, { ts: Date.now(), rows: safeRows, count: safeCount });
      setRows(safeRows);
      setTotalCount(safeCount);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [key, category, ratio, page]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [category, ratio]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

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
          Real public twibbons made by people just like you on TwibMotion. Filter by category or ratio and browse the latest community frames.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
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
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <Sparkles className="w-6 h-6 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No public twibbons match these filters yet. Try a different category or be the first to share one.
          </p>
          <Link
            to={createUrl}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm hover:opacity-90 ${focusRing}`}
          >
            Create your twibbon <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {rows.map((tw) => (
              <Link
                key={tw.id}
                to={`/use-template/${tw.id}`}
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
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className={`p-2 rounded-md border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground px-3">
              Page {page + 1} of {totalPages} · {totalCount} twibbon{totalCount === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
              disabled={page + 1 >= totalPages}
              aria-label="Next page"
              className={`p-2 rounded-md border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center mt-6">
            <Link
              to={createUrl}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary font-mono text-sm hover:bg-primary/10 ${focusRing}`}
            >
              Make yours and join the gallery <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </>
      )}
    </section>
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