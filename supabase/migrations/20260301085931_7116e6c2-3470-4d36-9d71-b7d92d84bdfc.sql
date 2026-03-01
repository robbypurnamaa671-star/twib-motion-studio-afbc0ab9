
-- Storage bucket for template assets (twibbon frames)
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-assets', 'template-assets', true);

-- Public read for template assets
CREATE POLICY "Template assets are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-assets');

-- Authenticated users can upload template assets
CREATE POLICY "Authenticated users can upload template assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'template-assets' AND auth.uid() IS NOT NULL);

-- Users can delete their own template assets
CREATE POLICY "Users can delete own template assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'template-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Shared templates table
CREATE TABLE public.shared_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Template',
  canvas_ratio TEXT NOT NULL,
  canvas_w INTEGER NOT NULL,
  canvas_h INTEGER NOT NULL,
  bottom_layer_url TEXT NOT NULL,
  bottom_layer_config JSONB NOT NULL DEFAULT '{}',
  top_layer_config JSONB NOT NULL DEFAULT '{}',
  lock_settings JSONB NOT NULL DEFAULT '{"lockBottomPosition": true, "lockBottomMedia": true, "allowTopRotation": true, "topMinScale": 0.1, "topMaxScale": 5}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.shared_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view templates (public share links)
CREATE POLICY "Templates are publicly readable"
ON public.shared_templates FOR SELECT USING (true);

-- Only authenticated owners can create
CREATE POLICY "Authenticated users can create templates"
ON public.shared_templates FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can update their templates
CREATE POLICY "Owners can update their templates"
ON public.shared_templates FOR UPDATE
USING (auth.uid() = owner_id);

-- Owners can delete their templates
CREATE POLICY "Owners can delete their templates"
ON public.shared_templates FOR DELETE
USING (auth.uid() = owner_id);
