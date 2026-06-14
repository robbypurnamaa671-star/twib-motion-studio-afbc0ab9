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

async function fetchJson(url: string, label: string): Promise<any[] | null> {
  try {
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`sitemap: ${label} fetch failed (${res.status}) at ${url} :: ${body.slice(0, 200)}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn(`sitemap: ${label} fetch error`, e);
    return null;
  }
}

async function fetchSeoPages(): Promise<SitemapEntry[]> {
  const rows = await fetchJson(
    `${SUPABASE_URL}/rest/v1/seo_pages?select=slug,updated_at,page_type,route_path&is_indexable=eq.true`,
    "seo_pages",
  );
  if (!rows) return [];
  return (rows as { slug: string; updated_at: string; page_type?: string; route_path?: string }[]).map((r) => ({
    path: r.page_type === "global" && r.route_path ? r.route_path : `/twibbon/${r.slug}`,
    lastmod: r.updated_at?.split("T")[0],
    changefreq: "weekly" as const,
    priority: "0.8",
  }));
}

async function fetchBlogPosts(): Promise<SitemapEntry[]> {
  const rows = await fetchJson(
    `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at&is_published=eq.true`,
    "blog_posts",
  );
  if (!rows) return [];
  return (rows as { slug: string; updated_at: string }[]).map((r) => ({
    path: `/blog/${r.slug}`,
    lastmod: r.updated_at?.split("T")[0],
    changefreq: "weekly" as const,
    priority: "0.7",
  }));
}

async function fetchTemplateSeo(): Promise<SitemapEntry[]> {
  const rows = await fetchJson(
    `${SUPABASE_URL}/rest/v1/template_seo?select=slug,updated_at&is_indexable=eq.true`,
    "template_seo",
  );
  if (!rows) return [];
  return (rows as { slug: string; updated_at: string }[]).map((r) => ({
    path: `/template/${r.slug}`,
    lastmod: r.updated_at?.split("T")[0],
    changefreq: "weekly" as const,
    priority: "0.7",
  }));
}

interface PublicTemplate {
  slug: string;
  title: string;
  bottom_layer_url: string;
  preview_url: string | null;
  canvas_w: number;
  canvas_h: number;
  created_at: string;
}

async function fetchPublicTemplates(): Promise<PublicTemplate[]> {
  const rows = await fetchJson(
    `${SUPABASE_URL}/rest/v1/shared_templates?select=slug,title,bottom_layer_url,preview_url,canvas_w,canvas_h,created_at&is_public=eq.true&slug=not.is.null`,
    "shared_templates",
  );
  return (rows as PublicTemplate[]) || [];
}

async function fetchCreatorUsernames(): Promise<SitemapEntry[]> {
  const owners = await fetchJson(
    `${SUPABASE_URL}/rest/v1/shared_templates?select=owner_id&is_public=eq.true`,
    "shared_templates.owners",
  );
  if (!owners) return [];
  const ownerIds = Array.from(
    new Set((owners as { owner_id: string | null }[]).map((r) => r.owner_id).filter(Boolean)),
  ) as string[];
  if (ownerIds.length === 0) return [];
  const inList = ownerIds.map((id) => `"${id}"`).join(",");
  const profiles = await fetchJson(
    `${SUPABASE_URL}/rest/v1/profiles?select=username,updated_at&user_id=in.(${inList})&username=not.is.null`,
    "profiles",
  );
  if (!profiles) return [];
  return (profiles as { username: string; updated_at: string }[]).map((p) => ({
    path: `/creator/${p.username}`,
    lastmod: p.updated_at?.split("T")[0],
    changefreq: "weekly" as const,
    priority: "0.6",
  }));
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

function xmlEscape(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function buildImageSitemap(templates: PublicTemplate[]) {
  const urls = templates
    .filter((t) => t.slug && (t.preview_url || t.bottom_layer_url))
    .map((t) => {
      const pageLoc = `${BASE_URL}/template/${t.slug}`;
      const imgLoc = (t.preview_url || t.bottom_layer_url)!;
      const alt = `Template Twibbon ${t.title}`;
      return [
        `  <url>`,
        `    <loc>${pageLoc}</loc>`,
        `    <image:image>`,
        `      <image:loc>${xmlEscape(imgLoc)}</image:loc>`,
        `      <image:title>${xmlEscape(alt)}</image:title>`,
        `      <image:caption>${xmlEscape(alt)}</image:caption>`,
        `    </image:image>`,
        `  </url>`,
      ].join("\n");
    });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const [seo, blog, tpl, publicTpls, creators] = await Promise.all([
    fetchSeoPages(),
    fetchBlogPosts(),
    fetchTemplateSeo(),
    fetchPublicTemplates(),
    fetchCreatorUsernames(),
  ]);
  const publicTplEntries: SitemapEntry[] = publicTpls.map((t) => ({
    path: `/template/${t.slug}`,
    lastmod: t.created_at?.split("T")[0],
    changefreq: "weekly" as const,
    priority: "0.7",
  }));
  // De-duplicate against template_seo slugs
  const seenTpl = new Set(tpl.map((e) => e.path));
  const mergedTpl = [...tpl, ...publicTplEntries.filter((e) => !seenTpl.has(e.path))];
  const all = [...staticEntries, ...seo, ...blog, ...mergedTpl, ...creators];
  writeFileSync(resolve("public/sitemap.xml"), buildSitemap(all));
  writeFileSync(resolve("public/image-sitemap.xml"), buildImageSitemap(publicTpls));
  console.log(
    `sitemap.xml written (${all.length} entries: ${staticEntries.length} static + ${seo.length} SEO + ${blog.length} blog + ${mergedTpl.length} templates + ${creators.length} creators)`,
  );
  console.log(`image-sitemap.xml written (${publicTpls.length} template images)`);
})();