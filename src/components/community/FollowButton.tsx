import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useFollow } from "@/hooks/useFollow";

export function FollowButton({ creatorId, size = "md" }: { creatorId: string; size?: "sm" | "md" }) {
  const { following, loading, toggle, isSelf } = useFollow(creatorId);
  if (isSelf) return null;
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm";
  const Icon = loading ? Loader2 : following ? UserCheck : UserPlus;
  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-md font-mono font-semibold transition-colors border ${pad} ${
        following
          ? "bg-secondary text-foreground border-border hover:bg-secondary/70"
          : "bg-primary text-primary-foreground border-primary hover:opacity-90"
      }`}
    >
      <Icon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {following ? "Following" : "Follow"}
    </button>
  );
}

export default FollowButton;