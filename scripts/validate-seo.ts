// Fails the build if any SEO-facing URL points at the Lovable preview domain.
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const BAD = /lovable\.app/i;
const SEO_HINT = /canonical|og:url|ogUrl|jsonLd|"url"|"@id"|mainEntityOfPage|sitemap|<loc>|BASE|SITE_URL|href=|to=/i;

const files: string[] = [];
function walk(dir: string) {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === "dist" || e === ".git") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|html|xml|txt)$/.test(p)) files.push(p);
  }
}
for (const d of ["src", "scripts", "public", "api"]) if (existsSync(d)) walk(d);
if (existsSync("index.html")) files.push("index.html");

const violations: string[] = [];
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (BAD.test(line) && SEO_HINT.test(line)) violations.push(`${f}:${i + 1}: ${line.trim()}`);
  });
}

if (violations.length) {
  console.error("\n[validate-seo] SEO-facing lovable.app URLs found in production output:\n");
  violations.forEach((v) => console.error("  " + v));
  console.error("\nUse SITE_URL from src/lib/site.ts (https://twibmotion.com) instead.\n");
  process.exit(1);
}
console.log("[validate-seo] OK — no lovable.app URLs in SEO-facing output.");

// ---------------------------------------------------------------------------
// Redirect-loop guards (Search Console "Redirect error")
// ---------------------------------------------------------------------------
const errors: string[] = [];

// 1. No <meta http-equiv="refresh"> anywhere in crawler-facing HTML output.
//    A refresh to the page's own canonical URL is an infinite redirect for
//    Googlebot and makes the production URL unindexable.
for (const f of ["api/og.ts", "supabase/functions/og-html/index.ts"]) {
  if (!existsSync(f)) continue;
  const src = readFileSync(f, "utf8");
  if (/http-equiv\s*=\s*["']?refresh/i.test(src)) {
    errors.push(`${f}: contains a meta refresh — crawlers treat this as a redirect loop.`);
  }
}

// 2. Search engines must not be routed to the OG crawler shell.
if (existsSync("vercel.json")) {
  const vercel = readFileSync("vercel.json", "utf8");
  for (const bot of ["GoogleBot", "bingbot", "DuckDuckBot", "Baiduspider", "YandexBot", "Google-InspectionTool"]) {
    if (new RegExp(`\\|${bot}\\||\\(${bot}\\||\\|${bot}\\)`, "i").test(vercel)) {
      errors.push(`vercel.json: search engine "${bot}" is routed to /api/og — it must receive the real SPA.`);
    }
  }
}

// 3. Template pages must never redirect to the homepage.
if (existsSync("src/pages/TemplateSEO.tsx")) {
  const tpl = readFileSync("src/pages/TemplateSEO.tsx", "utf8");
  if (/<Navigate\s+to=["']\/["']/.test(tpl)) {
    errors.push(`src/pages/TemplateSEO.tsx: redirects to the homepage — render a 404 instead.`);
  }
}

// 4. Sitemaps must be production-only.
for (const f of ["public/sitemap.xml", "public/image-sitemap.xml"]) {
  if (existsSync(f) && BAD.test(readFileSync(f, "utf8"))) {
    errors.push(`${f}: contains lovable.app URLs.`);
  }
}

// 5. Production must never be globally noindexed.
if (existsSync("index.html") && /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(readFileSync("index.html", "utf8"))) {
  errors.push("index.html: static noindex robots meta would deindex all of twibmotion.com.");
}

if (errors.length) {
  console.error("\n[validate-seo] Routing/redirect problems that break indexing:\n");
  errors.forEach((e) => console.error("  " + e));
  console.error("");
  process.exit(1);
}
console.log("[validate-seo] OK — no redirect loops, no homepage fallbacks, no preview leakage.");
