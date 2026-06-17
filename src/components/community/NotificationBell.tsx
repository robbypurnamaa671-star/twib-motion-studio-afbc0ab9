import { Bell, Heart, UserPlus, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useNotifications, useUnreadCount, type Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function describe(n: Notification): { text: string; to: string; Icon: typeof Bell } {
  const actor = n.actor?.display_name || (n.actor?.username ? `@${n.actor.username}` : "Someone");
  const tpl = n.template?.title ?? "your template";
  const tplLink = n.template?.slug ? `/template/${n.template.slug}` : "/dashboard/templates";
  switch (n.type) {
    case "template_favorited": return { text: `${actor} favorited “${tpl}”`, to: tplLink, Icon: Heart };
    case "template_used": return { text: `${actor} used “${tpl}”`, to: tplLink, Icon: Zap };
    case "new_follower": return { text: `${actor} followed you`, to: n.actor?.username ? `/creator/${n.actor.username}` : "/dashboard", Icon: UserPlus };
    case "template_trending": return { text: `“${tpl}” is trending 🔥`, to: tplLink, Icon: TrendingUp };
    default: return { text: "New activity", to: "/dashboard/notifications", Icon: Bell };
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const { count, refresh } = useUnreadCount();
  const [open, setOpen] = useState(false);
  const { items, markAllRead } = useNotifications(8);

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) refresh(); }}>
      <DropdownMenuTrigger className="relative p-2 rounded-md hover:bg-secondary outline-none" aria-label="Notifications">
        <Bell className="w-4 h-4 text-foreground" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="font-mono">Notifications</DropdownMenuLabel>
          {count > 0 && (
            <button onClick={() => { markAllRead(); refresh(); }} className="text-[11px] font-mono text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs font-mono text-muted-foreground">No notifications yet</div>
        ) : (
          items.map((n) => {
            const d = describe(n);
            return (
              <DropdownMenuItem asChild key={n.id} className={`${!n.read_at ? "bg-primary/5" : ""}`}>
                <Link to={d.to} className="cursor-pointer flex items-start gap-2 py-2">
                  <d.Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-foreground truncate">{d.text}</p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/notifications" className="cursor-pointer text-xs font-mono text-center justify-center">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;