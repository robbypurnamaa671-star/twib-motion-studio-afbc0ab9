## Goal
Scale the existing programmatic SEO system into a Twibbon-focused SEO powerhouse: more page types, blog system, template SEO pages, richer content blocks, internal linking, expanded admin tools, and improved sitemap — without touching editor/export/auth/Stripe.

## What already exists (keep & extend)
- `seo_pages` table + `/twibbon/:keyword` route (`TwibbonSEO.tsx`)
- Admin SEO Pages CRUD (`SeoPagesPage.tsx`)
- `scripts/generate-sitemap.ts` (predev/prebuild)
- `SEOHead` with JSON-LD support
- 6 seeded keywords

## 1. Database — new migration
Add two tables + extend `seo_pages`:

**`seo_pages`** — add columns:
- `page_type` text default `'keyword'` (`'keyword' | 'global'` — global = no `/twibbon/` prefix)
- `route_path` text — explicit path override (for global pages like `/animated-twibbon-maker`)
- `h1` text nullable
- `benefits_json` jsonb default `'[]'`  (list of `{title, description}`)
- `howto_json` jsonb default `'[]'` (list of `{step, title, description}`)
- `category` text nullable (for grouping: graduation, religious, national, etc.)

**`blog_posts`** — new table:
- slug, title, meta_description, excerpt, content_md (text), cover_image_url, category, tags text[], related_slugs text[], related_seo_slugs text[], is_published bool, published_at, updated_at
- RLS: public read where published; admin full
- GRANTs: anon SELECT, authenticated SELECT, service_role ALL

**`template_seo`** — new table linking shared_templates to SEO metadata:
- template_id (uuid, unique), slug, title, meta_description, intro_text, tags text[], is_indexable bool
- public read when indexable; admin full

## 2. Routes (App.tsx)
- `/twibbon/:keyword` — existing, enhanced
- `/p/:slug` — global SEO pages (lookup by route_path or slug where page_type='global')
- `/blog` — blog index
- `/blog/:slug` — blog post
- `/template/:slug` — public template SEO page
  
Use `/p/` prefix for global pages to avoid conflicting with existing top-level routes; admin can set `route_path` to anything.

Actually simpler: add a catch-all SEO resolver page mounted at specific known paths via the admin, OR just use `/p/:slug`. Going with `/p/:slug` for simplicity.

## 3. Enhanced TwibbonSEO page
Add content blocks in this order:
1. Breadcrumb (with JSON-LD BreadcrumbList)
2. H1 + intro
3. Template showcase (featured + category fallback from shared_templates)
4. How-to-create steps (HowTo schema)
5. Benefits/use cases
6. FAQ (existing)
7. Related categories (related_slugs → internal links)
8. CTA section → editor

Lazy-load images (`loading="lazy"`), semantic `<article>/<section>`, mobile-first.

## 4. New pages
- **`BlogIndex.tsx`** — list published posts, category filter, JSON-LD `Blog`
- **`BlogPost.tsx`** — render markdown content, Article + BreadcrumbList JSON-LD, related posts, related SEO pages, CTA
- **`GlobalSEO.tsx`** — same block structure as TwibbonSEO but for global keywords (English-first content)
- **`TemplateSEO.tsx`** — preview, description, "Use this template" CTA, related templates

## 5. Internal linking helper
`src/lib/seo-links.ts` — utility to fetch related links (related slugs, same category, trending) used by all SEO page types.

## 6. Admin extensions
Extend `SeoPagesPage.tsx`:
- Page type selector (keyword/global)
- Category field
- Benefits/howto JSON editors
- Bulk import textarea (one keyword per line → auto-generate slug+placeholder content)
- Publish toggle (already have `is_indexable`)

New admin pages:
- **`/admin/blog`** — `BlogPostsPage.tsx` CRUD
- **`/admin/template-seo`** — `TemplateSeoPage.tsx` CRUD

Add nav items to `AdminSidebar`.

## 7. Sitemap upgrades
Extend `scripts/generate-sitemap.ts` to also fetch:
- All indexable `seo_pages` (both keyword and global page_types, using correct route prefix)
- All published `blog_posts` → `/blog/:slug` + `/blog` index
- All indexable `template_seo` rows → `/template/:slug`
- Lastmod from `updated_at`

## 8. Bulk keyword seed
Insert 30+ starter Indonesian + global keywords into `seo_pages` via insert tool after migration, with sensible default copy templates (title/meta/intro/FAQ generated from keyword).

## 9. Technical SEO polish
- Add `BreadcrumbList` schema helper
- Ensure all images `loading="lazy"`, alt text
- Add canonical + OG to blog/template/global pages
- `<article>` / `<section>` / `<nav>` semantic tags

## Files to create
- `supabase/migrations/<ts>_seo_expansion.sql`
- `src/pages/BlogIndex.tsx`, `BlogPost.tsx`, `GlobalSEO.tsx`, `TemplateSEO.tsx`
- `src/pages/admin/BlogPostsPage.tsx`, `TemplateSeoPage.tsx`
- `src/lib/seo-links.ts`, `src/lib/seo-content.ts` (default content generators for bulk imports)
- `src/components/seo/Breadcrumbs.tsx`, `TemplateShowcase.tsx`, `HowToSteps.tsx`, `BenefitsGrid.tsx`, `RelatedLinks.tsx`

## Files to edit
- `src/App.tsx` (add routes)
- `src/pages/TwibbonSEO.tsx` (add new content blocks + breadcrumbs + HowTo schema)
- `src/pages/admin/SeoPagesPage.tsx` (bulk import + new fields)
- `src/components/admin/AdminSidebar.tsx` (Blog + Template SEO nav)
- `scripts/generate-sitemap.ts` (blog + template + global routes)
- `public/robots.txt` (confirm sitemap directive)

## Non-goals
- No editor / export / auth / Stripe changes
- No removal of existing SEO functionality
- No repositioning away from Twibbon niche — all copy stays Twibbon-focused

After approval I'll: (1) run the migration, (2) seed bulk keywords, (3) write all code in parallel, (4) verify sitemap output.