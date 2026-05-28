
ALTER TABLE public.shared_templates
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS template_type text NOT NULL DEFAULT 'static',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'id',
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS slug text;

CREATE INDEX IF NOT EXISTS idx_shared_templates_category ON public.shared_templates(category);
CREATE INDEX IF NOT EXISTS idx_shared_templates_tags ON public.shared_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_shared_templates_slug ON public.shared_templates(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_category ON public.seo_pages(category);
CREATE INDEX IF NOT EXISTS idx_seo_pages_page_type ON public.seo_pages(page_type);
