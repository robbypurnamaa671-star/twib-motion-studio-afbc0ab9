import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Notification = {
  id: string;
  type: "template_used" | "template_favorited" | "new_follower" | "template_trending";
  actor_id: string | null;
  template_id: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  actor?: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  template?: { slug: string | null; title: string } | null;
};

export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }
    const { data } = await supabase.rpc("get_unread_notification_count");
    setCount(Number(data ?? 0));
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const id = setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [user, refresh]);

  return { count, refresh };
}

export function useNotifications(limit = 20) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const fetchNow = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id,type,actor_id,template_id,data,read_at,created_at,template:template_id(slug,title)")
      .order("created_at", { ascending: false })
      .limit(limit);
    const rows = ((data as unknown as Notification[]) ?? []);
    const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[]));
    let actorsMap = new Map<string, NonNullable<Notification["actor"]>>();
    if (actorIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", actorIds);
      (profs ?? []).forEach((p: { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null }) =>
        actorsMap.set(p.user_id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url })
      );
    }
    if (mounted.current) {
      setItems(rows.map((r) => ({ ...r, actor: r.actor_id ? actorsMap.get(r.actor_id) ?? null : null })));
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    mounted.current = true;
    fetchNow();
    return () => { mounted.current = false; };
  }, [fetchNow]);

  const markAllRead = useCallback(async () => {
    await supabase.rpc("mark_notifications_read", { _ids: null });
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }, []);

  return { items, loading, refresh: fetchNow, markAllRead };
}