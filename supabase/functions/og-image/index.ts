// Renders a 1200x630 social preview image for shared entities and caches it in
// Supabase Storage. Returns a 302 to the cached public URL on subsequent hits.
//
// Query params:
//   type = template | creator | collection | blog | category
//   id   = uuid or slug identifier for the entity
//
// The rendered image is stored at:
//   template-assets/social-previews/<type>/<id>-<hash>.png
//
// The <hash> is derived from the entity's cache-relevant fields so any change
// to title/preview/owner/category invalidates the cache without manual purge.

import { createClient } from "npm:@supabase/supabase-js@2";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

let wasmReady: Promise<void> | null = null;
function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = (async () => {
      const res = await fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
      const buf = await res.arrayBuffer();
      await initWasm(buf);
    })();
  }
  return wasmReady;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "template-assets";
const PREFIX = "social-previews";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function sha256Short(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function xmlEscape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

async function fetchImageAsDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const abs = url.startsWith("http") ? url : `${SUPABASE_URL}${url}`;
    const res = await fetch(abs, { headers: { "User-Agent": "TwibMotion-OG/1.0" } });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/png";
    if (!ct.startsWith("image/")) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    // Cap embed size at ~2MB to keep SVG small
    if (buf.byteLength > 2 * 1024 * 1024) return null;
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return `data:${ct};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

type Card = {
  title: string;
  subtitle?: string; // e.g. "by @username"
  eyebrow?: string;  // e.g. "TEMPLATE TWIBBON"
  imageDataUrl?: string | null;
  imageAspect?: number; // w/h
};

function renderSvg(card: Card): string {
  const W = 1200;
  const H = 630;
  const title = truncate(card.title || "TwibMotion", 60);
  const subtitle = truncate(card.subtitle || "twibmotion.com", 48);
  const eyebrow = (card.eyebrow || "TWIBMOTION").toUpperCase();

  // Layout: left column text (500w), right column image (600w) centered vertically.
  const IMG_BOX_W = 520;
  const IMG_BOX_H = 520;
  const IMG_BOX_X = W - IMG_BOX_W - 55;
  const IMG_BOX_Y = (H - IMG_BOX_H) / 2;

  let imageEl = "";
  if (card.imageDataUrl) {
    const aspect = card.imageAspect && card.imageAspect > 0 ? card.imageAspect : 1;
    let drawW = IMG_BOX_W;
    let drawH = IMG_BOX_W / aspect;
    if (drawH > IMG_BOX_H) {
      drawH = IMG_BOX_H;
      drawW = IMG_BOX_H * aspect;
    }
    const x = IMG_BOX_X + (IMG_BOX_W - drawW) / 2;
    const y = IMG_BOX_Y + (IMG_BOX_H - drawH) / 2;
    imageEl = `<image href="${card.imageDataUrl}" x="${x}" y="${y}" width="${drawW}" height="${drawH}" preserveAspectRatio="xMidYMid meet" />`;
  } else {
    imageEl = `<rect x="${IMG_BOX_X}" y="${IMG_BOX_Y}" width="${IMG_BOX_W}" height="${IMG_BOX_H}" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(28,181,214,0.35)" stroke-width="2" />`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071018" />
      <stop offset="55%" stop-color="#0b2130" />
      <stop offset="100%" stop-color="#1cb5d6" stop-opacity="0.55" />
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.35" r="0.6">
      <stop offset="0%" stop-color="#1cb5d6" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#1cb5d6" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />

  <!-- Text column -->
  <text x="55" y="120" fill="#1cb5d6" font-family="'JetBrains Mono', 'Menlo', monospace" font-size="22" font-weight="700" letter-spacing="4">${xmlEscape(eyebrow)}</text>

  <foreignObject x="55" y="150" width="560" height="340">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'JetBrains Mono','Menlo',monospace;color:#ffffff;font-size:56px;font-weight:800;line-height:1.15;word-wrap:break-word;">
      ${xmlEscape(title)}
    </div>
  </foreignObject>

  <text x="55" y="540" fill="rgba(255,255,255,0.75)" font-family="'JetBrains Mono','Menlo',monospace" font-size="26" font-weight="500">${xmlEscape(subtitle)}</text>

  <!-- Wordmark -->
  <g>
    <circle cx="70" cy="580" r="10" fill="#1cb5d6" />
    <text x="90" y="588" fill="#ffffff" font-family="'JetBrains Mono','Menlo',monospace" font-size="22" font-weight="800" letter-spacing="1">TwibMotion</text>
  </g>

  <!-- Image column card -->
  <rect x="${IMG_BOX_X - 10}" y="${IMG_BOX_Y - 10}" width="${IMG_BOX_W + 20}" height="${IMG_BOX_H + 20}" rx="28" fill="rgba(255,255,255,0.04)" />
  ${imageEl}
</svg>`;
}

async function renderPng(card: Card): Promise<Uint8Array> {
  const svg = renderSvg(card);
  await ensureWasm();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    background: "#071018",
    font: { loadSystemFonts: false, defaultFontFamily: "sans-serif" },
  });
  const pngData = resvg.render().asPng();
  return pngData;
}

async function loadTemplate(id: string) {
  // id may be a uuid or slug
  const q = admin
    .from("shared_templates")
    .select("id,title,slug,preview_url,bottom_layer_url,category,canvas_w,canvas_h,profiles:owner_id(username,display_name)")
    .eq("is_public", true)
    .is("deleted_at", null)
    .limit(1);
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  const { data } = isUuid ? await q.eq("id", id).maybeSingle() : await q.eq("slug", id).maybeSingle();
  return data as any;
}

async function loadCreator(username: string) {
  const { data } = await admin
    .from("profiles")
    .select("username,display_name,avatar_url,bio,follower_count")
    .eq("username", username)
    .maybeSingle();
  return data as any;
}

async function loadBlog(slug: string) {
  const { data } = await (admin as any)
    .from("blog_posts")
    .select("title,slug,cover_image_url,excerpt,author")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data as any;
}

async function loadCollection(slug: string) {
  const { data } = await admin
    .from("template_collections")
    .select("title,slug,cover_url,description")
    .eq("slug", slug)
    .maybeSingle();
  return data as any;
}

async function resolveCard(type: string, id: string): Promise<{ card: Card; cacheKey: string } | null> {
  if (type === "template") {
    const t = await loadTemplate(id);
    if (!t) return null;
    const creator = t.profiles?.username ? `by @${t.profiles.username}` : "twibmotion.com";
    const img = t.preview_url || t.bottom_layer_url;
    const dataUrl = await fetchImageAsDataUrl(img);
    const aspect = t.canvas_w && t.canvas_h ? t.canvas_w / t.canvas_h : 1;
    return {
      card: {
        title: t.title,
        subtitle: creator,
        eyebrow: `TEMPLATE TWIBBON${t.category ? " · " + t.category.toUpperCase() : ""}`,
        imageDataUrl: dataUrl,
        imageAspect: aspect,
      },
      cacheKey: await sha256Short(`t|${t.id}|${t.title}|${img}|${t.profiles?.username || ""}|${t.category || ""}`),
    };
  }
  if (type === "creator") {
    const p = await loadCreator(id);
    if (!p) return null;
    const dataUrl = await fetchImageAsDataUrl(p.avatar_url);
    return {
      card: {
        title: p.display_name || `@${p.username}`,
        subtitle: `@${p.username} · ${p.follower_count ?? 0} followers`,
        eyebrow: "CREATOR",
        imageDataUrl: dataUrl,
        imageAspect: 1,
      },
      cacheKey: await sha256Short(`c|${p.username}|${p.display_name}|${p.avatar_url}|${p.follower_count}`),
    };
  }
  if (type === "blog") {
    const b = await loadBlog(id);
    if (!b) return null;
    const dataUrl = await fetchImageAsDataUrl(b.cover_image_url);
    return {
      card: {
        title: b.title,
        subtitle: b.author ? `by ${b.author}` : "TwibMotion Blog",
        eyebrow: "BLOG",
        imageDataUrl: dataUrl,
        imageAspect: 1.6,
      },
      cacheKey: await sha256Short(`b|${b.slug}|${b.title}|${b.cover_image_url}|${b.author || ""}`),
    };
  }
  if (type === "collection") {
    const c = await loadCollection(id);
    if (!c) return null;
    const dataUrl = await fetchImageAsDataUrl(c.cover_url);
    return {
      card: {
        title: c.title,
        subtitle: "Twibbon collection · twibmotion.com",
        eyebrow: "COLLECTION",
        imageDataUrl: dataUrl,
        imageAspect: 1,
      },
      cacheKey: await sha256Short(`col|${c.slug}|${c.title}|${c.cover_url}`),
    };
  }
  if (type === "category") {
    return {
      card: {
        title: id.replace(/-/g, " "),
        subtitle: "Browse twibbon templates · twibmotion.com",
        eyebrow: "CATEGORY",
        imageDataUrl: null,
        imageAspect: 1,
      },
      cacheKey: await sha256Short(`cat|${id}`),
    };
  }
  return null;
}

function publicUrlFor(objectPath: string): string {
  const { data } = admin.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "template";
  const id = url.searchParams.get("id") || "";
  if (!id) {
    return new Response("missing id", { status: 400, headers: corsHeaders });
  }

  try {
    const resolved = await resolveCard(type, id);
    if (!resolved) {
      // Fallback: redirect to default OG image so crawlers don't see 404
      return Response.redirect("https://twibmotion.com/og-image.png", 302);
    }
    const { card, cacheKey } = resolved;
    const objectPath = `${PREFIX}/${type}/${id}-${cacheKey}.png`;
    const cachedUrl = publicUrlFor(objectPath);

    // Check if cached
    const head = await fetch(cachedUrl, { method: "HEAD" });
    if (head.ok) {
      return Response.redirect(cachedUrl, 302);
    }

    const png = await renderPng(card);
    const upload = await admin.storage.from(BUCKET).upload(objectPath, png, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: true,
    });
    if (upload.error) {
      console.error("upload failed", upload.error);
      return new Response(png, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
    return Response.redirect(cachedUrl, 302);
  } catch (e) {
    console.error("og-image error", e);
    return Response.redirect("https://twibmotion.com/og-image.png", 302);
  }
});