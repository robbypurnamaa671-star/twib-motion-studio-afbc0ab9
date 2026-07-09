## Priority 5.5 — Dynamic Social Preview System

### The core constraint
TwibMotion is a client-side React SPA. Meta tags set with JavaScript (like our current `SEOHead`) are **invisible to social crawlers** (WhatsApp, Facebook, Telegram, Discord, LinkedIn, X) because they don't run JS — they only read the static HTML response. That's why every shared link currently shows the homepage title/logo. Fixing this requires serving crawler-specific HTML at the network edge, not just changing React code.

### Architecture

```text
Social crawler (WhatsApp/FB/etc)
      │  GET /template/example
      ▼
Vercel edge (vercel.json rewrite by User-Agent)
      │  → /api/og-html?path=/template/example
      ▼
Supabase Edge Function `og-html`
      │  looks up template in DB
      │  returns tiny HTML shell with full OG tags
      │  points og:image → /api/og-image?id=<uuid>
      ▼
Supabase Edge Function `og-image`
      │  first call: renders 1200×630 JPEG using @vercel/og / satori,
      │             composites template preview + title + @creator + logo,
      │             uploads to storage bucket `social-previews`
      │  next calls: 302 redirect to cached CDN URL
      ▼
Real user browsers still get the normal SPA (unchanged)
```

Crawlers detected by user-agent match: `facebookexternalhit`, `WhatsApp`, `Twitterbot`, `Slackbot`, `TelegramBot`, `Discordbot`, `LinkedInBot`, `Applebot`.

### Pages covered
Same edge function handles all of these — one lookup per route type:
- `/template/:slug` → template preview + title + `@creator`
- `/creator/:username` → avatar + display name + stats
- `/community/category/:slug` → category name + top templates grid
- `/collections/:slug` → collection cover + title
- `/blog/:slug` → cover image + title + author

### Preview image design (1200×630)
- Background: soft cyan → dark gradient (brand tokens)
- Center: template preview rendered at correct aspect, max ~520px tall
- Bottom left: template title (JetBrains Mono, bold) + `by @username`
- Bottom right: small "TwibMotion" wordmark
- Output: JPEG q82, target <150 KB (hard cap 300 KB)

### Storage & caching
- New public bucket `social-previews` (Cache-Control: `public, max-age=31536000, immutable`)
- Object path: `social-previews/template/{id}-{contentHash}.jpg` — content hash of `{title, preview_url, owner_id, category}` so any change auto-invalidates without manual purge
- On lookup: if hashed object exists → 302 redirect; else render, upload, redirect
- Old hashed objects become orphaned but harmless (can be swept later)

### Files
**New**
- `supabase/functions/og-html/index.ts` — resolves route, returns HTML shell with OG tags
- `supabase/functions/og-image/index.ts` — renders/serves the 1200×630 JPEG (uses `npm:satori` + `npm:@resvg/resvg-js` for PNG, then `npm:sharp`-free JPEG via canvas... actually use `npm:@vercel/og` which handles all of it in Deno)
- Migration: create `social-previews` public bucket with public read policy

**Edited**
- `vercel.json` — add `rewrites` that route crawler UAs on `/template/*`, `/creator/*`, `/community/category/*`, `/collections/*`, `/blog/*` to the `og-html` function; all other requests unchanged
- `supabase/config.toml` — register both new functions with `verify_jwt = false`

### Non-goals for this pass
- Regenerating OG images on background jobs (lazy generation on first crawler hit is enough)
- Editing the SPA's `SEOHead` — real users still get the client-rendered meta, crawlers get the edge HTML
- Sweeping orphaned old-hash previews (fine to leave; cheap storage)

### Success check
After deploy, paste a `/template/:slug` URL into Facebook's Sharing Debugger and WhatsApp — both should show the generated card with template art, title, and `@creator`, not the TwibMotion homepage.
