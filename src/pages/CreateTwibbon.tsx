import { useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Layers, ArrowRight, Check } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import UserMenu from "@/components/UserMenu";

type RatioKey = "vertical" | "square" | "landscape";

const RATIOS: Record<RatioKey, {
  label: string;
  ratio: "9:16" | "1:1" | "16:9";
  w: number;
  h: number;
  title: string;
  description: string;
  heading: string;
  intro: string;
  bestFor: string[];
  tips: string[];
}> = {
  vertical: {
    label: "Vertical 9:16",
    ratio: "9:16",
    w: 1080,
    h: 1920,
    title: "Vertical Twibbon Maker 9:16 – Instagram Stories, Reels & TikTok",
    description:
      "Create a free 9:16 vertical twibbon for Instagram Stories, Reels, TikTok, and YouTube Shorts. Layer a frame over your photo, GIF, or video and export in HD.",
    heading: "9:16 Vertical Twibbon Maker for Stories, Reels & TikTok",
    intro:
      "Design vertical twibbons at 1080×1920 — the native format for Instagram Stories and Reels, TikTok, and YouTube Shorts. Upload a photo, GIF, or short video, drop your twibbon frame on top, and export in HD.",
    bestFor: ["Instagram Stories & Reels", "TikTok videos", "YouTube Shorts", "Snapchat campaigns"],
    tips: [
      "Keep important visuals in the central safe area to avoid UI overlays.",
      "Use transparent PNG frames so the user's media shows through cleanly.",
      "Short looping videos (≤30s) export as crisp MP4 files.",
    ],
  },
  square: {
    label: "Square 1:1",
    ratio: "1:1",
    w: 1080,
    h: 1080,
    title: "Square Twibbon Maker 1:1 – Instagram & Facebook Feed",
    description:
      "Make a free 1:1 square twibbon for Instagram feed, Facebook posts, LinkedIn, and Twitter/X. Add a frame to your photo, GIF, or video and download in HD.",
    heading: "1:1 Square Twibbon Maker for Feed Posts",
    intro:
      "Square 1080×1080 twibbons work across every social feed — Instagram, Facebook, LinkedIn, and X. Perfect for awareness campaigns, profile frames, and announcements that need consistent reach.",
    bestFor: ["Instagram feed posts", "Facebook & LinkedIn updates", "Twitter / X campaigns", "Profile picture frames"],
    tips: [
      "Square frames double as profile picture overlays.",
      "High-contrast frame edges stay readable at small thumbnail sizes.",
      "Pair with a short caption and hashtag to amplify campaign reach.",
    ],
  },
  landscape: {
    label: "Landscape 16:9",
    ratio: "16:9",
    w: 1920,
    h: 1080,
    title: "Landscape Twibbon Maker 16:9 – YouTube, Events & Webinars",
    description:
      "Build a free 16:9 landscape twibbon for YouTube videos, event banners, webinar overlays, and presentations. Layer a frame in HD and export instantly.",
    heading: "16:9 Landscape Twibbon Maker for YouTube & Events",
    intro:
      "Landscape 1920×1080 twibbons are built for YouTube videos, livestream overlays, event banners, webinar slides, and any horizontal placement that needs HD quality.",
    bestFor: ["YouTube videos & thumbnails", "Webinar overlays", "Event & conference banners", "Presentation slides"],
    tips: [
      "Use wide frames to brand video content without covering the speaker.",
      "Export MP4 to keep motion graphics looping smoothly.",
      "Pair the twibbon with a campaign hashtag in the lower third.",
    ],
  },
};

const SLUG_TO_KEY: Record<string, RatioKey> = {
  "vertical-9-16": "vertical",
  "square-1-1": "square",
  "landscape-16-9": "landscape",
};

const CreateTwibbon = () => {
  const { ratio: slug } = useParams<{ ratio: string }>();
  const key = slug ? SLUG_TO_KEY[slug] : undefined;

  if (!key) {
    return <Navigate to="/" replace />;
  }

  const r = RATIOS[key];
  const editorHref = useMemo(
    () => `/editor?ratio=${r.ratio}&w=${r.w}&h=${r.h}`,
    [r],
  );
  const canonical = `https://twibmotion.com/create/${slug}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title={r.title} description={r.description} canonical={canonical} />

      <header>
        <nav className="border-b border-border px-6 py-4 flex items-center justify-between" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-2" aria-label="TwibMotion home">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-mono font-bold text-lg text-foreground tracking-tight">TwibMotion</span>
          </Link>
          <UserMenu />
        </nav>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{r.label}</span>
        </nav>

        <section aria-label="Ratio overview" className="mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono mb-4">
            {r.ratio} · {r.w}×{r.h}
          </span>
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4 leading-tight">{r.heading}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">{r.intro}</p>
          <Link
            to={editorHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity glow-border"
          >
            Open the {r.ratio} editor <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <section aria-label="Best for" className="mb-12 border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">Best for</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {r.bestFor.map((b) => (
              <li key={b} className="flex items-center gap-2 text-foreground text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" /> {b}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Design tips" className="mb-12 border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">Tips for great {r.ratio} twibbons</h2>
          <ul className="space-y-3">
            {r.tips.map((t) => (
              <li key={t} className="text-muted-foreground text-sm leading-relaxed">— {t}</li>
            ))}
          </ul>
        </section>

        <section aria-label="Other ratios" className="border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">Try a different ratio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.entries(SLUG_TO_KEY) as [string, RatioKey][])
              .filter(([, k]) => k !== key)
              .map(([s, k]) => (
                <Link
                  key={s}
                  to={`/create/${s}`}
                  className="block p-4 rounded-lg border border-border hover:border-primary/60 transition-colors"
                >
                  <div className="font-mono font-semibold text-foreground">{RATIOS[k].label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{RATIOS[k].w}×{RATIOS[k].h}</div>
                </Link>
              ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          TwibMotion — Free Twibbon Maker for Photos, GIFs, and Videos
        </p>
      </footer>
    </div>
  );
};

export default CreateTwibbon;