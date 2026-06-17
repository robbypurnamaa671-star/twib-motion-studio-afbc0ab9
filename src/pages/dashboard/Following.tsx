import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

type Row = {
  creator_id: string;
  profile: { username: string | null; display_name: string | null; avatar_url: string | null; follower_count: number } | null;
};

export default function Following() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("creator_follows")
        .select("creator_id, created_at")
        .eq("follower_id", user.id)
        .order("created_at", { ascending: false });
      const ids = ((data ?? []) as { creator_id: string }[]).map((r) => r.creator_id);
      if (!ids.length) { setRows([]); setLoading(false); return; }
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, follower_count")
        .in("user_id", ids);
      const map = new Map<string, Row["profile"]>(
        ((profs ?? []) as Array<{ user_id: string } & NonNullable<Row["profile"]>>).map((p) => [
          p.user_id,
          { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url, follower_count: p.follower_count },
        ])
      );
      setRows(ids.map((id) => ({ creator_id: id, profile: map.get(id) ?? null })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout title="Following" description="Creators you follow.">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-mono text-muted-foreground">You don't follow anyone yet.</p>
          <Link to="/creators" className="text-sm text-primary hover:underline mt-2 inline-block">Discover creators →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((r) => (
            <Link key={r.creator_id} to={r.profile?.username ? `/creator/${r.profile.username}` : "#"}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/60">
              {r.profile?.avatar_url ? (
                <img src={r.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-mono">
                  {(r.profile?.display_name || r.profile?.username || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-mono font-bold truncate">{r.profile?.display_name || `@${r.profile?.username}`}</p>
                <p className="text-xs text-muted-foreground">{r.profile?.follower_count ?? 0} followers</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}