
-- ============================================================
-- 1. PROFILES: counters
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS follower_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

-- ============================================================
-- 2. creator_follows
-- ============================================================
CREATE TABLE IF NOT EXISTS public.creator_follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, creator_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> creator_id)
);
GRANT SELECT ON public.creator_follows TO anon, authenticated;
GRANT INSERT, DELETE ON public.creator_follows TO authenticated;
GRANT ALL ON public.creator_follows TO service_role;
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows are public" ON public.creator_follows FOR SELECT USING (true);
CREATE POLICY "users follow as themselves" ON public.creator_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "users unfollow themselves" ON public.creator_follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_creator ON public.creator_follows(creator_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.creator_follows(follower_id);

-- ============================================================
-- 3. notifications
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('template_used','template_favorited','new_follower','template_trending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.shared_templates(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_all ON public.notifications(user_id, created_at DESC);

-- ============================================================
-- 4. template_clones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.template_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_template_id uuid NOT NULL REFERENCES public.shared_templates(id) ON DELETE CASCADE,
  cloned_template_id uuid NOT NULL REFERENCES public.shared_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.template_clones TO anon, authenticated;
GRANT INSERT ON public.template_clones TO authenticated;
GRANT ALL ON public.template_clones TO service_role;
ALTER TABLE public.template_clones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clones are public" ON public.template_clones FOR SELECT USING (true);
CREATE POLICY "users insert own clone" ON public.template_clones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_clones_source ON public.template_clones(source_template_id);

-- ============================================================
-- 5. newsletter_subscribers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text,
  ref_username text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone subscribes" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- ============================================================
-- 6. referrals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_username text NOT NULL,
  event text NOT NULL CHECK (event IN ('visit','signup','template_use')),
  visitor_session text,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.referrals TO anon, authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone log referral" ON public.referrals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "creator reads own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND lower(p.username) = lower(ref_username)));
CREATE INDEX IF NOT EXISTS idx_referrals_ref ON public.referrals(ref_username, created_at DESC);

-- ============================================================
-- 7. Triggers: maintain follower counts + create notifications
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_follow_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE user_id = NEW.creator_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    INSERT INTO public.notifications (user_id, type, actor_id)
      VALUES (NEW.creator_id, 'new_follower', NEW.follower_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = OLD.creator_id;
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE user_id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_follow_change ON public.creator_follows;
CREATE TRIGGER trg_follow_change AFTER INSERT OR DELETE ON public.creator_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_change();

CREATE OR REPLACE FUNCTION public.handle_favorite_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT owner_id INTO _owner FROM public.shared_templates WHERE id = NEW.template_id;
  IF _owner IS NOT NULL AND _owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, template_id)
      VALUES (_owner, 'template_favorited', NEW.user_id, NEW.template_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_favorite_notification ON public.template_favorites;
CREATE TRIGGER trg_favorite_notification AFTER INSERT ON public.template_favorites
  FOR EACH ROW EXECUTE FUNCTION public.handle_favorite_notification();

-- ============================================================
-- 8. RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.toggle_follow(_creator_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _exists boolean; _me uuid := auth.uid();
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _me = _creator_id THEN RAISE EXCEPTION 'cannot follow self'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.creator_follows WHERE follower_id = _me AND creator_id = _creator_id) INTO _exists;
  IF _exists THEN
    DELETE FROM public.creator_follows WHERE follower_id = _me AND creator_id = _creator_id;
    RETURN false;
  ELSE
    INSERT INTO public.creator_follows (follower_id, creator_id) VALUES (_me, _creator_id);
    RETURN true;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.toggle_follow(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.clone_template(_template_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := auth.uid(); _new_id uuid; _src public.shared_templates%ROWTYPE;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO _src FROM public.shared_templates WHERE id = _template_id AND is_public = true AND deleted_at IS NULL;
  IF _src.id IS NULL THEN RAISE EXCEPTION 'template not found'; END IF;
  INSERT INTO public.shared_templates (
    owner_id, title, canvas_ratio, canvas_w, canvas_h, bottom_layer_url, bottom_layer_config,
    top_layer_config, lock_settings, category, tags, format, template_type, language, event_type,
    description, preview_url, is_public, visibility, status
  ) VALUES (
    _me, _src.title || ' (clone)', _src.canvas_ratio, _src.canvas_w, _src.canvas_h, _src.bottom_layer_url,
    _src.bottom_layer_config, _src.top_layer_config, _src.lock_settings, _src.category, _src.tags,
    _src.format, _src.template_type, _src.language, _src.event_type, _src.description, _src.preview_url,
    false, 'draft', 'published'
  ) RETURNING id INTO _new_id;
  INSERT INTO public.template_clones (source_template_id, cloned_template_id, user_id)
    VALUES (_template_id, _new_id, _me);
  RETURN _new_id;
END $$;
GRANT EXECUTE ON FUNCTION public.clone_template(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(_ids uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  UPDATE public.notifications SET read_at = now()
    WHERE user_id = auth.uid() AND read_at IS NULL
      AND (_ids IS NULL OR id = ANY(_ids));
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END $$;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(COUNT(*)::int, 0) FROM public.notifications
    WHERE user_id = auth.uid() AND read_at IS NULL;
$$;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(total_templates bigint, total_creators bigint, total_uses bigint, total_downloads bigint, total_views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(*) FROM public.shared_templates WHERE is_public = true AND deleted_at IS NULL),
    (SELECT COUNT(DISTINCT owner_id) FROM public.shared_templates WHERE is_public = true AND deleted_at IS NULL),
    (SELECT COALESCE(SUM(usage_count),0) FROM public.shared_templates WHERE is_public = true AND deleted_at IS NULL),
    (SELECT COALESCE(SUM(download_count),0) FROM public.shared_templates WHERE is_public = true AND deleted_at IS NULL),
    (SELECT COALESCE(SUM(view_count),0) FROM public.shared_templates WHERE is_public = true AND deleted_at IS NULL);
$$;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_referral(_ref text, _event text, _target uuid DEFAULT NULL, _session text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _ref IS NULL OR length(_ref) = 0 THEN RETURN; END IF;
  IF _event NOT IN ('visit','signup','template_use') THEN RETURN; END IF;
  INSERT INTO public.referrals (ref_username, event, visitor_session, target_user_id)
    VALUES (lower(_ref), _event, _session, _target);
END $$;
GRANT EXECUTE ON FUNCTION public.track_referral(text, text, uuid, text) TO anon, authenticated;
