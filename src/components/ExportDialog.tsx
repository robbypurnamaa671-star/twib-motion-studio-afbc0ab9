import { useState } from "react";
import { Download, X, Check, Loader2, Lock, Crown } from "lucide-react";
import { LayerMedia, TopLayerTransform } from "@/lib/media";
import { exportStatic, downloadBlob, hasAnimation } from "@/lib/export";
import { exportAnimated } from "@/lib/export-animated";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeModal } from "@/components/UpgradeModal";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  canvasW: number;
  canvasH: number;
  bottomLayer: LayerMedia | null;
  topLayer: LayerMedia | null;
  transform: TopLayerTransform;
}

type StaticFormat = "png" | "jpg";
type AnimatedFormat = "mp4" | "gif";
type ExportFormat = StaticFormat | AnimatedFormat;

const WATERMARK_TEXT = "TwibMotion";

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.04));
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  // Add shadow for readability
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText(WATERMARK_TEXT, w - fontSize * 0.5, h - fontSize * 0.4);
  ctx.restore();
}

const ExportDialog = ({
  open,
  onClose,
  canvasW,
  canvasH,
  bottomLayer,
  topLayer,
  transform,
}: ExportDialogProps) => {
  const [quality, setQuality] = useState<"720p" | "1080p">("1080p");
  const [format, setFormat] = useState<ExportFormat>("png");
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canExport, deductCredits, status, creditPoints } = useSubscription();

  const animated = hasAnimation(bottomLayer, topLayer);
  const effectiveFormat = animated && (format === "png" || format === "jpg") ? "mp4" : format;

  const staticFormats: StaticFormat[] = ["png", "jpg"];
  const animatedFormats: AnimatedFormat[] = ["mp4", "gif"];
  const availableFormats: ExportFormat[] = animated ? animatedFormats : staticFormats;

  const exportCheck = canExport(effectiveFormat as any);

  const handleExport = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to export", variant: "destructive" });
      return;
    }

    if (!exportCheck.allowed) {
      setUpgradeOpen(true);
      return;
    }

    setExporting(true);
    setProgress(0);
    setDone(false);

    try {
      let blob: Blob;
      const fmt = animated ? (effectiveFormat as AnimatedFormat) : (effectiveFormat as StaticFormat);

      if (animated) {
        blob = await exportAnimated({
          canvasW, canvasH, bottomLayer, topLayer, transform, quality,
          format: fmt as AnimatedFormat,
          onProgress: setProgress,
        });
      } else {
        blob = await exportStatic({
          canvasW, canvasH, bottomLayer, topLayer, transform, quality,
          format: fmt as StaticFormat,
          onProgress: setProgress,
        });
      }

      // Apply watermark if needed
      if (exportCheck.watermark && !animated) {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            drawWatermark(ctx, c.width, c.height);
            c.toBlob((b) => {
              if (b) blob = b;
              URL.revokeObjectURL(url);
              resolve();
            }, fmt === "jpg" ? "image/jpeg" : "image/png", 0.92);
          };
          img.src = url;
        });
      }

      // Deduct credits for static exports (free users)
      if (!animated && status === "free" && !exportCheck.watermark) {
        await deductCredits(5);
      }

      const ext = fmt === "mp4" ? "mp4" : fmt === "gif" ? "gif" : fmt;
      downloadBlob(blob, `twibmotion-export.${ext}`);
      setDone(true);

      const wmText = exportCheck.watermark ? " (with watermark)" : "";
      toast({ title: "Export complete", description: `Downloaded as ${fmt.toUpperCase()}${wmText}` });
    } catch (err) {
      console.error("Export failed:", err);
      toast({ title: "Export failed", description: String(err), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const reset = () => {
    setProgress(0);
    setDone(false);
    setExporting(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => { onClose(); reset(); }}>
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-mono font-bold text-lg text-foreground">Export</h2>
            <button
              onClick={() => { onClose(); reset(); }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subscription info */}
          {user && status === "free" && (
            <div className="mb-4 p-3 rounded-lg bg-secondary border border-border text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credits remaining</span>
                <span className="font-mono font-bold text-foreground">{creditPoints}</span>
              </div>
              {creditPoints < 5 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No credits left. Exports will include a watermark.
                </p>
              )}
            </div>
          )}

          {/* Animated info */}
          {animated && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground">
              <p className="font-medium">Animated content detected</p>
              <p className="text-muted-foreground text-xs mt-1">
                Your composition contains video or GIF. Export as MP4 or GIF below.
                {" "}GIF is capped at 720p / 15 seconds.
              </p>
            </div>
          )}

          {/* Quality */}
          <div className="mb-4">
            <label className="text-xs font-mono text-muted-foreground mb-2 block">Quality</label>
            <div className="flex gap-2">
              {(["720p", "1080p"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  disabled={animated && effectiveFormat === "gif" && q === "1080p"}
                  className={`flex-1 py-2 rounded-lg font-mono text-sm border transition-colors ${
                    quality === q
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="mb-6">
            <label className="text-xs font-mono text-muted-foreground mb-2 block">Format</label>
            <div className="flex gap-2">
              {availableFormats.map((f) => {
                const check = canExport(f);
                const locked = !check.allowed;
                return (
                  <button
                    key={f}
                    onClick={() => locked ? setUpgradeOpen(true) : setFormat(f)}
                    className={`flex-1 py-2 rounded-lg font-mono text-sm border transition-colors uppercase relative ${
                      effectiveFormat === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : locked
                        ? "bg-secondary/50 text-muted-foreground border-border opacity-60"
                        : "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground"
                    }`}
                  >
                    {locked && <Lock className="w-3 h-3 inline mr-1" />}
                    {f}
                    {locked && (
                      <Crown className="w-3 h-3 absolute top-1 right-1 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          {(exporting || done) && (
            <div className="mb-4">
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1 text-center">
                {done ? "Done!" : `${progress}%`}
              </p>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting || (!bottomLayer && !topLayer)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : done ? (
              <Check className="w-4 h-4" />
            ) : !exportCheck.allowed ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting
              ? "Rendering…"
              : done
              ? "Export Again"
              : !exportCheck.allowed
              ? "Upgrade to Export"
              : exportCheck.watermark
              ? `Export ${effectiveFormat.toUpperCase()} (watermark)`
              : `Export ${effectiveFormat.toUpperCase()}`}
          </button>

          {/* Watermark notice */}
          {exportCheck.watermark && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Out of credits. <button onClick={() => setUpgradeOpen(true)} className="text-primary hover:underline">Upgrade to remove watermark</button>
            </p>
          )}
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
};

export default ExportDialog;
