import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, Download } from "lucide-react";
import UploadBox from "@/components/UploadBox";
import CanvasPreview from "@/components/CanvasPreview";
import LayerControls from "@/components/LayerControls";
import ExportDialog from "@/components/ExportDialog";
import { LayerMedia, TopLayerTransform } from "@/lib/media";
import { hasAnimation } from "@/lib/export";

const Editor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const ratio = searchParams.get("ratio") || "1:1";
  const canvasW = parseInt(searchParams.get("w") || "1080");
  const canvasH = parseInt(searchParams.get("h") || "1080");

  // Bottom layer = User photo, Top layer = Twibbon overlay
  const [bottomLayer, setBottomLayer] = useState<LayerMedia | null>(null);
  const [topLayer, setTopLayer] = useState<LayerMedia | null>(null);
  const [transform, setTransform] = useState<TopLayerTransform>({
    x: 0, y: 0, scale: 1, rotation: 0,
  });
  const [exportOpen, setExportOpen] = useState(false);

  const animated = hasAnimation(bottomLayer, topLayer);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:h-screen lg:overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-mono font-bold text-sm text-foreground">TwibMotion</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground">
              {ratio}
            </span>
            <span className="text-xs text-muted-foreground">
              {canvasW}×{canvasH}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LayerControls
            transform={transform}
            onTransformChange={setTransform}
            hasTopLayer={!!topLayer}
          />
          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
          <button
            onClick={() => setExportOpen(true)}
            disabled={!bottomLayer && !topLayer}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Sidebar */}
        <aside className="lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-xs font-mono font-bold text-secondary-foreground">1</div>
              <span className="text-sm font-medium text-foreground">Bottom Layer</span>
              <span className="text-xs text-muted-foreground ml-auto">Your Photo</span>
            </div>
            <UploadBox label="Your Photo" sublabel="Your image — always behind the twibbon" media={bottomLayer} onMediaChange={setBottomLayer} icon="bottom" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary">2</div>
              <span className="text-sm font-medium text-foreground">Top Layer</span>
              <span className="text-xs text-muted-foreground ml-auto">Twibbon</span>
            </div>
            <UploadBox label="Twibbon Frame" sublabel="Overlay frame — always on top" media={topLayer} onMediaChange={setTopLayer} icon="top" />
          </div>

          <div className="mt-auto pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Export: </span>
              {animated ? "MP4 (animated content detected)" : "PNG / JPG (static)"}
            </p>
            <p className="text-muted-foreground/60">Scroll on canvas to zoom • Drag to reposition your photo</p>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 bg-secondary/30 p-4 min-h-0">
          <CanvasPreview
            canvasW={canvasW}
            canvasH={canvasH}
            bottomLayer={bottomLayer}
            topLayer={topLayer}
            transform={transform}
            onTransformChange={setTransform}
          />
        </main>
      </div>

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        canvasW={canvasW}
        canvasH={canvasH}
        bottomLayer={bottomLayer}
        topLayer={topLayer}
        transform={transform}
      />
    </div>
  );
};

export default Editor;
