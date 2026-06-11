
-- Slugify helper
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(
    regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
    '-{2,}', '-', 'g'
  ));
$$;

-- Trigger to auto-fill slug on insert (and ensure uniqueness with short suffix)
CREATE OR REPLACE FUNCTION public.shared_templates_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND length(trim(NEW.slug)) > 0 THEN
    RETURN NEW;
  END IF;
  base := public.slugify(NEW.title);
  IF base IS NULL OR base = '' THEN
    base := 'twibbon';
  END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.shared_templates WHERE slug = candidate AND id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    IF n > 5 THEN EXIT; END IF;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shared_templates_set_slug ON public.shared_templates;
CREATE TRIGGER trg_shared_templates_set_slug
BEFORE INSERT ON public.shared_templates
FOR EACH ROW EXECUTE FUNCTION public.shared_templates_set_slug();

-- Backfill existing rows
DO $$
DECLARE
  r record;
  base text;
  candidate text;
BEGIN
  FOR r IN SELECT id, title FROM public.shared_templates WHERE slug IS NULL OR slug = '' LOOP
    base := public.slugify(r.title);
    IF base IS NULL OR base = '' THEN base := 'twibbon'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.shared_templates WHERE slug = candidate AND id <> r.id) LOOP
      candidate := base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    END LOOP;
    UPDATE public.shared_templates SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS shared_templates_slug_unique ON public.shared_templates (slug) WHERE slug IS NOT NULL;
