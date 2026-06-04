
-- ============ ADMIN ROLES (super_admin tier) ============
CREATE TABLE public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('super_admin','admin')),
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_roles TO authenticated;
GRANT ALL ON public.admin_roles TO service_role;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.admin_roles WHERE user_id = _user_id AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.admin_roles WHERE user_id = _user_id)
      OR EXISTS(SELECT 1 FROM public.user_roles  WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE POLICY "Users view own admin role" ON public.admin_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin manages admin_roles" ON public.admin_roles
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ TEMPLATE REPORTS ============
CREATE TABLE public.template_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.shared_templates(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ignored','resolved')),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_status ON public.template_reports(status, created_at DESC);
GRANT SELECT, INSERT ON public.template_reports TO authenticated;
GRANT ALL ON public.template_reports TO service_role;
ALTER TABLE public.template_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can report" ON public.template_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporters view their reports" ON public.template_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins manage reports" ON public.template_reports
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins delete reports" ON public.template_reports
  FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- ============ CREDIT HISTORY ============
CREATE TABLE public.credit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_history_user ON public.credit_history(user_id, created_at DESC);
GRANT SELECT ON public.credit_history TO authenticated;
GRANT ALL ON public.credit_history TO service_role;
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own credit history" ON public.credit_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_super(auth.uid()));

-- ============ SITE SETTINGS ============
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Super admin writes settings" ON public.site_settings
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

INSERT INTO public.site_settings(key, value) VALUES
  ('premium_monthly_price', '2'::jsonb),
  ('free_credits_per_day', '20'::jsonb),
  ('watermark_enabled', 'true'::jsonb),
  ('community_templates_enabled', 'true'::jsonb),
  ('registration_enabled', 'true'::jsonb);

-- ============ EXPORT LOGS ============
CREATE TABLE public.export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  template_id uuid,
  format text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_export_logs_created ON public.export_logs(created_at DESC);
GRANT SELECT, INSERT ON public.export_logs TO authenticated;
GRANT ALL ON public.export_logs TO service_role;
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own export" ON public.export_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins read exports" ON public.export_logs
  FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- ============ COLUMN ADDITIONS ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','suspended'));

ALTER TABLE public.shared_templates
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden','pending','deleted')),
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_trending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_staff_pick boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS premium_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz;

-- ============ SEED SUPER ADMIN ============
INSERT INTO public.admin_roles (user_id, role)
SELECT id, 'super_admin' FROM auth.users WHERE email = 'robbypurnamaa671@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Also ensure they have 'admin' in user_roles for backwards compat
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'robbypurnamaa671@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
