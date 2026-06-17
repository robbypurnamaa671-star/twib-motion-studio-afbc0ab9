import { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredReferral } from "@/lib/referrals";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const Schema = z.object({ email: z.string().trim().email() });

export function NewsletterSignup({
  source = "footer",
  heading = "Get New Templates Weekly",
  description = "Campaign frame ideas, trending twibbons, and creator tips — straight to your inbox.",
}: { source?: string; heading?: string; description?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse({ email });
    if (!parsed.success) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    setState("loading");
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data.email, source, ref_username: getStoredReferral() });
    if (error && !/duplicate/i.test(error.message)) {
      setState("idle");
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setState("done");
    toast({ title: "You're in!", description: "We'll send the next drop your way." });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-primary" />
        <h3 className="font-mono font-bold text-foreground">{heading}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-3 py-2 rounded-md bg-background border border-border font-mono text-sm focus:outline-none focus:border-primary"
          disabled={state !== "idle"}
        />
        <button
          type="submit"
          disabled={state !== "idle"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono font-semibold text-sm hover:opacity-90 disabled:opacity-60"
        >
          {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : state === "done" ? <Check className="w-4 h-4" /> : null}
          {state === "done" ? "Subscribed" : "Subscribe"}
        </button>
      </form>
    </section>
  );
}

export default NewsletterSignup;