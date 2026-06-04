import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

function toSeries(bucket: Record<string, number>, days: number) {
  const out: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    out.push({ date: d.slice(5), value: bucket[d] ?? 0 });
  }
  return out;
}

function Chart({ title, data }: { title: string; data: any[] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent style={{ height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const api = useAdminApi();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getAnalytics(days).then(setData).finally(() => setLoading(false));
  }, [days]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-mono font-bold text-foreground">Analytics</h1>
          <Select value={String(days)} onValueChange={v => setDays(parseInt(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">All time (1y)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading || !data ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto my-20" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Chart title="User Growth" data={toSeries(data.userGrowth, days)} />
            <Chart title="Premium Growth" data={toSeries(data.premiumGrowth, days)} />
            <Chart title="Template Growth" data={toSeries(data.templateGrowth, days)} />
            <Chart title="Export Activity" data={toSeries(data.exportActivity, days)} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}