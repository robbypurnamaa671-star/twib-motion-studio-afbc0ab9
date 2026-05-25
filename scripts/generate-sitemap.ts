// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Writes public/sitemap.xml with static routes + every indexable SEO page from the database.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://twibmotion.com";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://xfybnitxislnuetlltaz.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmeWJuaXR4aXNsbnVldGxsdGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDk4ODAsImV4cCI6MjA4NzkyNTg4MH0.jU-68dDvy4jWHsWq3HES9idazywVcs-b6TyFc-cL9mw";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/create/vertical-9-16", changefreq: "weekly", priority: "0.9" },
  { path: "/create/square-1-1", changefreq: "weekly", priority: "0.9" },
  { path: "/create/landscape-16-9", changefreq: "weekly", priority: "0.9" },
];

async function fetchSeoPages(): Promise<SitemapEntry[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/seo_pages?select=slug,updated_at&is_indexable=eq.true`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) {
      console.warn(`sitemap: seo_pages fetch failed (${res.status}), skipping dynamic entries`);
      return [];
    }
    const rows = (await res.json()) as { slug: string; updated_at: string }[];
    return rows.map((r) => ({
      path: `/twibbon/${r.slug}`,
      lastmod: r.updated_at?.split("T")[0],
      changefreq: "weekly" as const,
      priority: "0.8",
    }));
  } catch (e) {
    console.warn("sitemap: seo_pages fetch error, skipping dynamic entries", e);
    return [];
  }
}

function buildSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const seo = await fetchSeoPages();
  const all = [...staticEntries, ...seo];
  writeFileSync(resolve("public/sitemap.xml"), buildSitemap(all));
  console.log(`sitemap.xml written (${all.length} entries: ${staticEntries.length} static + ${seo.length} SEO)`);
})();