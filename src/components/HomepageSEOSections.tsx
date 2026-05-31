import { Upload, Layers, Download, Smartphone, School, Heart, Zap, Globe, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import frame1 from "@/assets/homepage-frame-1.webp";
import frame2 from "@/assets/homepage-frame-2.webp";
import frame3 from "@/assets/homepage-frame-3.webp";
import frame4 from "@/assets/homepage-frame-4.webp";
import frame5 from "@/assets/homepage-frame-5.webp";
import frame6 from "@/assets/homepage-frame-6.webp";
import frame7 from "@/assets/homepage-frame-7.webp";
import frame8 from "@/assets/homepage-frame-8.webp";
import PublicGallery from "@/components/PublicGallery";

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

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const HomepageSEOSections = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t } = useTranslation();

  const sampleFrames = [
    { src: frame1, alt: "Elegant academic twibbon frame sample in teal and gold" },
    { src: frame2, alt: "Premium graduation twibbon frame sample with books and gold details" },
    { src: frame3, alt: "Formal education twibbon frame sample with navy and gold accents" },
    { src: frame4, alt: "Celebratory graduation twibbon frame sample with illustrated students" },
    { src: frame5, alt: "Colorful school twibbon frame sample for children and students" },
    { src: frame6, alt: "Pastel spring twibbon frame sample with rainbow and bunny illustration" },
    { src: frame7, alt: "Ocean themed twibbon frame sample with dolphin and turtle" },
    { src: frame8, alt: "Blue underwater twibbon frame sample with dolphin and whale" },
  ];

  const steps = [
    { icon: Upload, title: t("seoSections.step1Title"), desc: t("seoSections.step1Desc"), href: EDITOR_LINKS.square, cta: t("seoSections.step1Cta") },
    { icon: Layers, title: t("seoSections.step2Title"), desc: t("seoSections.step2Desc"), href: EDITOR_LINKS.square, cta: t("seoSections.step2Cta") },
    { icon: Download, title: t("seoSections.step3Title"), desc: t("seoSections.step3Desc"), href: EDITOR_LINKS.square, cta: t("seoSections.step3Cta") },
  ];

  const useCases = [
    { icon: Smartphone, title: t("seoSections.useIgTitle"), desc: t("seoSections.useIgDesc"), href: EDITOR_LINKS.vertical, cta: t("seoSections.useIgCta") },
    { icon: Globe, title: t("seoSections.useCampaignTitle"), desc: t("seoSections.useCampaignDesc"), href: EDITOR_LINKS.square, cta: t("seoSections.useCampaignCta") },
    { icon: School, title: t("seoSections.useSchoolTitle"), desc: t("seoSections.useSchoolDesc"), href: EDITOR_LINKS.square, cta: t("seoSections.useSchoolCta") },
    { icon: Heart, title: t("seoSections.useEventTitle"), desc: t("seoSections.useEventDesc"), href: EDITOR_LINKS.landscape, cta: t("seoSections.useEventCta") },
  ];

  const whyChoose = [
    { icon: Zap, title: t("seoSections.whyFastTitle"), desc: t("seoSections.whyFastDesc") },
    { icon: Layers, title: t("seoSections.whyVideoTitle"), desc: t("seoSections.whyVideoDesc") },
    { icon: Shield, title: t("seoSections.whyPrivacyTitle"), desc: t("seoSections.whyPrivacyDesc") },
    { icon: Download, title: t("seoSections.whyHDTitle"), desc: t("seoSections.whyHDDesc") },
  ];

  const faqs = [
    { q: t("seoSections.faq1Q"), a: t("seoSections.faq1A") },
    { q: t("seoSections.faq2Q"), a: t("seoSections.faq2A") },
    { q: t("seoSections.faq3Q"), a: t("seoSections.faq3A") },
    { q: t("seoSections.faq4Q"), a: t("seoSections.faq4A") },
    { q: t("seoSections.faq5Q"), a: t("seoSections.faq5A") },
  ];

  return (
    <>
      <section className="w-full max-w-4xl mx-auto px-6 py-16" aria-label={t("seoSections.howTitle")}>
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-10">
          {t("seoSections.howTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <article key={i} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {t("seoSections.step")} {i + 1}
              </span>
              <h3 className="font-mono font-semibold text-foreground text-lg">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              <Link
                to={s.href}
                aria-label={`${s.cta}: ${s.title}`}
                className={`text-primary text-sm font-mono inline-flex items-center gap-1 hover:underline rounded-sm ${focusRing}`}
              >
                {s.cta} <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <div className="text-center mb-5">
            <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Sample Twibbon Frames
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              A moving preview of frame styles users can customize inside TwibMotion.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-border bg-card/60 py-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />

            <div className="homepage-frame-marquee flex w-max gap-4 px-4">
              {[...sampleFrames, ...sampleFrames].map((frame, index) => (
                <figure
                  key={`${frame.alt}-${index}`}
                  className="w-[220px] sm:w-[260px] md:w-[300px] shrink-0 overflow-hidden rounded-md border border-border bg-background/80 shadow-sm"
                >
                  <img
                    src={frame.src}
                    alt={frame.alt}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-5xl mx-auto px-6 py-16 border-t border-border" aria-label="Public twibbons created by our users">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest mb-3">
            <Users className="w-3.5 h-3.5" /> Live community
          </div>
          <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-2">
            Twibbons created by our users
          </h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Real public twibbons made by people just like you on TwibMotion. Join thousands creating campaign frames, graduation overlays, and animated twibbons every day.
          </p>
        </div>

        {loadingPublic ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : publicTwibbons.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <Sparkles className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to share a public twibbon — your creation could appear here.
            </p>
            <Link
              to={EDITOR_LINKS.square}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm hover:opacity-90 ${focusRing}`}
            >
              Create your twibbon <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {publicTwibbons.map((tw) => (
                <Link
                  key={tw.id}
                  to={`/use-template/${tw.id}`}
                  aria-label={`Use public twibbon: ${tw.title ?? "Untitled"}`}
                  className={`group block aspect-square overflow-hidden rounded-lg border border-border bg-card relative ${focusRing}`}
                >
                  {tw.bottom_layer_url ? (
                    <img
                      src={tw.bottom_layer_url}
                      alt={tw.title ?? "Public twibbon frame by a TwibMotion user"}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No preview
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                    <p className="text-xs font-mono text-foreground truncate">{tw.title ?? "Untitled twibbon"}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                to={EDITOR_LINKS.square}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary font-mono text-sm hover:bg-primary/10 ${focusRing}`}
              >
                Make yours and join the gallery <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="w-full max-w-4xl mx-auto px-6 py-16 border-t border-border" aria-label={t("seoSections.useCasesTitle")}>
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-4">
          {t("seoSections.useCasesTitle")}
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          {t("seoSections.useCasesIntro")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {useCases.map((u, i) => (
            <Link
              key={i}
              to={u.href}
              aria-label={`${u.cta}: ${u.title} – ${u.desc}`}
              className={`block group rounded-lg ${focusRing}`}
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

      <section className="w-full max-w-4xl mx-auto px-6 py-16 border-t border-border" aria-label={t("seoSections.campaignsTitle")}>
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-4">
          {t("seoSections.campaignsTitle")}
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed mb-6">
          {t("seoSections.campaignsBody1")}{" "}
          <Link
            to={EDITOR_LINKS.square}
            aria-label={t("seoSections.campaignsCtaEditor")}
            className={`text-primary hover:underline rounded-sm ${focusRing}`}
          >
            {t("seoSections.campaignsCtaEditor")}
          </Link>{" "}
          {t("seoSections.campaignsBody2")}
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm font-mono">
          <Link
            to={RATIO_PAGES.vertical}
            aria-label={t("seoSections.ratio916")}
            className={`px-4 py-2 rounded-md border border-border hover:border-primary/60 text-foreground ${focusRing}`}
          >
            {t("seoSections.ratio916")}
          </Link>
          <Link
            to={RATIO_PAGES.square}
            aria-label={t("seoSections.ratio11")}
            className={`px-4 py-2 rounded-md border border-border hover:border-primary/60 text-foreground ${focusRing}`}
          >
            {t("seoSections.ratio11")}
          </Link>
          <Link
            to={RATIO_PAGES.landscape}
            aria-label={t("seoSections.ratio169")}
            className={`px-4 py-2 rounded-md border border-border hover:border-primary/60 text-foreground ${focusRing}`}
          >
            {t("seoSections.ratio169")}
          </Link>
        </div>
      </section>

      <section className="w-full max-w-4xl mx-auto px-6 py-16 border-t border-border" aria-label={t("seoSections.whyTitle")}>
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-10">
          {t("seoSections.whyTitle")}
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

      <section className="w-full max-w-3xl mx-auto px-6 py-16 border-t border-border" aria-label={t("seoSections.faqTitle")}>
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-foreground text-center mb-10">
          {t("seoSections.faqTitle")}
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className={`w-full flex items-center justify-between p-4 text-left font-mono font-medium text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`}
                aria-expanded={openFaq === i}
              >
                <span>{f.q}</span>
                <span className="text-primary ml-2 shrink-0">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          {t("seoSections.faqCta")}{" "}
          <Link
            to={EDITOR_LINKS.square}
            aria-label={t("seoSections.faqCtaLink")}
            className={`text-primary hover:underline font-mono rounded-sm ${focusRing}`}
          >
            {t("seoSections.faqCtaLink")}
          </Link>
        </p>
      </section>
    </>
  );
};

export default HomepageSEOSections;