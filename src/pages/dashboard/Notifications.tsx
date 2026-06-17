import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { Bell, Heart, UserPlus, Zap, TrendingUp, Loader2 } from "lucide-react";

function describe(n: Notification) {
  const actor = n.actor?.display_name || (n.actor?.username ? `@${n.actor.username}` : "Someone");
  const tpl = n.template?.title ?? "your template";
  const tplLink = n.template?.slug ? `/template/${n.template.slug}` : "#";
  switch (n.type) {
    case "template_favorited": return { text: `${actor} favorited "${tpl}"`, to: tplLink, Icon: Heart };
    case "template_used": return { text: `${actor} used "${tpl}"`, to: tplLink, Icon: Zap };
    case "new_follower": return { text: `${actor} started following you`, to: n.actor?.username ? `/creator/${n.actor.username}` : "#", Icon: UserPlus };
    case "template_trending": return { text: `"${tpl}" is trending`, to: tplLink, Icon: TrendingUp };
    default: return { text: "Activity", to: "#", Icon: Bell };
  }
}

export default function NotificationsPage() {
  const { items, loading, markAllRead } = useNotifications(50);

  return (
    <DashboardLayout title="Notifications" description="All your TwibMotion activity.">
      <div className="flex justify-end mb-3">
        <button onClick={markAllRead} className="text-xs font-mono text-primary hover:underline">Mark all read</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-20">No notifications yet.</p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg bg-card">
          {items.map((n) => {
            const d = describe(n);
            return (
              <li key={n.id} className={`p-4 flex items-start gap-3 ${!n.read_at ? "bg-primary/5" : ""}`}>
                <d.Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link to={d.to} className="text-sm font-mono text-foreground hover:text-primary">{d.text}</Link>
                  <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardLayout>
  );
}