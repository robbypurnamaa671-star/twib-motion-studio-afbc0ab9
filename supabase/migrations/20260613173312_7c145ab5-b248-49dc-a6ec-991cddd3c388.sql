
-- Phase 1: profiles + favorites + template counters

-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS creator_featured boolean NOT NULL DEFAULT false;

-- Backfill usernames from email/display_name for existing users
DO $$
DECLARE r record; base text; candidate text; n int;
BEGIN
  FOR r IN SELECT p.id, p.user_id, p.display_name, u.email
           FROM public.profiles p JOIN auth.users u ON u.id = p.user_id
           WHERE p.username IS NULL LOOP
    base := public.slugify(COALESCE(NULLIF(r.display_name,''), split_part(r.email,'@',1), 'user'));
    IF base IS NULL OR base = '' OR length(base) < 2 THEN base := 'user'; END IF;
    base := substr(base, 1, 28);
    candidate := base; n := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(candidate)) LOOP
      n := n + 1;
      candidate := base || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,4);
      IF n > 5 THEN EXIT; END IF;
    END LOOP;
    UPDATE public.profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END$$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format CHECK (username IS NULL OR username ~ '^[a-z0-9][a-z0-9-]{1,29}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- Update handle_new_user to seed username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  base := public.slugify(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email,'@',1),
    'user'
  ));
  IF base IS NULL OR base = '' OR length(base) < 2 THEN base := 'user'; END IF;
  base := substr(base, 1, 28);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(candidate)) LOOP
    n := n + 1;
    candidate := base || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,4);
    IF n > 5 THEN EXIT; END IF;
  END LOOP;

  INSERT INTO public.profiles (user_id, display_name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    candidate
  );
  RETURN NEW;
END;
$$;

-- 2. Extend shared_templates with counters + visibility + soft delete
ALTER TABLE public.shared_templates
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.shared_templates
  DROP CONSTRAINT IF EXISTS shared_templates_visibility_check;
ALTER TABLE public.shared_templates
  ADD CONSTRAINT shared_templates_visibility_check CHECK (visibility IN ('draft','public','private'));

-- Backfill: visibility from is_public
UPDATE public.shared_templates SET visibility = CASE WHEN is_public THEN 'public' ELSE 'private' END WHERE visibility = 'public' AND is_public = false;
UPDATE public.shared_templates SET published_at = created_at WHERE published_at IS NULL AND is_public = true;

-- updated_at trigger
DROP TRIGGER IF EXISTS update_shared_templates_updated_at ON public.shared_templates;
CREATE TRIGGER update_shared_templates_updated_at
  BEFORE UPDATE ON public.shared_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Replace public-read policy to exclude soft-deleted
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON public.shared_templates;
DROP POLICY IF EXISTS "Templates are publicly readable" ON public.shared_templates;
CREATE POLICY "Public templates are viewable by everyone"
  ON public.shared_templates FOR SELECT
  USING (deleted_at IS NULL AND (visibility = 'public' OR auth.uid() = owner_id));
CREATE POLICY "Owners can see their own templates always"
  ON public.shared_templates FOR SELECT
  USING (auth.uid() = owner_id);

-- 3. template_favorites
CREATE TABLE IF NOT EXISTS public.template_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.shared_templates(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);
GRANT SELECT, INSERT, DELETE ON public.template_favorites TO authenticated;
GRANT ALL ON public.template_favorites TO service_role;
ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own favorites"
  ON public.template_favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read favorite counts"
  ON public.template_favorites FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_template_favorites_template ON public.template_favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_user ON public.template_favorites(user_id);

-- 4. Counter RPCs (security definer)
CREATE OR REPLACE FUNCTION public.increment_template_view(_template_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.shared_templates SET view_count = view_count + 1 WHERE id = _template_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_template_use(_template_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.shared_templates SET usage_count = usage_count + 1 WHERE id = _template_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_template_download(_template_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.shared_templates SET download_count = download_count + 1 WHERE id = _template_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_template_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_use(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_download(uuid) TO anon, authenticated;

-- 5. Like count sync trigger
CREATE OR REPLACE FUNCTION public.sync_template_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shared_templates SET like_count = like_count + 1 WHERE id = NEW.template_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shared_templates SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.template_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_template_favorites_count ON public.template_favorites;
CREATE TRIGGER trg_template_favorites_count
  AFTER INSERT OR DELETE ON public.template_favorites
  FOR EACH ROW EXECUTE FUNCTION public.sync_template_like_count();
