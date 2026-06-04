import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Users, FileImage, Loader2, Crown, UserCheck, Image as ImageIcon, Film, Flag, Download } from "lucide-react";
import SEOHead from "@/components/SEOHead";

function Stat({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="w-4 h-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-mono font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const api = useAdminApi();
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getRecentActivity()])
      .then(([s, a]) => { setStats(s); setActivity(a); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <SEOHead title="Admin Dashboard – TwibMotion" noindex />
      <div className="space-y-6">
        <h1 className="text-2xl font-mono font-bold text-foreground">Dashboard Overview</h1>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div>
              <h2 className="text-sm font-mono uppercase text-muted-foreground mb-3">Users</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
                <Stat label="Active (30d)" value={stats?.activeUsers ?? 0} icon={UserCheck} />
                <Stat label="Premium" value={stats?.premiumUsers ?? 0} icon={Crown} />
                <Stat label="Free" value={stats?.freeUsers ?? 0} icon={Users} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-mono uppercase text-muted-foreground mb-3">Templates</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total" value={stats?.totalTemplates ?? 0} icon={FileImage} />
                <Stat label="Published" value={stats?.publishedTemplates ?? 0} icon={FileImage} />
                <Stat label="Pending" value={stats?.pendingTemplates ?? 0} icon={FileImage} />
                <Stat label="Deleted" value={stats?.deletedTemplates ?? 0} icon={FileImage} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-mono uppercase text-muted-foreground mb-3">Exports (30d)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total" value={stats?.totalExports ?? 0} icon={Download} />
                <Stat label="PNG/JPG" value={stats?.pngExports ?? 0} icon={ImageIcon} />
                <Stat label="GIF" value={stats?.gifExports ?? 0} icon={ImageIcon} />
                <Stat label="Video" value={stats?.videoExports ?? 0} icon={Film} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-mono uppercase text-muted-foreground mb-3">Moderation</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Pending Reports" value={stats?.pendingReports ?? 0} icon={Flag} />
                <Stat label="Hidden Templates" value={stats?.hiddenTemplates ?? 0} icon={FileImage} />
              </div>
            </div>

            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">Recent Admin Activity</CardTitle></CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {activity.slice(0, 15).map((a) => (
                      <li key={a.id} className="text-sm flex items-center justify-between border-b border-border last:border-0 py-2">
                        <div>
                          <span className="font-mono text-primary">{a.action}</span>
                          {a.target_type && <span className="text-muted-foreground"> · {a.target_type}</span>}
                          {a.admin_email && <span className="text-muted-foreground"> · {a.admin_email}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
