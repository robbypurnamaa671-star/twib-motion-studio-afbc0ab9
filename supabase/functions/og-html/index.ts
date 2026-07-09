// Serves a lightweight HTML shell with proper Open Graph tags for social
// crawlers (WhatsApp, Facebook, Telegram, Discord, LinkedIn, X, etc.).
// Real user browsers get redirected via <meta http-equiv="refresh"> to the
// actual SPA route so this endpoint is safe if a crawler UA rule accidentally
// matches a browser.
//
// Query params:
//   path = /template/:slug | /creator/:username | /collections/:slug |
//          /blog/:slug | /community/category/:slug

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://twibmotion.com";
const OG_FN = `${SUPABASE_URL}/functions/v1/og-image`;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Meta = {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType?: string;
};

async function resolveMeta(path: string): Promise<Meta> {
  const canonical = `${SITE}${path}`;
  const defaults: Meta = {
    title: "TwibMotion – Free Twibbon Maker",
    description: "Create twibbons with photos, GIFs, and videos in seconds.",
    canonical,
    ogImage: `${SITE}/og-image.png`,
    ogType: "website",
  };

  const m = path.match(/^\/(?:template|use-template)\/([^/?#]+)/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    const canonicalTemplate = `${SITE}/template/${slug}`;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const q = admin
      .from("shared_templates")
      .select("id,title,slug,description,category,profiles:owner_id(username,display_name)")
      .eq("is_public", true)
      .is("deleted_at", null);
    const { data, error } = isUuid
      ? await q.eq("id", slug).maybeSingle()
      : await q.eq("slug", slug).maybeSingle();
    if (error) console.error("og-html template lookup error", slug, error);
    console.log("og-html template lookup", { slug, found: !!data });
    if (data) {
      const t: any = data;
      const creator = t.profiles?.username ? ` by @${t.profiles.username}` : "";
      return {
        title: `Template Twibbon ${t.title} | TwibMotion`,
        description:
          t.description?.trim() ||
          `Use the "${t.title}" twibbon template${creator} online for free on TwibMotion. Upload your photo, GIF, or video and export in HD.`,
        canonical: canonicalTemplate,
        ogImage: `${OG_FN}?type=template&id=${encodeURIComponent(t.slug || slug)}`,
        ogType: "article",
      };
    }
  }

  const c = path.match(/^\/creator\/([^/?#]+)/);
  if (c) {
    const username = decodeURIComponent(c[1]);
    const { data } = await admin
      .from("profiles")
      .select("username,display_name,bio")
      .eq("username", username)
      .maybeSingle();
    if (data) {
      const p: any = data;
      return {
        title: `${p.display_name || "@" + p.username} · Creator on TwibMotion`,
        description: p.bio || `Twibbon templates by @${p.username} on TwibMotion.`,
        canonical,
        ogImage: `${OG_FN}?type=creator&id=${encodeURIComponent(username)}`,
        ogType: "profile",
      };
    }
  }

  const b = path.match(/^\/blog\/([^/?#]+)/);
  if (b) {
    const slug = decodeURIComponent(b[1]);
    const { data } = await (admin as any)
      .from("blog_posts")
      .select("title,slug,excerpt,author")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (data) {
      const post: any = data;
      return {
        title: `${post.title} | TwibMotion Blog`,
        description: post.excerpt || "Read on the TwibMotion blog.",
        canonical,
        ogImage: `${OG_FN}?type=blog&id=${encodeURIComponent(slug)}`,
        ogType: "article",
      };
    }
  }

  const col = path.match(/^\/collections\/([^/?#]+)/);
  if (col) {
    const slug = decodeURIComponent(col[1]);
    const { data } = await admin
      .from("template_collections")
      .select("title,slug,description")
      .eq("slug", slug)
      .maybeSingle();
    if (data) {
      const c2: any = data;
      return {
        title: `${c2.title} · Collection | TwibMotion`,
        description: c2.description || `Curated twibbon collection on TwibMotion.`,
        canonical,
        ogImage: `${OG_FN}?type=collection&id=${encodeURIComponent(slug)}`,
        ogType: "article",
      };
    }
  }

  const cat = path.match(/^\/community\/category\/([^/?#]+)/);
  if (cat) {
    const slug = decodeURIComponent(cat[1]);
    const name = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    return {
      title: `${name} Twibbon Templates | TwibMotion Community`,
      description: `Browse ${name} twibbon templates shared by creators on TwibMotion.`,
      canonical,
      ogImage: `${OG_FN}?type=category&id=${encodeURIComponent(slug)}`,
      ogType: "website",
    };
  }

  return defaults;
}

function renderHtml(meta: Meta): string {
  const { title, description, canonical, ogImage, ogType } = meta;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:site_name" content="TwibMotion" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:type" content="${esc(ogType || "website")}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:secure_url" content="${esc(ogImage)}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />
<meta http-equiv="refresh" content="0; url=${esc(canonical)}" />
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<p><a href="${esc(canonical)}">Continue to TwibMotion →</a></p>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  let path = url.searchParams.get("path") || "/";
  if (!path.startsWith("/")) path = "/" + path;
  try {
    const meta = await resolveMeta(path);
    const html = renderHtml(meta);
    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (e) {
    console.error("og-html error", e);
    const meta: Meta = {
      title: "TwibMotion",
      description: "Free twibbon maker.",
      canonical: `${SITE}${path}`,
      ogImage: `${SITE}/og-image.png`,
    };
    return new Response(renderHtml(meta), {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});