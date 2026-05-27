import { Upload, Layers, Download, Smartphone, School, Heart, Zap, Globe, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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