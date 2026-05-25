CREATE TABLE public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  keyword text NOT NULL,
  title text NOT NULL,
  meta_description text NOT NULL,
  intro_text text NOT NULL,
  faq_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured_template_ids uuid[] NOT NULL DEFAULT '{}',
  related_slugs text[] NOT NULL DEFAULT '{}',
  is_indexable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_pages_slug ON public.seo_pages(slug);
CREATE INDEX idx_seo_pages_indexable ON public.seo_pages(is_indexable) WHERE is_indexable = true;

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Indexable SEO pages are publicly readable"
ON public.seo_pages FOR SELECT
USING (is_indexable = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert SEO pages"
ON public.seo_pages FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update SEO pages"
ON public.seo_pages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete SEO pages"
ON public.seo_pages FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_seo_pages_updated_at
BEFORE UPDATE ON public.seo_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();