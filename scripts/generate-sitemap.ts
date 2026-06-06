// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Writes public/sitemap.xml with static routes + every indexable SEO page from the database.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://twibmotion.com";
// Pinned to the live Lovable Cloud project. Anon key is public/safe to commit.
// We intentionally do NOT read VITE_SUPABASE_URL from env unless it matches this project ref,
// because Vercel may have stale env vars pointing at an old project (causes 404 on seo_pages).
const PROJECT_REF = "xfybnitxislnuetlltaz";
const DEFAULT_URL = `https://${PROJECT_REF}.supabase.co`;
const DEFAULT_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmeWJuaXR4aXNsbnVldGxsdGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDk4ODAsImV4cCI6MjA4NzkyNTg4MH0.jU-68dDvy4jWHsWq3HES9idazywVcs-b6TyFc-cL9mw";
const envUrl = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_URL = envUrl.includes(PROJECT_REF) ? envUrl : DEFAULT_URL;
const SUPABASE_KEY =
  SUPABASE_URL === DEFAULT_URL
    ? DEFAULT_KEY
    : process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;
console.log(`sitemap: using Supabase ${SUPABASE_URL}`);

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/use-template", changefreq: "weekly", priority: "0.8" },
  { path: "/blog", changefreq: "daily", priority: "0.8" },
  { path: "/create/vertical-9-16", changefreq: "weekly", priority: "0.9" },
  { path: "/create/square-1-1", changefreq: "weekly", priority: "0.9" },
  { path: "/create/landscape-16-9", changefreq: "weekly", priority: "0.9" },
];

async function fetchSeoPages(): Promise<SitemapEntry[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/seo_pages?select=slug,updated_at,page_type,route_path&is_indexable=eq.true`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) {
      console.warn(`sitemap: seo_pages fetch failed (${res.status}), skipping dynamic entries`);
      return [];
    }
    const rows = (await res.json()) as { slug: string; updated_at: string; page_type?: string; route_path?: string }[];
    return rows.map((r) => ({
      path: r.page_type === "global" && r.route_path ? r.route_path : `/twibbon/${r.slug}`,
      lastmod: r.updated_at?.split("T")[0],
      changefreq: "weekly" as const,
      priority: "0.8",
    }));
  } catch (e) {
    console.warn("sitemap: seo_pages fetch error, skipping dynamic entries", e);
    return [];
  }
}

async function fetchBlogPosts(): Promise<SitemapEntry[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at&is_published=eq.true`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string; updated_at: string }[];
    return rows.map((r) => ({ path: `/blog/${r.slug}`, lastmod: r.updated_at?.split("T")[0], changefreq: "weekly" as const, priority: "0.7" }));
  } catch { return []; }
}

async function fetchTemplateSeo(): Promise<SitemapEntry[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/template_seo?select=slug,updated_at&is_indexable=eq.true`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string; updated_at: string }[];
    return rows.map((r) => ({ path: `/template/${r.slug}`, lastmod: r.updated_at?.split("T")[0], changefreq: "weekly" as const, priority: "0.7" }));
  } catch { return []; }
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
  const [seo, blog, tpl] = await Promise.all([fetchSeoPages(), fetchBlogPosts(), fetchTemplateSeo()]);
  const all = [...staticEntries, ...seo, ...blog, ...tpl];
  writeFileSync(resolve("public/sitemap.xml"), buildSitemap(all));
  console.log(`sitemap.xml written (${all.length} entries: ${staticEntries.length} static + ${seo.length} SEO + ${blog.length} blog + ${tpl.length} templates)`);
})();