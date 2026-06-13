# Creator Platform Upgrade

This is a large multi-phase build. I'll ship it in 4 phases so you can review after each.

## Phase 1 — Profile foundation (DB + Settings + Public profile)

**Database migration**
- Extend `profiles`: add `username` (unique, citext, regex-validated via trigger), `bio`, `website_url`, `instagram_url`, `facebook_url`, `twitter_url`, `is_disabled`. Backfill `username` from email for existing users.
- Add unique index on `lower(username)`.
- Add `template_favorites` table (`user_id`, `template_id`, `created_at`, unique pair) with RLS + GRANTs.
- Add `template_views` counter columns on `shared_templates` (`view_count`, `use_count`, `download_count`, `is_featured`, `deleted_at` for soft delete, `status` enum: draft/public/private).
- Add `creator_featured` flag on `profiles`.
- RPC `increment_template_view(template_id)` (security definer) and `increment_template_use`, `increment_template_download`.
- Storage: reuse `template-assets` bucket for avatars under `avatars/{user_id}/...`.

**Frontend**
- `/dashboard/profile` (settings): edit display name, username, avatar upload, bio, social URLs. Zod validation. Username uniqueness check.
- `/creator/:username` public page: avatar, bio, socials, join date, stats, public templates grid. SEO via react-helmet-async + Person/ProfilePage JSON-LD. Indexable. Added to sitemap generator.

## Phase 2 — Dashboard + Template Management

- `/dashboard` overview: counts (templates, public, private, views, uses) + recent activity.
- `/dashboard/templates`: tabs Draft / Public / Private. Cards show preview, title, dates, views, uses, status badge.
- Per-template editor drawer: title, description, tags, category, thumbnail, public/private toggle, publish/unpublish, soft-delete.
- `/dashboard/analytics`: aggregate + per-template charts (recharts).
- `/dashboard/favorites`: liked templates grid.
- Sidebar shell with Overview / Templates / Profile / Analytics / Favorites / Settings.

## Phase 3 — Community + Discovery

- Community template cards (PublicGallery + TemplateSEO related grid): show creator avatar + `@username` linking to `/creator/:username`.
- Community page filters: Newest / Most Popular (likes) / Most Used / Most Viewed.
- Search by template name, creator username, tags (single search box, debounced).
- Favorite/like button on cards (heart, optimistic).
- TemplateSEO page: add creator attribution block + related creators section.
- View tracking: call `increment_template_view` on TemplateSEO + UseTemplate mount (deduped per session).
- Use tracking: increment on UseTemplate export. Download tracking: on export complete.

## Phase 4 — Admin + SEO polish

- Admin Users page: edit username, disable account, feature creator.
- Admin Templates page: feature template, hard delete.
- Sitemap generator: include all `/creator/:username` for users with ≥1 public template.
- robots/canonical updated.

## Technical notes

- All new tables follow GRANT → RLS → POLICY order. `template_favorites` policies scope by `auth.uid()`.
- Username regex: `^[a-z0-9][a-z0-9-]{1,29}$` enforced via CHECK + zod.
- Soft delete: `deleted_at IS NULL` filter everywhere; admin can hard-delete.
- View counters use security-definer RPC to bypass RLS for anonymous increments, with simple in-session dedup on client.
- Avatar uploads: 2MB cap, jpeg/png/webp, stored at `template-assets/avatars/{user_id}/avatar.{ext}`.
- Re-uses existing two-layer editor — no changes to canvas/export engine.

Confirm and I'll start with Phase 1 (DB migration + profile settings + public creator page).
