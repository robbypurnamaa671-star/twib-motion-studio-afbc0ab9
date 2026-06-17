import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShareBar } from "@/components/share/ShareBar";
import { buildReferralLink } from "@/lib/referrals";
import { Copy, Check, Loader2, Eye, UserPlus, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Referrals() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [stats, setStats] = useState({ visits: 0, signups: 0, uses: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle();
      const u = (prof as { username: string | null } | null)?.username ?? null;
      setUsername(u);
      if (u) {
        const { data: rows } = await supabase
          .from("referrals")
          .select("event")
          .eq("ref_username", u.toLowerCase());
        const counts = { visits: 0, signups: 0, uses: 0 };
        (rows ?? []).forEach((r: { event: string }) => {
          if (r.event === "visit") counts.visits++;
          if (r.event === "signup") counts.signups++;
          if (r.event === "template_use") counts.uses++;
        });
        setStats(counts);
      }
      setLoading(false);
    })();
  }, [user]);

  const link = username ? buildReferralLink(username) : "";

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Referral link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout title="Referrals" description="Share TwibMotion and track who signs up through your link.">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : !username ? (
        <p className="text-sm text-muted-foreground">Set a username in Profile Settings to get your referral link.</p>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Your referral link</p>
            <div className="flex gap-2 mb-3">
              <input readOnly value={link} className="flex-1 px-3 py-2 rounded-md bg-background border border-border font-mono text-xs" />
              <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-mono">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <ShareBar url={link} title={`Make beautiful twibbons on TwibMotion`} compact />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Tile Icon={Eye} label="Visits" value={stats.visits} />
            <Tile Icon={UserPlus} label="Signups" value={stats.signups} />
            <Tile Icon={Zap} label="Template uses" value={stats.uses} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function Tile({ Icon, label, value }: { Icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="text-2xl font-mono font-bold">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}