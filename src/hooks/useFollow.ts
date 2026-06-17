import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useFollow(creatorId: string | null | undefined) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !creatorId || user.id === creatorId) {
      setFollowing(false);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("creator_follows")
        .select("creator_id")
        .eq("follower_id", user.id)
        .eq("creator_id", creatorId)
        .maybeSingle();
      if (alive) setFollowing(!!data);
    })();
    return () => { alive = false; };
  }, [user, creatorId]);

  const toggle = useCallback(async () => {
    if (!user) { toast({ title: "Sign in to follow creators" }); return; }
    if (!creatorId || user.id === creatorId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("toggle_follow", { _creator_id: creatorId });
    setLoading(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setFollowing(!!data);
  }, [user, creatorId]);

  return { following, loading, toggle, isSelf: user?.id === creatorId };
}