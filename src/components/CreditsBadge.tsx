import { Crown, Coins } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";

export function CreditsBadge() {
  const { user } = useAuth();
  const { status, creditPoints, loading } = useSubscription();

  if (!user || loading) return null;

  if (status === "premium") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono">
        <Crown className="w-3.5 h-3.5 text-primary" />
        <span className="text-primary font-medium">Premium</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-border text-xs font-mono">
      <Coins className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-foreground font-medium">{creditPoints}</span>
      <span className="text-muted-foreground">credits</span>
    </div>
  );
}
