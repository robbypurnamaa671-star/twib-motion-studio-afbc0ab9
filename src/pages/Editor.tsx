import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, Download, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEOHead";
import UploadBox from "@/components/UploadBox";
import BackgroundRemoverButton from "@/components/BackgroundRemoverButton";
import CanvasPreview from "@/components/CanvasPreview";
import LayerControls from "@/components/LayerControls";
import ExportDialog from "@/components/ExportDialog";
import ShareTemplateDialog from "@/components/ShareTemplateDialog";
import UserMenu from "@/components/UserMenu";
import { CreditsBadge } from "@/components/CreditsBadge";
import { LayerMedia, TopLayerTransform } from "@/lib/media";
import { hasAnimation } from "@/lib/export";

const Editor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const [shareOpen, setShareOpen] = useState(false);

  const animated = hasAnimation(bottomLayer, topLayer);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:h-screen lg:overflow-hidden">
      <SEOHead title={t("editor.metaTitle")} noindex />
      {/* Top bar */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label={t("editor.back")}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TwibMotion logo" width={24} height={24} className="w-6 h-6 rounded" />
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
          <CreditsBadge />
          <UserMenu />
          <LayerControls
            transform={transform}
            onTransformChange={setTransform}
            hasTopLayer={!!topLayer}
          />
          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
          <button
            onClick={() => setShareOpen(true)}
            disabled={!topLayer}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-foreground font-mono text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("editor.share")}</span>
          </button>
          <button
            onClick={() => setExportOpen(true)}
            disabled={!bottomLayer && !topLayer}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("editor.export")}</span>
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
              <span className="text-sm font-medium text-foreground">{t("editor.bottomLayer")}</span>
              <span className="text-xs text-muted-foreground ml-auto">{t("editor.yourPhoto")}</span>
            </div>
            <UploadBox label={t("editor.yourPhoto")} sublabel={t("editor.yourPhotoSub")} media={bottomLayer} onMediaChange={setBottomLayer} icon="bottom" />
            <div className="mt-2">
              <BackgroundRemoverButton media={bottomLayer} onMediaChange={setBottomLayer} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary">2</div>
              <span className="text-sm font-medium text-foreground">{t("editor.topLayer")}</span>
              <span className="text-xs text-muted-foreground ml-auto">{t("editor.twibbon")}</span>
            </div>
            <UploadBox label={t("editor.twibbonFrame")} sublabel={t("editor.twibbonFrameSub")} media={topLayer} onMediaChange={setTopLayer} icon="top" />
            <div className="mt-2">
              <BackgroundRemoverButton media={topLayer} onMediaChange={setTopLayer} />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{t("editor.exportLabel")} </span>
              {animated ? t("editor.exportInfoMp4") : t("editor.exportInfoStatic")}
            </p>
            <p className="text-muted-foreground/60">{t("editor.canvasHint")}</p>
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

      {/* Share template dialog */}
      <ShareTemplateDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        canvasRatio={ratio}
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
