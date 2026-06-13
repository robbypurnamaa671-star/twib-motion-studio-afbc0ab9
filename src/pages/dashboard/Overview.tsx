import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { FolderKanban, Eye, Sparkles, Globe, Lock, Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  total: number;
  publicCount: number;
  privateCount: number;
  draftCount: number;
  views: number;
  uses: number;
  favorites: number;
}

const EMPTY: Stats = { total: 0, publicCount: 0, privateCount: 0, draftCount: 0, views: 0, uses: 0, favorites: 0 };

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: tpls } = await supabase
        .from("shared_templates")
        .select("id, visibility, view_count, usage_count, is_public")
        .eq("owner_id", user.id)
        .is("deleted_at", null);
      const rows = tpls ?? [];
      const { count: favCount } = await supabase
        .from("template_favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setStats({
        total: rows.length,
        publicCount: rows.filter((r: any) => r.visibility === "public" || r.is_public).length,
        privateCount: rows.filter((r: any) => r.visibility === "private").length,
        draftCount: rows.filter((r: any) => r.visibility === "draft").length,
        views: rows.reduce((s, r: any) => s + (r.view_count ?? 0), 0),
        uses: rows.reduce((s, r: any) => s + (r.usage_count ?? 0), 0),
        favorites: favCount ?? 0,
      });
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout title="Overview" description="Your creator activity at a glance.">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={FolderKanban} label="Total templates" value={stats.total} loading={loading} />
        <StatCard icon={Globe} label="Public" value={stats.publicCount} loading={loading} />
        <StatCard icon={Lock} label="Private" value={stats.privateCount} loading={loading} />
        <StatCard icon={Sparkles} label="Drafts" value={stats.draftCount} loading={loading} />
        <StatCard icon={Eye} label="Total views" value={stats.views} loading={loading} />
        <StatCard icon={Heart} label="Favorites" value={stats.favorites} loading={loading} />
      </div>

      <div className="mt-8 grid sm:grid-cols-2 gap-3">
        <Link
          to="/dashboard/templates"
          className="block p-4 rounded-lg border border-border bg-card hover:bg-secondary"
        >
          <div className="font-mono font-bold">Manage templates →</div>
          <p className="text-sm text-muted-foreground mt-1">Edit, publish, or remove your twibbons.</p>
        </Link>
        <Link
          to="/dashboard/profile"
          className="block p-4 rounded-lg border border-border bg-card hover:bg-secondary"
        >
          <div className="font-mono font-bold">Edit profile →</div>
          <p className="text-sm text-muted-foreground mt-1">Set your username, bio, and social links.</p>
        </Link>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: any;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-widest">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-2xl font-bold mt-2">{loading ? "…" : value.toLocaleString()}</div>
    </div>
  );
}