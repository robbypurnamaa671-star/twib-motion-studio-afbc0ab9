import { Crown, Lock, X } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { startCheckout } = useSubscription();

  if (!open) return null;

  const handleUpgrade = async () => {
    await startCheckout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-7 h-7 text-primary" />
        </div>

        <h2 className="font-mono font-bold text-xl text-foreground mb-2">
          Upgrade to Premium
        </h2>

        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Video & GIF export is available for Premium users.
          Upgrade for unlimited exports and no watermark.
        </p>

        <div className="space-y-2 text-sm text-left mb-6">
          {["Unlimited JPG/PNG exports", "Unlimited GIF exports", "Unlimited Video exports", "No watermark on any export", "Unlimited credit points"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-foreground">
              <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-mono font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Upgrade Now — $2/month
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
