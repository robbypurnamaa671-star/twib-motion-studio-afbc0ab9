import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Play, Download, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import UserMenu from "@/components/UserMenu";
import SEOHead from "@/components/SEOHead";
import HomepageSEOSections from "@/components/HomepageSEOSections";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Index = () => {
  const [selected, setSelected] = useState(1);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const RATIOS = [
    { label: "9:16", desc: t("home.ratioVerticalDesc"), w: 1080, h: 1920 },
    { label: "1:1", desc: t("home.ratioSquareDesc"), w: 1080, h: 1080 },
    { label: "16:9", desc: t("home.ratioLandscapeDesc"), w: 1920, h: 1080 },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={t("home.metaTitle")}
        description={t("home.metaDescription")}
        canonical="https://twibmotion.com"
      />

      {/* Nav */}
      <header>
        <nav className="border-b border-border px-6 py-4 flex items-center justify-between" aria-label={t("nav.main")}>
          <a href="/" className="flex items-center gap-2" aria-label={t("nav.twibmotionHome")}>
            <img src="/logo.png" alt="TwibMotion logo" width={32} height={32} className="w-8 h-8 rounded-md" />
            <span className="font-mono font-bold text-lg text-foreground tracking-tight">
              TwibMotion
            </span>
          </a>
          <UserMenu />
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center">
        <section className="flex flex-col items-center justify-center px-6 py-16 gap-12" aria-label="Hero">
          <div className="text-center max-w-2xl animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-mono font-bold text-foreground tracking-tight mb-4 leading-tight">
              {t("home.heroTitle")}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed font-mono font-normal">
              {t("home.heroSubtitle")}
            </p>
          </div>

          {/* Features */}
          <div className="flex gap-6 md:gap-10 text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t("home.feat2Layer")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t("home.featVideo")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t("home.featHD")}</span>
            </div>
          </div>

          {/* Ratio Selection */}
          <div className="w-full max-w-lg animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <p className="text-sm text-muted-foreground font-mono mb-4 text-center uppercase tracking-widest">
              {t("home.selectRatio")}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {RATIOS.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setSelected(i)}
                  aria-pressed={selected === i}
                  className={`group relative rounded-lg border-2 p-4 transition-all duration-200 flex flex-col items-center gap-2 ${
                    selected === i
                      ? "border-primary bg-primary/10 glow-border"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-center h-16">
                    <div
                      className={`border-2 rounded-sm transition-colors ${
                        selected === i ? "border-primary" : "border-muted-foreground/30"
                      }`}
                      style={{
                        width: r.w > r.h ? 48 : (48 * r.w) / r.h,
                        height: r.h > r.w ? 48 : (48 * r.h) / r.w,
                      }}
                    >
                      <Monitor
                        className={`w-full h-full p-1 ${
                          selected === i ? "text-primary" : "text-muted-foreground/50"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold text-lg ${
                      selected === i ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {r.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.desc}</span>
                  <span className="text-xs text-muted-foreground/60">{r.w}×{r.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              const r = RATIOS[selected];
              navigate(`/editor?ratio=${r.label}&w=${r.w}&h=${r.h}`);
            }}
            className="animate-fade-in px-8 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold text-base hover:opacity-90 transition-opacity glow-border"
            style={{ animationDelay: "0.45s" }}
          >
            {t("home.openEditorCta")}
          </button>
        </section>

        {/* SEO Content Sections */}
        <HomepageSEOSections />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">{t("footer.tagline")}</p>
        <nav className="flex justify-center gap-4 text-xs text-muted-foreground" aria-label={t("nav.footer")}>
          <a href="/" className="hover:text-primary transition-colors">{t("nav.home")}</a>
        </nav>
        <LanguageSwitcher />
      </footer>
    </div>
  );
};

export default Index;
