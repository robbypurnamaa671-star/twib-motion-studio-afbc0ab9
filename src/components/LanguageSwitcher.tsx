import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { setLanguage, SupportedLang } from "@/i18n";

const LANGS: { code: SupportedLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa Indonesia" },
];

interface Props {
  className?: string;
}

const LanguageSwitcher = ({ className = "" }: Props) => {
  const { i18n, t } = useTranslation();
  const current = (i18n.language?.startsWith("id") ? "id" : "en") as SupportedLang;

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs font-mono ${className}`}
      role="group"
      aria-label={t("language.switchAria")}
    >
      <Globe className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="text-muted-foreground">{t("language.label")}:</span>
      <div className="inline-flex rounded-md border border-border overflow-hidden">
        {LANGS.map((l) => {
          const active = current === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              aria-pressed={active}
              lang={l.code}
              className={`px-2.5 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSwitcher;