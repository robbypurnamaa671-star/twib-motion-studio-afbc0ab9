import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

function safeDateToISO(timestamp: number | undefined | null): string | null {
  if (timestamp == null) return null;
  try {
    const d = new Date(timestamp * 1000);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check Stripe subscription
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let subscribed = false;
    let subscriptionEnd: string | null = null;

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      logStep("Subscriptions found", { count: subs.data.length });
      if (subs.data.length > 0) {
        subscribed = true;
        subscriptionEnd = safeDateToISO(subs.data[0].current_period_end);
        logStep("Active subscription", { end: subscriptionEnd });
      }
    } else {
      logStep("No Stripe customer found");
    }

    // Sync to database
    const newStatus = subscribed ? "premium" : "free";
    logStep("Syncing status", { newStatus });

    const { data: existing } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from("user_subscriptions").insert({
        user_id: user.id,
        subscription_status: newStatus,
        credit_points: newStatus === "premium" ? 9999 : 20,
      });
    } else {
      const now = new Date();
      let isNewDay = true;
      try {
        if (existing.last_credit_reset) {
          const lastReset = new Date(existing.last_credit_reset);
          if (!isNaN(lastReset.getTime())) {
            isNewDay = lastReset.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);
          }
        }
      } catch { /* default isNewDay = true */ }

      const updates: any = { subscription_status: newStatus };

      if (newStatus === "premium") {
        updates.credit_points = 9999;
      } else if (isNewDay) {
        updates.credit_points = 20;
        updates.last_credit_reset = now.toISOString();
      }

      await supabaseAdmin
        .from("user_subscriptions")
        .update(updates)
        .eq("user_id", user.id);
    }

    // Get fresh data
    const { data: sub } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    logStep("Returning", { subscribed, status: sub?.subscription_status, credits: sub?.credit_points });

    return new Response(JSON.stringify({
      subscribed,
      subscription_status: sub?.subscription_status || "free",
      credit_points: sub?.credit_points ?? 20,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
