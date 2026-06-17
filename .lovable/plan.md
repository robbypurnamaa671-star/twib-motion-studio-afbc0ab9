# Priority 6 — Growth Loop & Viral Distribution

Turn every user action into a growth lever: sharing, cloning, following, notifications, referrals, embeds, email, and social proof.

## 1. Database (one migration)

- `template_clones` (source_template_id, cloned_template_id, user_id, created_at) — analytics.
- `creator_follows` (follower_id, creator_id, created_at, PK on pair).
  - Triggers update denormalized `profiles.follower_count` / `following_count`.
- `notifications` (id, user_id, type enum [`template_used`, `template_favorited`, `new_follower`, `template_trending`], actor_id, template_id?, read_at, created_at). RLS: user reads own.
- `newsletter_subscribers` (email unique, source, ref_username?, created_at, confirmed_at?).
- `referrals` (id, ref_username, visitor_session, event [`visit`,`signup`,`template_use`], target_user_id?, created_at).
- `profiles`: add `follower_count int`, `following_count int`, `referral_code text unique` (default = username).
- `shared_templates`: add `badge text[]` (computed via scheduled job — Trending/Popular/New/Editor's Pick) + keep existing `is_featured`.
- RPCs: `toggle_follow(_creator_id)`, `clone_template(_template_id)`, `mark_notifications_read(_ids uuid[])`, `get_unread_notification_count()`, `get_public_stats()` (cached counts), `track_referral(_ref text, _event text, _target uuid?)`.
- GRANTs to `authenticated`/`anon` per policy; `service_role` for edge function writes.

## 2. Share system (`/template/:slug`)

- New `src/components/share/ShareBar.tsx`: WhatsApp, Facebook, X, Telegram, LinkedIn, Copy Link buttons using share URLs + tracked with `?ref=<username>` when current user is logged in.
- Mount on `TemplateSEO`, `CreatorProfile`, and post-export success dialog in `ExportDialog`.
- Add `OpenGraph` already covered in P5.

## 3. Use + Clone

- `TemplateSEO` already has "Use This Template". Add **"Clone This Template"** button → calls `clone_template` RPC which inserts a new `shared_templates` row owned by current user (is_public=false by default), copies asset URLs (no re-upload), then navigates to `/dashboard/templates/:newId/edit` (existing editor route) for further changes.
- Auth gate: redirect to `/auth?next=clone:<slug>`.

## 4. Creator follow

- `useFollow(creatorId)` hook → `toggle_follow` RPC.
- `FollowButton` component on `CreatorProfile` and `CreatorCard`.
- `CreatorProfile`: add follower / following / templates / total uses tiles.
- New `/dashboard/following` page listing creators + latest templates feed.

## 5. Notifications

- Triggers on `template_favorites` INSERT → notify template owner.
- Trigger on `shared_templates.usage_count` increment via `increment_template_use` RPC extension → insert notification (rate-limited: max 1 per actor per template per day).
- Trigger on `creator_follows` INSERT → notify creator.
- Daily cron (pg_cron + pg_net hitting an edge function `compute-badges`) recalculates trending and inserts `template_trending` notifications + updates `badge` field.
- Header bell `NotificationBell` (UserMenu) shows unread count + dropdown last 10. `/dashboard/notifications` full list.

## 6. Featured badges

- `BadgeChip` component renders icons for `trending|popular|featured|new|editors_pick`.
- Compute rules in `compute-badges` edge function: New (< 7 days), Trending (top 20 by 7-day score), Popular (top 50 all-time score), Featured (`is_featured=true`), Editor's Pick (admin toggle `is_editors_pick` — small admin addition).
- Render in `TemplateGrid`, `TemplateSEO`.

## 7. Referral system

- Each profile gets `referral_code = username`. Shareable link: `https://twibmotion.com/?ref=<code>`.
- `src/lib/referrals.ts`: parses `?ref=`, stores in localStorage 30 days, calls `track_referral` on landing, on signup (in `AuthContext`), and on `increment_template_use`.
- `/dashboard/referrals`: visits / signups / template uses, copyable link, share buttons.

## 8. Embed system

- Public route `/embed/:slug` → minimalist `<iframe>`-friendly page: template preview, title, creator handle, CTA "Use on TwibMotion". `X-Frame-Options` not blocked (Vite/Vercel default allows; we don't set CSP frame-ancestors).
- `EmbedCodeDialog` on `TemplateSEO` providing `<iframe src=".../embed/<slug>" width="400" height="500" frameborder="0"></iframe>` snippet + copy button.

## 9. Email (newsletter + transactional)

Use **Resend connector** (gateway). Two edge functions:
- `newsletter-subscribe` (public): validates email, inserts into `newsletter_subscribers`, sends confirmation via Resend.
- `notify` (service-role, called from triggers via pg_net): sends transactional emails for `new_follower`, `new_favorite`, `template_used` (digest, max 1 per 24h per recipient via dedup column), `template_trending`.
- `NewsletterSignup` component embedded in homepage footer, blog, community hub.
- Note: requires user to connect Resend. If not connected, in-app notifications still work; we skip email send gracefully.

## 10. Public stats + social proof

- Edge function or simple SQL view `public_stats` (cached 5m in memory in `community-queries`): totals templates / creators / uses / downloads.
- `StatsStrip` component on homepage + `/community` showing the four counters with animated count-up.
- Homepage (`Index.tsx`) gets three new sections via `HomepageSEOSections` extension: Trending Templates, Featured Creators, Recently Used — pulling from `community-queries`.

## 11. Growth pages

`/trending`, `/popular`, `/new`, `/top-creators` already exist (P5) — verify and add `/top-creators` as alias to `/creators?sort=popular`. All indexable & in sitemap (already wired). Add `/top-creators` and `/following` to sitemap script (following = noindex, dashboard).

## Out of scope (deferred)

- Real-time WebSocket notifications (we poll on focus / interval 60s).
- Per-event email preferences UI (single global opt-out via newsletter table).
- Server-rendered OG image composer (template preview already covers).

## Order of execution

1. Migration (all schema + RPCs + triggers + GRANTs).
2. Edge functions: `compute-badges`, `newsletter-subscribe`, `notify`.
3. Schedule `compute-badges` via pg_cron (insert tool, daily 03:00 UTC).
4. Shared components: `ShareBar`, `FollowButton`, `BadgeChip`, `NotificationBell`, `EmbedCodeDialog`, `NewsletterSignup`, `StatsStrip`.
5. Page wiring: `TemplateSEO`, `CreatorProfile`, `Index`, `CommunityHub`, `UserMenu`, `AuthContext`.
6. New routes: `/embed/:slug`, `/dashboard/following`, `/dashboard/notifications`, `/dashboard/referrals`, `/top-creators`.
7. Sitemap + nav linking.

## Decisions I need from you

1. **Resend connection** — emails require connecting Resend (free tier covers ~100/day). OK to add the connector now, or skip emails for v1 and only ship in-app notifications?
2. **Clone behavior** — clone creates a *private* draft owned by the cloner that they can edit & republish, OK? (Original creator keeps attribution via `cloned_from` link.)
3. **Notifications delivery** — poll every 60s when tab focused (cheap, no realtime cost), or enable Supabase Realtime on `notifications` (slightly higher cost, instant)?
