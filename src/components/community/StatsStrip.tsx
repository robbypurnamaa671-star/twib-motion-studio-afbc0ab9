import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Users, Zap, Download } from "lucide-react";

type Stats = { total_templates: number; total_creators: number; total_uses: number; total_downloads: number };

let cache: { ts: number; data: Stats } | null = null;
const TTL = 5 * 60 * 1000;

export function StatsStrip() {
  const [stats, setStats] = useState<Stats | null>(cache?.data ?? null);

  useEffect(() => {
    if (cache && Date.now() - cache.ts < TTL) { setStats(cache.data); return; }
    (async () => {
      const { data } = await supabase.rpc("get_public_stats").maybeSingle();
      if (data) {
        const s = {
          total_templates: Number((data as { total_templates?: number }).total_templates ?? 0),
          total_creators: Number((data as { total_creators?: number }).total_creators ?? 0),
          total_uses: Number((data as { total_uses?: number }).total_uses ?? 0),
          total_downloads: Number((data as { total_downloads?: number }).total_downloads ?? 0),
        };
        cache = { ts: Date.now(), data: s };
        setStats(s);
      }
    })();
  }, []);

  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toLocaleString();

  const items = [
    { label: "Templates", value: stats?.total_templates ?? 0, Icon: Layers },
    { label: "Creators", value: stats?.total_creators ?? 0, Icon: Users },
    { label: "Uses", value: stats?.total_uses ?? 0, Icon: Zap },
    { label: "Downloads", value: stats?.total_downloads ?? 0, Icon: Download },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((i) => (
        <div key={i.label} className="rounded-lg border border-border bg-card p-4 text-center">
          <i.Icon className="w-4 h-4 text-primary mx-auto mb-2" />
          <div className="text-2xl font-mono font-bold text-foreground">{fmt(i.value)}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{i.label}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsStrip;