import { useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Layers, ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEOHead";
import UserMenu from "@/components/UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type RatioKey = "vertical" | "square" | "landscape";

const RATIO_META: Record<RatioKey, { ratio: "9:16" | "1:1" | "16:9"; w: number; h: number }> = {
  vertical: { ratio: "9:16", w: 1080, h: 1920 },
  square: { ratio: "1:1", w: 1080, h: 1080 },
  landscape: { ratio: "16:9", w: 1920, h: 1080 },
};

const SLUG_TO_KEY: Record<string, RatioKey> = {
  "vertical-9-16": "vertical",
  "square-1-1": "square",
  "landscape-16-9": "landscape",
};

const KEY_TO_SLUG: Record<RatioKey, string> = {
  vertical: "vertical-9-16",
  square: "square-1-1",
  landscape: "landscape-16-9",
};

const CreateTwibbon = () => {
  const { ratio: slug } = useParams<{ ratio: string }>();
  const { t } = useTranslation();
  const key = slug ? SLUG_TO_KEY[slug] : undefined;

  if (!key) return <Navigate to="/" replace />;

  const meta = RATIO_META[key];
  const label = t(`create.${key}Label`);
  const heading = t(`create.${key}Heading`);
  const intro = t(`create.${key}Intro`);
  const title = t(`create.${key}Title`);
  const description = t(`create.${key}Description`);
  const bestFor = [1, 2, 3, 4].map((n) => t(`create.${key}BestFor${n}`));
  const tips = [1, 2, 3].map((n) => t(`create.${key}Tip${n}`));

  const editorHref = useMemo(
    () => `/editor?ratio=${meta.ratio}&w=${meta.w}&h=${meta.h}`,
    [meta],
  );
  const canonical = `https://twibmotion.com/create/${slug}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title={title} description={description} canonical={canonical} />

      <header>
        <nav className="border-b border-border px-6 py-4 flex items-center justify-between" aria-label={t("nav.main")}>
          <Link to="/" className="flex items-center gap-2" aria-label={t("nav.twibmotionHome")}>
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-mono font-bold text-lg text-foreground tracking-tight">TwibMotion</span>
          </Link>
          <UserMenu />
        </nav>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        <nav className="text-xs font-mono text-muted-foreground mb-6" aria-label={t("nav.breadcrumb")}>
          <Link to="/" className="hover:text-primary">{t("nav.home")}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{label}</span>
        </nav>

        <section aria-label={label} className="mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono mb-4">
            {meta.ratio} · {meta.w}×{meta.h}
          </span>
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-4 leading-tight">{heading}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">{intro}</p>
          <Link
            to={editorHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity glow-border"
          >
            {t("create.openRatioEditor", { ratio: meta.ratio })} <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <section aria-label={t("create.bestFor")} className="mb-12 border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">{t("create.bestFor")}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bestFor.map((b) => (
              <li key={b} className="flex items-center gap-2 text-foreground text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" /> {b}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label={t("create.tipsTitle", { ratio: meta.ratio })} className="mb-12 border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">{t("create.tipsTitle", { ratio: meta.ratio })}</h2>
          <ul className="space-y-3">
            {tips.map((tip) => (
              <li key={tip} className="text-muted-foreground text-sm leading-relaxed">— {tip}</li>
            ))}
          </ul>
        </section>

        <section aria-label={t("create.tryOther")} className="border-t border-border pt-10">
          <h2 className="text-xl font-mono font-bold text-foreground mb-6">{t("create.tryOther")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(RATIO_META) as RatioKey[])
              .filter((k) => k !== key)
              .map((k) => (
                <Link
                  key={k}
                  to={`/create/${KEY_TO_SLUG[k]}`}
                  className="block p-4 rounded-lg border border-border hover:border-primary/60 transition-colors"
                >
                  <div className="font-mono font-semibold text-foreground">{t(`create.${k}Label`)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{RATIO_META[k].w}×{RATIO_META[k].h}</div>
                </Link>
              ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">{t("footer.tagline")}</p>
        <LanguageSwitcher />
      </footer>
    </div>
  );
};

export default CreateTwibbon;