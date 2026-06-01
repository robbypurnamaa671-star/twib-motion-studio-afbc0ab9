import { useRef, useState } from "react";
import { Scissors, Loader2, Undo2, Crown } from "lucide-react";
import { LayerMedia } from "@/lib/media";
import { removeBackgroundFromFile } from "@/lib/background-removal";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useToast } from "@/hooks/use-toast";

interface Props {
  media: LayerMedia | null;
  onMediaChange: (m: LayerMedia | null) => void;
}

const BackgroundRemoverButton = ({ media, onMediaChange }: Props) => {
  const { status } = useSubscription();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const previousRef = useRef<LayerMedia | null>(null);

  const isPremium = status === "premium";
  // Only image (jpg/png) layers are supported — not GIFs or videos.
  const supported = media?.type === "image";

  const handleClick = async () => {
    if (!media || !supported || processing) return;
    if (!isPremium) {
      setUpgradeOpen(true);
      return;
    }

    setProcessing(true);
    setProgress(0);
    try {
      const newFile = await removeBackgroundFromFile(media.file, (p) =>
        setProgress(p),
      );
      previousRef.current = media;
      const url = URL.createObjectURL(newFile);
      onMediaChange({ file: newFile, url, type: "image" });
      toast({ title: "Background removed", description: "Transparent PNG ready." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Background removal failed:", err);
      toast({
        title: "Background removal failed",
        description: msg.includes("memory")
          ? "Not enough memory. Try a smaller image."
          : "Your browser may not support this. Try Chrome on desktop.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleUndo = () => {
    if (!previousRef.current) return;
    onMediaChange(previousRef.current);
    previousRef.current = null;
  };

  if (!media) return null;

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={!supported || processing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-primary/40 bg-primary/5 text-primary font-mono text-xs font-medium hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Remove background"
        >
          {processing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Removing background… {progress}%
            </>
          ) : (
            <>
              {!isPremium ? <Crown className="w-3.5 h-3.5" /> : <Scissors className="w-3.5 h-3.5" />}
              Remove background
              {!isPremium && <span className="ml-1 opacity-70">(Premium)</span>}
            </>
          )}
        </button>

        {!supported && (
          <p className="text-[10px] text-muted-foreground text-center">
            Only photos (JPG/PNG) — not GIFs or videos.
          </p>
        )}

        {processing && (
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {previousRef.current && !processing && (
          <button
            type="button"
            onClick={handleUndo}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Undo2 className="w-3 h-3" /> Restore original
          </button>
        )}
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
};

export default BackgroundRemoverButton;