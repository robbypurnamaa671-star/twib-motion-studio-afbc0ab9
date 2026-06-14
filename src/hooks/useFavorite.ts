import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const cache = new Map<string, boolean>();

export function useFavorite(templateId: string | undefined) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState<boolean>(
    templateId ? cache.get(`${user?.id}|${templateId}`) ?? false : false,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!templateId || !user) return;
    const key = `${user.id}|${templateId}`;
    if (cache.has(key)) {
      setFavorited(cache.get(key)!);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("template_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("template_id", templateId)
        .maybeSingle();
      if (!active) return;
      const v = !!data;
      cache.set(key, v);
      setFavorited(v);
    })();
    return () => {
      active = false;
    };
  }, [user, templateId]);

  const toggle = useCallback(async () => {
    if (!templateId) return;
    if (!user) {
      toast({ title: "Sign in to favorite templates", variant: "destructive" });
      return;
    }
    setLoading(true);
    const key = `${user.id}|${templateId}`;
    const next = !favorited;
    setFavorited(next);
    cache.set(key, next);
    if (next) {
      const { error } = await supabase
        .from("template_favorites")
        .insert({ user_id: user.id, template_id: templateId });
      if (error && !`${error.message}`.includes("duplicate")) {
        setFavorited(false);
        cache.set(key, false);
        toast({ title: "Could not favorite", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase
        .from("template_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("template_id", templateId);
      if (error) {
        setFavorited(true);
        cache.set(key, true);
        toast({ title: "Could not unfavorite", description: error.message, variant: "destructive" });
      }
    }
    setLoading(false);
  }, [templateId, user, favorited]);

  return { favorited, toggle, loading };
}