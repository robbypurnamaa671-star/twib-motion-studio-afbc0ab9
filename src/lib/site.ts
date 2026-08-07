// Single source of truth for SEO-facing URLs.
// Production is the ONLY canonical/indexable site.
export const SITE_URL = "https://twibmotion.com";

export const PRODUCTION_HOSTS = ["twibmotion.com", "www.twibmotion.com"];

/** True when running on a non-production host (Lovable preview, localhost, etc.). */
export function isPreviewHost(host?: string) {
  const h = (host ?? (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  if (!h) return false;
  return !PRODUCTION_HOSTS.includes(h);
}

/** Absolute production URL for a path. */
export function siteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
