// Vercel Edge Function: proxies our Supabase `og-html` function and re-emits
// the response with the correct Content-Type (text/html). This is required
// because Vercel's cross-origin `rewrites` to external destinations wrap the
// response with `Content-Type: text/plain` + `CSP: sandbox` + `nosniff`,
// which prevents WhatsApp/Facebook/Twitter/etc. from parsing Open Graph tags.
//
// A crawler request to /template/:slug is rewritten in vercel.json to
// /api/og?path=/template/:slug (SAME ORIGIN), so no content isolation is
// applied and crawlers see real HTML with the OG meta tags.

export const config = { runtime: "edge" };

const UPSTREAM = "https://xfybnitxislnuetlltaz.supabase.co/functions/v1/og-html";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let path = url.searchParams.get("path") || "/";
  if (!path.startsWith("/")) path = "/" + path;

  try {
    const upstream = await fetch(`${UPSTREAM}?path=${encodeURIComponent(path)}`, {
      headers: { "user-agent": req.headers.get("user-agent") || "TwibMotion-OG-Proxy/1.0" },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
        "X-OG-Proxy": "1",
      },
    });
  } catch (e) {
    // No meta refresh here: a refresh to the same canonical URL is treated as a
    // redirect loop by search crawlers ("Redirect error" in Search Console).
    return new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TwibMotion</title>` +
        `<link rel="canonical" href="https://twibmotion.com${path}"></head>` +
        `<body><a href="https://twibmotion.com${path}">Continue to TwibMotion</a></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
