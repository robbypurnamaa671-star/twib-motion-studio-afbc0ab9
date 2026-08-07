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
