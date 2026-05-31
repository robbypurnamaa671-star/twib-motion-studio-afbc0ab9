ALTER TABLE public.shared_templates ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.shared_templates ADD COLUMN IF NOT EXISTS preview_url text;
CREATE INDEX IF NOT EXISTS idx_shared_templates_public ON public.shared_templates(is_public, created_at DESC) WHERE is_public = true;

-- Allow anyone (including anon) to read public templates so they appear on the homepage gallery
GRANT SELECT ON public.shared_templates TO anon;

DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON public.shared_templates;
CREATE POLICY "Public templates are viewable by everyone"
ON public.shared_templates
FOR SELECT
USING (is_public = true);