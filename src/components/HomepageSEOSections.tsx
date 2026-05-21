import { Upload, Layers, Download, Smartphone, School, Heart, Zap, Globe, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const EDITOR_LINKS = {
  vertical: "/editor?ratio=9:16&w=1080&h=1920",
  square: "/editor?ratio=1:1&w=1080&h=1080",
  landscape: "/editor?ratio=16:9&w=1920&h=1080",
};

const RATIO_PAGES = {
  vertical: "/create/vertical-9-16",
  square: "/create/square-1-1",
  landscape: "/create/landscape-16-9",
};

const steps = [
  { icon: Upload, title: "Upload Your Photo or Video", desc: "Choose a photo, GIF, or video as your base layer.", href: EDITOR_LINKS.square, cta: "Start uploading" },
  { icon: Layers, title: "Add Your Twibbon Frame", desc: "Upload a twibbon overlay frame and position it over your media.", href: EDITOR_LINKS.square, cta: "Open the editor" },
  { icon: Download, title: "Export & Share", desc: "Download your twibbon in HD quality, ready for social media.", href: EDITOR_LINKS.square, cta: "Create & export" },
];

const useCases = [
  { icon: Smartphone, title: "Instagram & TikTok", desc: "Create vertical twibbons for Stories, Reels, and TikTok videos.", href: EDITOR_LINKS.vertical, cta: "Make a 9:16 twibbon" },
  { icon: Globe, title: "Social Media Campaigns", desc: "Design branded twibbons for awareness campaigns and movements.", href: EDITOR_LINKS.square, cta: "Start a 1:1 campaign" },
  { icon: School, title: "Schools & Universities", desc: "Graduation frames, school events, and alumni campaigns.", href: EDITOR_LINKS.square, cta: "Design a school frame" },
  { icon: Heart, title: "Events & Celebrations", desc: "Birthdays, weddings, independence days, and community events.", href: EDITOR_LINKS.landscape, cta: "Create an event twibbon" },
];

const whyChoose = [
  { icon: Zap, title: "Fast & Free", desc: "No signup required. Create twibbons instantly in your browser." },
  { icon: Layers, title: "Video & GIF Support", desc: "Go beyond static images — add twibbons to videos and GIFs." },
  { icon: Shield, title: "Privacy First", desc: "Your media is processed locally. Nothing is uploaded to our servers." },
  { icon: Download, title: "HD Export", desc: "Export crisp, high-resolution twibbons ready for any platform." },
];

const faqs = [
  { q: "What is a twibbon?", a: "A twibbon is a digital overlay or frame that you place over your profile photo or video to show support for a campaign, event, or cause." },
  { q: "Is TwibMotion free to use?", a: "Yes! TwibMotion is completely free. You can create and export twibbons without signing up or paying anything." },
  { q: "Can I create video twibbons?", a: "Absolutely. TwibMotion supports photos, GIFs, and videos. You can layer a twibbon frame over any media type and export it." },
  { q: "What formats can I export?", a: "You can export twibbons as PNG images, GIF animations, or MP4 videos depending on your base media type." },
  { q: "Do I need to install anything?", a: "No. TwibMotion works entirely in your browser. No downloads or installations needed." },
];

const HomepageSEOSections = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* How It Works */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16" aria-label="How to create a twibbon">
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-10">
          How to Create a Twibbon in Seconds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <article key={i} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Step {i + 1}</span>
              <h3 className="font-mono font-semibold text-foreground text-lg">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              <Link
                to={s.href}
                aria-label={`${s.cta}: ${s.title}`}
                className="text-primary text-sm font-mono inline-flex items-center gap-1 hover:underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {s.cta} <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16 border-t border-border" aria-label="Twibbon use cases">
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-4">
          Create Twibbons for Instagram, TikTok, and Social Media
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          TwibMotion works for any platform and any purpose. Here are some popular ways people use twibbons.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {useCases.map((u, i) => (
            <Link
              key={i}
              to={u.href}
              aria-label={`${u.cta}: ${u.title} – ${u.desc}`}
              className="block group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
            <article className="flex gap-4 p-5 rounded-lg border border-border bg-card h-full transition-colors group-hover:border-primary/60">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <u.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-mono font-semibold text-foreground mb-1">{u.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{u.desc}</p>
                <span className="text-primary text-xs font-mono inline-flex items-center gap-1">
                  {u.cta} <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </span>
              </div>
            </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Campaigns */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16 border-t border-border" aria-label="Twibbon for campaigns">
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-4">
          Twibbon Maker for Campaigns, Schools, and Events
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed mb-6">
          Whether you're launching an awareness campaign, celebrating a school event, or organizing a community gathering,
          TwibMotion makes it easy to create professional twibbon frames that anyone can use.{" "}
          <Link
            to={EDITOR_LINKS.square}
            aria-label="Open the TwibMotion editor to design a square 1:1 twibbon frame"
            className="text-primary hover:underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >Open the editor</Link>{" "}
          to design a frame, then share the template link so participants can apply twibbons to their own photos and videos.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm font-mono">
          <Link
            to={RATIO_PAGES.vertical}
            aria-label="Create a vertical 9:16 twibbon for Instagram and TikTok Stories"
            className="px-4 py-2 rounded-md border border-border hover:border-primary/60 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >9:16 Stories</Link>
          <Link
            to={RATIO_PAGES.square}
            aria-label="Create a square 1:1 twibbon for social media feeds"
            className="px-4 py-2 rounded-md border border-border hover:border-primary/60 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >1:1 Feed</Link>
          <Link
            to={RATIO_PAGES.landscape}
            aria-label="Create a landscape 16:9 twibbon for video platforms"
            className="px-4 py-2 rounded-md border border-border hover:border-primary/60 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >16:9 Video</Link>
        </div>
      </section>

      {/* Why Choose */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16 border-t border-border" aria-label="Why choose TwibMotion">
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-10">
          Why Choose TwibMotion
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {whyChoose.map((w, i) => (
            <article key={i} className="flex gap-4 p-5 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <w.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-mono font-semibold text-foreground mb-1">{w.title}</h3>
                <p className="text-muted-foreground text-sm">{w.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full max-w-3xl mx-auto px-6 py-16 border-t border-border" aria-label="Frequently asked questions">
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-10">
          Frequently Asked Questions About Twibbons
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left font-mono font-medium text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                aria-expanded={openFaq === i}
              >
                <span>{f.q}</span>
                <span className="text-primary ml-2 shrink-0">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          Ready to try it?{" "}
          <Link
            to={EDITOR_LINKS.square}
            aria-label="Open the TwibMotion editor to start creating a twibbon"
            className="text-primary hover:underline font-mono rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >Open the TwibMotion editor →</Link>
        </p>
      </section>
    </>
  );
};

export default HomepageSEOSections;
