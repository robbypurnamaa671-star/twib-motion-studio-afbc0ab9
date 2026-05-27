
-- Extend seo_pages
ALTER TABLE public.seo_pages
  ADD COLUMN IF NOT EXISTS page_type text NOT NULL DEFAULT 'keyword',
  ADD COLUMN IF NOT EXISTS route_path text,
  ADD COLUMN IF NOT EXISTS h1 text,
  ADD COLUMN IF NOT EXISTS benefits_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS howto_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS idx_seo_pages_category ON public.seo_pages(category);
CREATE INDEX IF NOT EXISTS idx_seo_pages_page_type ON public.seo_pages(page_type);

-- Blog posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  meta_description text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content_md text NOT NULL DEFAULT '',
  cover_image_url text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  related_slugs text[] NOT NULL DEFAULT '{}',
  related_seo_slugs text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are publicly readable"
  ON public.blog_posts FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert blog posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);

-- Template SEO
CREATE TABLE IF NOT EXISTS public.template_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  meta_description text NOT NULL,
  intro_text text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  is_indexable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.template_seo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_seo TO authenticated;
GRANT ALL ON public.template_seo TO service_role;

ALTER TABLE public.template_seo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Indexable template SEO pages are publicly readable"
  ON public.template_seo FOR SELECT
  USING (is_indexable = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert template SEO"
  ON public.template_seo FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update template SEO"
  ON public.template_seo FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete template SEO"
  ON public.template_seo FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_template_seo_updated_at
  BEFORE UPDATE ON public.template_seo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
