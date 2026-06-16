
-- Add featured creator flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_featured_creator boolean NOT NULL DEFAULT false;

-- Collections table
CREATE TABLE IF NOT EXISTS public.template_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  cover_url text,
  match_category text,
  match_tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  is_indexable boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.template_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_collections TO authenticated;
GRANT ALL ON public.template_collections TO service_role;

ALTER TABLE public.template_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published collections"
  ON public.template_collections FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage collections"
  ON public.template_collections FOR ALL
  TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE TRIGGER template_collections_updated_at
  BEFORE UPDATE ON public.template_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a few collections
INSERT INTO public.template_collections (slug, title, description, match_category, match_tags, sort_order)
VALUES
  ('mpls-2027', 'MPLS 2027', 'Twibbon resmi MPLS / Masa Pengenalan Lingkungan Sekolah 2027.', 'school', ARRAY['mpls','sekolah','orientasi'], 10),
  ('hut-ri-2027', 'HUT RI 2027', 'Koleksi twibbon Hari Ulang Tahun Republik Indonesia.', 'event', ARRAY['hut-ri','kemerdekaan','17-agustus'], 20),
  ('ramadhan-2027', 'Ramadhan 2027', 'Twibbon Ramadhan, Idul Fitri, dan kegiatan Islami.', 'religious', ARRAY['ramadhan','idul-fitri','islami'], 30),
  ('wisuda-2027', 'Wisuda 2027', 'Twibbon wisuda kampus, sekolah, dan kelulusan.', 'graduation', ARRAY['wisuda','graduation','kelulusan'], 40),
  ('hari-guru-2027', 'Hari Guru 2027', 'Twibbon untuk Hari Guru Nasional dan PGRI.', 'event', ARRAY['hari-guru','pgri','guru'], 50)
ON CONFLICT (slug) DO NOTHING;
