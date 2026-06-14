import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Eye, MousePointerClick, Download, Heart, Loader2 } from "lucide-react";

interface Row {
  id: string;
  title: string;
  view_count: number;
  usage_count: number;
  download_count: number;
  like_count: number;
  created_at: string;
}

const config = {
  view_count: { label: "Views", color: "hsl(var(--primary))" },
  usage_count: { label: "Uses", color: "hsl(var(--accent-foreground))" },
  download_count: { label: "Downloads", color: "hsl(var(--muted-foreground))" },
  like_count: { label: "Likes", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

export default function Analytics() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("shared_templates")
        .select("id, title, view_count, usage_count, download_count, like_count, created_at")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .order("view_count", { ascending: false })
        .limit(50);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [user]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.view += r.view_count ?? 0;
          acc.use += r.usage_count ?? 0;
          acc.dl += r.download_count ?? 0;
          acc.like += r.like_count ?? 0;
          return acc;
        },
        { view: 0, use: 0, dl: 0, like: 0 },
      ),
    [rows],
  );

  const top = rows.slice(0, 10).map((r) => ({
    name: r.title.length > 16 ? r.title.slice(0, 16) + "…" : r.title,
    view_count: r.view_count ?? 0,
    usage_count: r.usage_count ?? 0,
    download_count: r.download_count ?? 0,
    like_count: r.like_count ?? 0,
  }));

  return (
    <DashboardLayout title="Analytics" description="Performance across your published templates.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Eye} label="Total views" value={totals.view} />
        <Stat icon={MousePointerClick} label="Uses" value={totals.use} />
        <Stat icon={Download} label="Downloads" value={totals.dl} />
        <Stat icon={Heart} label="Likes" value={totals.like} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No data yet — publish a template to start collecting stats.</p>
      ) : (
        <>
          <section className="rounded-lg border border-border bg-card p-4 mb-6">
            <h2 className="font-mono font-bold mb-3">Top templates by views</h2>
            <ChartContainer config={config} className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={top} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={60} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="view_count" fill="var(--color-view_count)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="usage_count" fill="var(--color-usage_count)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="like_count" fill="var(--color-like_count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </section>

          <section className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs font-mono uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Template</th>
                  <th className="text-right p-3">Views</th>
                  <th className="text-right p-3">Uses</th>
                  <th className="text-right p-3">Downloads</th>
                  <th className="text-right p-3">Likes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 truncate max-w-[280px]" title={r.title}>{r.title}</td>
                    <td className="p-3 text-right font-mono">{r.view_count ?? 0}</td>
                    <td className="p-3 text-right font-mono">{r.usage_count ?? 0}</td>
                    <td className="p-3 text-right font-mono">{r.download_count ?? 0}</td>
                    <td className="p-3 text-right font-mono">{r.like_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-widest">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-2xl font-bold mt-2">{value.toLocaleString()}</div>
    </div>
  );
}