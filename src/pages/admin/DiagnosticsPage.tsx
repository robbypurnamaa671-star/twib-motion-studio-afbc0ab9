import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";

function Row({ label, value, ok }: { label: string; value: React.ReactNode; ok?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono break-all text-right ${ok === false ? "text-destructive" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

export default function DiagnosticsPage() {
  const { user } = useAuth();
  const { role, isAdmin, isSuperAdmin } = useAdminRole();
  const [blogCount, setBlogCount] = useState<number | null>(null);
  const [templateCount, setTemplateCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "(missing)";
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "(missing)";
  const publishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const mode = import.meta.env.MODE;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    (async () => {
      try {
        const [b, t] = await Promise.all([
          (supabase.from("blog_posts") as any).select("id", { count: "exact", head: true }).eq("is_published", true),
          supabase.from("shared_templates").select("id", { count: "exact", head: true }).eq("is_public", true),
        ]);
        setBlogCount(b.count ?? 0);
        setTemplateCount(t.count ?? 0);
      } catch (e: any) {
        setErr(e?.message || String(e));
      }
    })();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-mono font-bold mb-1">Diagnostics</h1>
          <p className="text-sm text-muted-foreground">Use this page to verify production parity with preview.</p>
        </div>

        <section className="rounded-lg border border-border p-4 bg-card">
          <h2 className="font-semibold mb-2">Identity</h2>
          <Row label="User ID" value={user?.id || "—"} />
          <Row label="Email" value={user?.email || "—"} />
          <Row label="Role" value={role || "—"} ok={isAdmin} />
          <Row label="isAdmin" value={String(isAdmin)} ok={isAdmin} />
          <Row label="isSuperAdmin" value={String(isSuperAdmin)} ok={isSuperAdmin} />
        </section>

        <section className="rounded-lg border border-border p-4 bg-card">
          <h2 className="font-semibold mb-2">Environment</h2>
          <Row label="Origin" value={origin} />
          <Row label="Mode" value={mode} />
          <Row label="VITE_SUPABASE_URL" value={supabaseUrl} ok={!!import.meta.env.VITE_SUPABASE_URL} />
          <Row label="VITE_SUPABASE_PROJECT_ID" value={projectId} ok={!!import.meta.env.VITE_SUPABASE_PROJECT_ID} />
          <Row label="VITE_SUPABASE_PUBLISHABLE_KEY" value={publishable ? `${publishable.slice(0, 12)}…(${publishable.length} chars)` : "(missing)"} ok={!!publishable} />
          <Row label="Expected project" value="xfybnitxislnuetlltaz" ok={projectId === "xfybnitxislnuetlltaz"} />
        </section>

        <section className="rounded-lg border border-border p-4 bg-card">
          <h2 className="font-semibold mb-2">Data reachability</h2>
          <Row label="Published blog posts" value={blogCount ?? "loading…"} ok={blogCount === null ? undefined : blogCount > 0} />
          <Row label="Public community templates" value={templateCount ?? "loading…"} />
          {err && <Row label="Error" value={err} ok={false} />}
        </section>

        <p className="text-xs text-muted-foreground">
          If any row above is red on production but green in preview, your Vercel project either lacks the env vars from <code>.env</code> or is built from an older commit. Set <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_PROJECT_ID</code>, and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in Vercel → Settings → Environment Variables, then redeploy.
        </p>
      </div>
    </AdminLayout>
  );
}