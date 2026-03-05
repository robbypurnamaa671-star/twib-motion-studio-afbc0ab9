import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = "free" | "premium";

interface SubscriptionState {
  status: SubscriptionStatus;
  creditPoints: number;
  subscriptionEnd: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  canExport: (format: "png" | "jpg" | "gif" | "mp4") => { allowed: boolean; watermark: boolean; reason?: string };
  deductCredits: (amount: number) => Promise<boolean>;
  startCheckout: () => Promise<void>;
  openPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>("free");
  const [creditPoints, setCreditPoints] = useState(20);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus("free");
      setCreditPoints(0);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setStatus(data.subscription_status || "free");
      setCreditPoints(data.credit_points ?? 20);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (e) {
      console.error("Failed to check subscription:", e);
      // Fallback: try reading from DB directly
      try {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (sub) {
          setStatus(sub.subscription_status as SubscriptionStatus);
          setCreditPoints(sub.credit_points);
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    // Auto-refresh every 60s
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const canExport = useCallback((format: "png" | "jpg" | "gif" | "mp4") => {
    if (!user) return { allowed: false, watermark: false, reason: "Sign in to export" };
    
    if (status === "premium") {
      return { allowed: true, watermark: false };
    }

    // Free user
    if (format === "gif" || format === "mp4") {
      return { allowed: false, watermark: false, reason: "Video & GIF export requires Premium" };
    }

    // JPG/PNG
    if (creditPoints >= 5) {
      return { allowed: true, watermark: false };
    }

    // No credits left - allow with watermark
    return { allowed: true, watermark: true };
  }, [user, status, creditPoints]);

  const deductCredits = useCallback(async (amount: number) => {
    if (status === "premium") return true;
    if (creditPoints < amount) return false;

    const newCredits = creditPoints - amount;
    setCreditPoints(newCredits);

    // Update in DB via service role (through edge function)
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      // Use a simple RPC-style update through check-subscription which syncs
      // For now, update directly (user can read/update own row)
      await supabase
        .from("user_subscriptions" as any)
        .update({ credit_points: newCredits } as any)
        .eq("user_id", user!.id);
    } catch (e) {
      console.error("Failed to deduct credits:", e);
    }
    return true;
  }, [status, creditPoints, user]);

  const startCheckout = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      console.error("Checkout error:", e);
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      console.error("Portal error:", e);
    }
  }, []);

  return (
    <SubscriptionContext.Provider value={{
      status, creditPoints, subscriptionEnd, loading,
      refresh, canExport, deductCredits, startCheckout, openPortal,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
