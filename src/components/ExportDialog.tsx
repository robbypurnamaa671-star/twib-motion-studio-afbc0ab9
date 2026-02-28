import { useState } from "react";
import { Download, X, Check, Loader2 } from "lucide-react";
import { LayerMedia, TopLayerTransform } from "@/lib/media";
import { exportStatic, downloadBlob, hasAnimation } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  canvasW: number;
  canvasH: number;
  bottomLayer: LayerMedia | null;
  topLayer: LayerMedia | null;
  transform: TopLayerTransform;
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
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const animated = hasAnimation(bottomLayer, topLayer);

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);
    setDone(false);

    try {
      const blob = await exportStatic({
        canvasW,
        canvasH,
        bottomLayer,
        topLayer,
        transform,
        quality,
        format,
        onProgress: setProgress,
      });

      downloadBlob(blob, `twibmotion-export.${format}`);
      setDone(true);
      toast({ title: "Export complete", description: `Downloaded as ${format.toUpperCase()}` });
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

        {/* Animated notice */}
        {animated && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground">
            <p className="font-medium">Animated content detected</p>
            <p className="text-muted-foreground text-xs mt-1">
              Video/GIF export requires a backend service. Exporting a static snapshot of the current frame.
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
                className={`flex-1 py-2 rounded-lg font-mono text-sm border transition-colors ${
                  quality === q
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground"
                }`}
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
            {(["png", "jpg"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 py-2 rounded-lg font-mono text-sm border transition-colors uppercase ${
                  format === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
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
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exporting ? "Rendering…" : done ? "Export Again" : "Export"}
        </button>
      </div>
    </div>
  );
};

export default ExportDialog;
