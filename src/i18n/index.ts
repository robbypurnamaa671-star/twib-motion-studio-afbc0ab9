import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import id from "./locales/id.json";

export const SUPPORTED_LANGS = ["en", "id"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = "twibmotion.lang";
const GEO_DONE_KEY = "twibmotion.geo_checked";

function getInitialLang(): SupportedLang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "id") return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, id: { translation: id } },
    lng: getInitialLang(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export function setLanguage(lang: SupportedLang) {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  } catch {
    /* ignore */
  }
}

/**
 * If the user has never selected a language and we haven't geo-checked yet,
 * call ipapi.co to detect Indonesian visitors and auto-switch them to ID.
 * Runs once; never overrides an explicit user choice.
 */
export async function detectGeoLanguage(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(STORAGE_KEY)) return; // user already chose
    if (sessionStorage.getItem(GEO_DONE_KEY)) return; // already attempted this session
    sessionStorage.setItem(GEO_DONE_KEY, "1");

    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { country_code?: string; country?: string };
    const code = (data.country_code || data.country || "").toUpperCase();
    if (code === "ID") {
      i18n.changeLanguage("id");
      document.documentElement.lang = "id";
      // Do NOT persist — user can still override and we'll re-detect on next session
    }
  } catch {
    /* network/blocked — silently keep English */
  }
}

export default i18n;