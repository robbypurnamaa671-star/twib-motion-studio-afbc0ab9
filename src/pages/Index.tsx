import { Link, useNavigate } from "react-router-dom";
import { Layers, Play, Sparkles, ArrowRight, Zap, Image as ImageIcon, Video, Film, Smartphone } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import SEOHead from "@/components/SEOHead";
import HomepageSEOSections from "@/components/HomepageSEOSections";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const META_TITLE = "Twibmotion — Animated Overlay Maker for Reels, Shorts & Campaigns";
const META_DESC = "Create animated video, GIF, and photo overlays in your browser. Built for Instagram Reels, TikTok, YouTube Shorts, streamers, and campaigns.";

const PLATFORMS = [
  { name: "Instagram Reels", ratio: "9:16" },
  { name: "TikTok", ratio: "9:16" },
  { name: "YouTube Shorts", ratio: "9:16" },
  { name: "Twitch", ratio: "16:9" },
  { name: "Discord", ratio: "1:1" },
  { name: "Campaigns", ratio: "1:1" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={META_TITLE}
        description={META_DESC}
        canonical="https://twibmotion.com"
      />

      <header>
        <nav className="border-b border-border/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-30 bg-background/80" aria-label="Main">
          <a href="/" className="flex items-center gap-2" aria-label="Twibmotion home">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-mono font-bold text-lg text-foreground tracking-tight">Twibmotion</span>
          </a>
          <div className="flex items-center gap-3">
            <Link to="/templates" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">Templates</Link>
            <UserMenu />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden" aria-label="Hero">
          {/* Animated gradient backdrop */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-30%] right-[-10%] w-[55%] h-[55%] rounded-full bg-accent/20 blur-[140px] animate-pulse" style={{ animationDelay: "1.2s" }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,hsl(var(--background)))]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono mb-6">
                <Sparkles className="w-3 h-3" /> New · Animated video overlays
              </div>
              <h1 className="text-4xl md:text-6xl font-mono font-bold tracking-tight leading-[1.05] mb-6">
                Create <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">animated overlays</span> for Reels, Shorts & campaigns.
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl">
                Layer animated frames over photos, videos, or GIFs directly in your browser. Export for Instagram Reels, TikTok, YouTube Shorts, livestreams, and community campaigns.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => navigate("/editor?ratio=9:16&w=1080&h=1920")}
                  className="group px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)]"
                >
                  Start Creating <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link
                  to="/templates"
                  className="px-6 py-3 rounded-lg border border-border hover:border-primary/60 font-mono font-medium inline-flex items-center gap-2 transition-colors"
                >
                  Explore Templates
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" /> No signup required</span>
                <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-primary" /> Video + GIF support</span>
                <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-primary" /> Mobile-friendly</span>
              </div>
            </div>

            {/* Floating editor mockup */}
            <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="relative mx-auto w-full max-w-md">
                {/* Phone-like vertical frame */}
                <div className="relative aspect-[9/16] rounded-3xl border border-border bg-card overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
                  <div className="absolute inset-4 rounded-2xl border-2 border-primary/60 shadow-[0_0_40px_hsl(var(--primary)/0.5)]">
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-background/80 backdrop-blur text-[10px] font-mono text-primary">LIVE OVERLAY</div>
                    <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-background/80 backdrop-blur text-xs font-mono">
                      <div className="font-bold">@yourcampaign</div>
                      <div className="text-muted-foreground">Animated frame · 9:16</div>
                    </div>
                  </div>
                </div>
                {/* Floating cards */}
                <div className="absolute -left-6 top-12 w-32 rounded-xl border border-border bg-card/90 backdrop-blur p-3 shadow-xl rotate-[-6deg] hidden md:block animate-fade-in" style={{ animationDelay: "0.5s" }}>
                  <Film className="w-4 h-4 text-primary mb-1.5" />
                  <div className="text-xs font-mono font-semibold">MP4 Export</div>
                  <div className="text-[10px] text-muted-foreground">1080×1920 · 30s</div>
                </div>
                <div className="absolute -right-4 bottom-16 w-36 rounded-xl border border-border bg-card/90 backdrop-blur p-3 shadow-xl rotate-[5deg] hidden md:block animate-fade-in" style={{ animationDelay: "0.7s" }}>
                  <Layers className="w-4 h-4 text-accent mb-1.5" />
                  <div className="text-xs font-mono font-semibold">2-Layer System</div>
                  <div className="text-[10px] text-muted-foreground">Overlay · Base media</div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform strip */}
          <div className="border-t border-border/60 bg-card/30">
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono text-muted-foreground uppercase tracking-widest">
              <span className="opacity-60">Built for</span>
              {PLATFORMS.map((p) => (
                <span key={p.name} className="hover:text-foreground transition-colors">{p.name}</span>
              ))}
            </div>
          </div>
        </section>

        <HomepageSEOSections />
      </main>

      <footer className="border-t border-border px-6 py-10 text-center flex flex-col items-center gap-3 bg-card/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Layers className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="font-mono font-bold text-sm">Twibmotion</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-md">Animated overlay maker for modern creators. Video frames, GIF overlays, and campaign templates — built for the social era.</p>
        <nav className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground" aria-label="Footer">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/templates" className="hover:text-primary transition-colors">Templates</Link>
          <Link to="/editor?ratio=9:16&w=1080&h=1920" className="hover:text-primary transition-colors">Editor</Link>
        </nav>
        <LanguageSwitcher />
      </footer>
    </div>
  );
};

export default Index;
