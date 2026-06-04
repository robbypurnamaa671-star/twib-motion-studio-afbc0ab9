import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SuperAdminGuard } from "@/components/admin/SuperAdminGuard";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const api = useAdminApi();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getSettings().then(setSettings).finally(() => setLoading(false)); }, []);

  const set = (key: string, value: any) => setSettings((s: any) => ({ ...s, [key]: value }));

  const save = async () => {
    setSaving(true);
    try { await api.updateSettings(settings); toast.success("Settings saved"); }
    catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <SuperAdminGuard>
      <AdminLayout>
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-2xl font-mono font-bold text-foreground">Site Settings</h1>
          {loading || !settings ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div>
                  <label className="font-medium">Premium monthly price (USD)</label>
                  <Input type="number" step="0.01" value={Number(settings.premium_monthly_price ?? 2)} onChange={e => set("premium_monthly_price", parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="font-medium">Free credits per day</label>
                  <Input type="number" value={Number(settings.free_credits_per_day ?? 20)} onChange={e => set("free_credits_per_day", parseInt(e.target.value))} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="font-medium">Watermark enabled (free users)</label>
                  <Switch checked={!!settings.watermark_enabled} onCheckedChange={v => set("watermark_enabled", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="font-medium">Community templates enabled</label>
                  <Switch checked={!!settings.community_templates_enabled} onCheckedChange={v => set("community_templates_enabled", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="font-medium">New user registration enabled</label>
                  <Switch checked={!!settings.registration_enabled} onCheckedChange={v => set("registration_enabled", v)} />
                </div>
                <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : "Save settings"}</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </SuperAdminGuard>
  );
}