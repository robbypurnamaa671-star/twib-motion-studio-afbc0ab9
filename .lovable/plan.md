## Priority 5 — Community SEO Engine

Turn the community into a self-growing SEO surface. All new pages indexable, sitemapped, and cross-linked.

### 1. New routes (all in `src/App.tsx`)

```text
/community                       → CommunityHub (trending, most used, most viewed, new, featured creators, popular categories)
/community/category/:slug        → CommunityCategory (top + new templates, featured creators)
/collections                     → CollectionsIndex
/collections/:slug               → CollectionPage (auto-aggregated by tag/category match)
/creators                        → CreatorLeaderboard (popular / most used / most templates / fastest growing tabs)
/trending                        → Discovery: trending today/week/month
/new                             → Discovery: newest
/popular                         → Discovery: most-liked
/featured                        → Discovery: admin-featured
/favorites                       → Public favorites feed (top-favorited templates)
```

`/dashboard/favorites` (existing) stays as the user's private list.

### 2. Data model additions (one migration)

- `shared_templates.is_featured boolean default false` (admin-controlled).
- `profiles.is_featured_creator boolean default false`.
- `template_collections` table: `slug, title, description, cover_url, match_tags text[], match_category text, is_indexable, is_published, updated_at` + admin RLS, public read.
- `template_collection_items` (optional manual override) — skip for v1, use `match_tags`/`match_category` auto-aggregation.
- View / RPC `get_trending_templates(_window text)` returning ranked list using weighted score: `usage*3 + favorites*2 + views*1` over a time window on `created_at` / recent activity. Implement as SQL functions returning `setof shared_templates`.
- RPC `get_featured_creators(_limit int)` → profiles joined with template counts and total uses, ordered by `is_featured_creator desc, total_uses desc`.
- RPC `get_creator_leaderboard(_sort text, _limit int)` for the four leaderboard sorts.

GRANTs to `anon` + `authenticated` for new tables/functions (public reads). Admin write policies via `is_admin_or_super`.

### 3. Components & shared building blocks

- `src/components/community/TemplateGrid.tsx` — reusable card grid (image, title, creator, stats badges Views/Uses/Likes).
- `src/components/community/CreatorCard.tsx` — avatar, username, templates count, total uses, link to `/creator/:username`.
- `src/components/community/StatBadges.tsx` — small badges shown on template pages ("Used 248 times • Viewed 1,524 times").
- `src/components/community/RelatedRail.tsx` — wraps Related Templates / More from Creator / Related Categories / Related Blog Posts blocks for `TemplateSEO`.
- `src/lib/community-queries.ts` — typed wrappers around the RPCs + plain Supabase queries (trending, newest, most-used, most-viewed, by-collection, by-category, leaderboard, featured creators, related-for-template).

### 4. Page implementations (frontend)

- Use existing `SeoShell` + `SEOHead` for every new page. Each page sets canonical, og:url, og:type=`website`/`profile`, JSON-LD (`CollectionPage` or `ItemList` + `BreadcrumbList`), and an H1.
- `TemplateSEO.tsx` extensions: add `StatBadges` (views/uses/downloads/favorites + publish date), `RelatedRail` (related templates by tag/category, more-from-creator, related categories as tag chips, latest 3 blog posts whose tags intersect template tags).
- `CommunityHub` shows: hero + tabs (Trending Today/Week/Month) + Most Used + Most Viewed + Newest + Featured Creators + Popular Categories (derived from `shared_templates.category` counts).
- Collection pages: pull templates whose `category = match_category` OR `tags && match_tags`.
- Category pages: similar to collections but keyed on `category`.
- Leaderboard `/creators`: tabs with the four sorts.
- Discovery `/trending`, `/new`, `/popular`, `/featured`, `/favorites` — thin pages that reuse `TemplateGrid` + correct sort, each with unique title/description/canonical and `ItemList` JSON-LD.

### 5. Internal linking

- Add CommunityHub link to header nav + `UserMenu`.
- Footer (or `HomepageSEOSections`) gets: Trending, New, Popular, Creators, Collections.
- `TemplateSEO` already links to creator + category; add Collections this template belongs to (any collection whose match rules hit) and 3 related blog posts.

### 6. Open Graph for templates

Set `og:image` on `TemplateSEO` to `preview_url || bottom_layer_url`, plus `og:image:width/height`, `twitter:card=summary_large_image`, and `og:image:alt = "Template Twibbon {title} oleh @{username}"`. Extend `SEOHead` to accept an `ogImage` prop (current version doesn't emit one). No dynamic OG render server — we ship the template preview itself, which already shows title text in-image.

### 7. Sitemap (`scripts/generate-sitemap.ts`)

Add fetchers + entries for:
- `/community`, `/trending`, `/new`, `/popular`, `/featured`, `/favorites`, `/creators`, `/collections` (static, weekly).
- `/community/category/:slug` — derive from distinct `shared_templates.category` where `is_public=true`.
- `/collections/:slug` — from `template_collections` where `is_indexable=true and is_published=true`.

Image sitemap already covers public templates; no change needed.

### 8. Admin

Extend `admin/TemplatesPage` with a "Featured" toggle (sets `is_featured`). Extend `admin/UsersPage` with "Feature creator" toggle. New `admin/CollectionsPage` for CRUD on `template_collections` (slug, title, description, cover, match rules, publish + indexable flags). Add to `AdminSidebar`.

### Out of scope (deferred)

- Server-side rendered OG image composer (would need an edge function with canvas). We use the template preview image itself as the OG image — covers the "creator username + title" requirement because templates already contain that info in-frame.
- Manual collection curation UI (auto-aggregation via tags/category is enough for v1).

### Order of execution

1. Migration (collections table, featured flags, RPCs, GRANTs).
2. `src/lib/community-queries.ts` + shared community components.
3. Routes + pages.
4. Extend `TemplateSEO` (stats, related rail, OG image).
5. Sitemap script update.
6. Admin extensions (collections + featured toggles).
7. Header/footer internal linking.
