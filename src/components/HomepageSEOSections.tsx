import { Layers, Download, Zap, Video, Image as ImageIcon, Film, Smartphone, Sparkles, ArrowRight, MousePointer2, Play, Globe, Radio, MessageSquare, Gamepad2, GraduationCap, Moon, Megaphone, Mic } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const EDITOR = {
  vertical: "/editor?ratio=9:16&w=1080&h=1920",
  square: "/editor?ratio=1:1&w=1080&h=1080",
  landscape: "/editor?ratio=16:9&w=1920&h=1080",
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const PLATFORMS = [
  { name: "Instagram Reels", icon: Smartphone, desc: "9:16 vertical overlays", ratio: "9:16" },
  { name: "TikTok", icon: Video, desc: "Animated frames for FYP", ratio: "9:16" },
  { name: "YouTube Shorts", icon: Play, desc: "Branded short-form frames", ratio: "9:16" },
  { name: "Twitch", icon: Radio, desc: "Stream & webcam overlays", ratio: "16:9" },
  { name: "Discord", icon: MessageSquare, desc: "Community avatar frames", ratio: "1:1" },
  { name: "Campaigns", icon: Megaphone, desc: "Movement & cause overlays", ratio: "1:1" },
];

const DIFFERENTIATORS = [
  { icon: Video, title: "Video Overlays", desc: "Layer animated frames over MP4 clips, not just static photos." },
  { icon: Film, title: "GIF Support", desc: "Use animated GIFs as base or as overlay — both work natively." },
  { icon: Sparkles, title: "Animated Frames", desc: "Motion graphics that loop seamlessly on Reels and Shorts." },
  { icon: Globe, title: "Browser-Based", desc: "No installs, no plugins. Works on Chrome, Safari, mobile." },
  { icon: Zap, title: "Instant Export", desc: "Render and download in seconds — PNG, GIF, or MP4." },
  { icon: Smartphone, title: "9:16 Optimized", desc: "Native vertical workflow built for mobile-first content." },
];

const TEMPLATE_CATEGORIES = [
  { name: "Graduation", icon: GraduationCap, color: "from-amber-500/30 to-yellow-500/10", href: "/twibbon/graduation" },
  { name: "Ramadan", icon: Moon, color: "from-emerald-500/30 to-teal-500/10", href: "/twibbon/ramadhan" },
  { name: "Gaming", icon: Gamepad2, color: "from-purple-500/30 to-fuchsia-500/10", href: "/twibbon/gaming" },
  { name: "Creator", icon: Sparkles, color: "from-pink-500/30 to-rose-500/10", href: "/twibbon/creator-overlay" },
  { name: "Webinar", icon: Mic, color: "from-blue-500/30 to-cyan-500/10", href: "/twibbon/webinar" },
  { name: "K-pop", icon: Radio, color: "from-fuchsia-500/30 to-pink-500/10", href: "/twibbon/kpop" },
  { name: "Campaign", icon: Megaphone, color: "from-red-500/30 to-orange-500/10", href: "/twibbon/campaign" },
  { name: "Stream Overlay", icon: Video, color: "from-violet-500/30 to-indigo-500/10", href: "/twibbon/stream-overlay" },
];

const EXPORT_FORMATS = [
  { label: "PNG", desc: "Lossless static" },
  { label: "JPG", desc: "Compressed image" },
  { label: "GIF", desc: "Animated loop" },
  { label: "MP4", desc: "HD video" },
];

const EXPORT_RATIOS = [
  { label: "9:16", desc: "Reels, TikTok, Shorts, Stories" },
  { label: "1:1", desc: "Feed posts, profile frames" },
  { label: "16:9", desc: "YouTube, livestream, banners" },
];

const POPULAR_LINKS = [
  { label: "Video Overlay Maker", href: "/video-overlay-maker" },
  { label: "Animated Frame Maker", href: "/animated-frame-maker" },
  { label: "Reels Overlay Maker", href: "/reels-overlay-maker" },
  { label: "Campaign Frame Maker", href: "/campaign-frame-maker" },
  { label: "Twibbon Wisuda", href: "/twibbon/wisuda" },
  { label: "Twibbon MPLS 2026", href: "/twibbon/mpls-2026" },
  { label: "Twibbon Ramadhan", href: "/twibbon/ramadhan" },
  { label: "Twibbon Graduation", href: "/twibbon/graduation" },
];

const FAQS = [
  { q: "Can I create animated overlays online?", a: "Yes. Twibmotion is a browser-based animated overlay maker — upload your base photo, GIF, or video and layer an animated frame on top. No installs, no plugins." },
  { q: "Can I export video frames for Reels?", a: "Absolutely. Export MP4 video at 9:16 (1080×1920) optimized for Instagram Reels, TikTok, and YouTube Shorts, up to 30 seconds per render." },
  { q: "Does Twibmotion support GIF overlays?", a: "Yes. You can use animated GIFs as the base layer or as the overlay frame — both will preserve their animation on export." },
  { q: "Can I use Twibmotion on mobile?", a: "Twibmotion is mobile-friendly and runs entirely in the browser. Upload from your camera roll, edit, and export directly on your phone." },
  { q: "Can I create campaign frames online?", a: "Yes. Design a branded overlay, lock it as a campaign template, and share the link — anyone can apply your frame to their own photo or video." },
  { q: "What export sizes are supported?", a: "Three native ratios: 9:16 (1080×1920), 1:1 (1080×1080), and 16:9 (1920×1080). Formats: PNG, JPG, GIF, and MP4." },
];

const HomepageSEOSections = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* SOCIAL PLATFORMS */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20" aria-label="Built for Modern Social Content">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-mono font-bold mb-3">Built for Modern Social Content</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">One overlay editor for every platform creators actually use today.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PLATFORMS.map((p) => (
            <article key={p.name} className="group rounded-xl border border-border bg-card p-4 hover:border-primary/60 hover:bg-card/80 transition-all hover:-translate-y-0.5">
              <p.icon className="w-5 h-5 text-primary mb-3" />
              <div className="font-mono font-semibold text-sm">{p.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</div>
              <div className="text-[10px] font-mono text-primary/70 mt-2">{p.ratio}</div>
            </article>
          ))}
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section className="w-full bg-card/30 border-y border-border" aria-label="Why Choose Twibmotion">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-mono text-primary uppercase tracking-widest mb-3">Why Twibmotion</span>
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-3">Beyond static frame generators</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Old-school twibbon sites only do static images. Twibmotion is built for the video-first era — animated, fast, and mobile-native.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DIFFERENTIATORS.map((d) => (
              <article key={d.title} className="relative rounded-xl border border-border bg-background p-6 overflow-hidden group hover:border-primary/40 transition-colors">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors blur-2xl" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <d.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-mono font-semibold mb-1.5">{d.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE EDITOR PREVIEW */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20" aria-label="Live Editor Preview">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-mono text-primary uppercase tracking-widest mb-3">Live editor</span>
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4">A two-layer overlay studio in your browser</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">Drop your photo or video as the base. Drop your animated frame on top. Drag, scale, rotate. Export. That's the whole workflow.</p>
            <ul className="space-y-3 mb-8">
              {[
                { icon: MousePointer2, t: "Drag & drop layers" },
                { icon: Layers, t: "Frame overlay workflow" },
                { icon: Video, t: "Video, GIF & photo support" },
                { icon: Download, t: "Live export preview" },
              ].map((f) => (
                <li key={f.t} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-mono">{f.t}</span>
                </li>
              ))}
            </ul>
            <Link to={EDITOR.vertical} className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity ${focusRing}`}>
              Try the Editor <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mock editor */}
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-background/50">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-[11px] font-mono text-muted-foreground">twibmotion.com/editor</span>
            </div>
            <div className="grid grid-cols-[1fr_140px] min-h-[320px]">
              <div className="relative bg-gradient-to-br from-primary/20 via-background to-accent/10 flex items-center justify-center p-6">
                <div className="relative aspect-[9/16] w-32 rounded-lg border-2 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.4)] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-accent/40 to-primary/40" />
                  <div className="absolute inset-2 border border-primary/80 rounded-md" />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[8px] font-mono text-foreground/90 bg-background/70 backdrop-blur px-1.5 py-0.5 rounded">OVERLAY 9:16</div>
                </div>
              </div>
              <div className="border-l border-border p-3 space-y-2 bg-background/30">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Layers</div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/30">
                  <Layers className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-mono">Overlay</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-card border border-border">
                  <ImageIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] font-mono">Base media</span>
                </div>
                <div className="pt-2 mt-2 border-t border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Export</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {["PNG", "MP4", "GIF", "JPG"].map((f) => (
                    <div key={f} className="text-[10px] font-mono text-center py-1 rounded border border-border bg-card">{f}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATE SHOWCASE */}
      <section className="w-full bg-card/30 border-y border-border" aria-label="Template Gallery">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="inline-block text-xs font-mono text-primary uppercase tracking-widest mb-2">Templates</span>
              <h2 className="text-3xl md:text-4xl font-mono font-bold">Ready-to-use overlay categories</h2>
            </div>
            <Link to="/templates" className={`text-sm font-mono text-primary hover:underline inline-flex items-center gap-1 ${focusRing}`}>
              Browse all templates <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TEMPLATE_CATEGORIES.map((c) => (
              <Link
                key={c.name}
                to={c.href}
                className={`group relative aspect-[3/4] rounded-2xl border border-border overflow-hidden bg-background hover:border-primary/60 transition-all hover:-translate-y-1 ${focusRing}`}
                aria-label={`${c.name} overlay templates`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${c.color}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="font-mono font-bold text-foreground">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EXPORT FORMATS */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20" aria-label="Export Formats">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-mono text-primary uppercase tracking-widest mb-3">Export</span>
          <h2 className="text-3xl md:text-4xl font-mono font-bold mb-3">Export for every platform</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Pick a format, pick a ratio, hit export. Ready for Reels, TikTok, Shorts, Stories, and beyond.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Formats</div>
            <div className="grid grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((f) => (
                <div key={f.label} className="rounded-lg border border-border bg-background p-4 hover:border-primary/60 transition-colors">
                  <div className="font-mono font-bold text-lg text-primary">{f.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Ratios</div>
            <div className="space-y-3">
              {EXPORT_RATIOS.map((r) => (
                <div key={r.label} className="flex items-center justify-between rounded-lg border border-border bg-background p-4 hover:border-primary/60 transition-colors">
                  <div>
                    <div className="font-mono font-bold text-primary">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES / INTERNAL LINKS */}
      <section className="w-full bg-card/30 border-y border-border" aria-label="Popular Overlay Categories">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-mono font-bold mb-2">Popular Overlay Categories</h2>
            <p className="text-muted-foreground text-sm">Dedicated landing pages for common overlay use cases.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_LINKS.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={`px-4 py-2 rounded-full border border-border bg-background text-sm font-mono hover:border-primary/60 hover:text-primary transition-colors ${focusRing}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full max-w-3xl mx-auto px-6 py-20" aria-label="Frequently Asked Questions">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-mono font-bold mb-3">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about creating overlays with Twibmotion.</p>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left font-mono font-medium hover:bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                aria-expanded={openFaq === i}
              >
                <span>{f.q}</span>
                <span className="text-primary ml-3 shrink-0 text-xl leading-none">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </section>

      {/* FINAL CTA */}
      <section className="w-full px-6 py-20" aria-label="Start Creating">
        <div className="relative max-w-5xl mx-auto rounded-3xl border border-primary/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
          <div className="absolute -top-1/2 left-1/4 w-1/2 h-full rounded-full bg-primary/30 blur-[120px]" />
          <div className="relative px-8 py-16 md:py-20 text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-mono font-bold mb-4 leading-tight">Start creating your overlay now</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">Join creators making animated overlays for Reels, TikTok, Shorts, and campaigns. Free, browser-based, no signup needed.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={EDITOR.vertical} className="px-7 py-3.5 rounded-lg bg-primary text-primary-foreground font-mono font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
                Create Overlay <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/templates" className="px-7 py-3.5 rounded-lg border border-border hover:border-primary/60 font-mono font-medium transition-colors">
                Explore Templates
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-mono text-muted-foreground">
              <span>✦ Free forever</span>
              <span>✦ No watermark on Premium</span>
              <span>✦ HD export</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomepageSEOSections;
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-10">
