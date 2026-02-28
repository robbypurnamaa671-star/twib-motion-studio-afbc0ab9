import { LayerMedia, TopLayerTransform } from "./media";

type ExportOptions = {
  canvasW: number;
  canvasH: number;
  bottomLayer: LayerMedia | null;
  topLayer: LayerMedia | null;
  transform: TopLayerTransform;
  quality: "720p" | "1080p";
  format: "png" | "jpg";
  onProgress?: (pct: number) => void;
};

function getExportDimensions(
  canvasW: number,
  canvasH: number,
  quality: "720p" | "1080p"
): { w: number; h: number } {
  const maxDim = quality === "720p" ? 720 : 1080;
  const aspect = canvasW / canvasH;
  if (aspect >= 1) {
    // Landscape or square
    const w = Math.min(canvasW, Math.round(maxDim * aspect));
    const h = Math.round(w / aspect);
    return { w, h };
  }
  // Portrait
  const h = Math.min(canvasH, maxDim);
  const w = Math.round(h * aspect);
  return { w, h };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Don't set crossOrigin for blob URLs
    if (!src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}

function getVideoFrame(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const vid = document.createElement("video");
    vid.muted = true;
    vid.playsInline = true;
    if (!src.startsWith("blob:")) {
      vid.crossOrigin = "anonymous";
    }
    vid.preload = "auto";
    vid.onloadeddata = () => {
      // Seek to first frame
      vid.currentTime = 0.01;
    };
    vid.onseeked = () => resolve(vid);
    vid.onerror = (e) => reject(new Error(`Failed to load video: ${e}`));
    vid.src = src;
  });
}

export async function exportStatic(opts: ExportOptions): Promise<Blob> {
  const { canvasW, canvasH, bottomLayer, topLayer, transform, quality, format, onProgress } = opts;

  onProgress?.(5);

  const dims = getExportDimensions(canvasW, canvasH, quality);
  const scale = dims.w / canvasW;

  const canvas = document.createElement("canvas");
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext("2d")!;

  // Transparent background for PNG, black for JPG
  if (format === "jpg") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, dims.w, dims.h);
  }

  onProgress?.(15);

  // Draw bottom layer (user photo) — with transform (draggable)
  if (bottomLayer) {
    try {
      let source: CanvasImageSource;
      if (bottomLayer.type === "video") {
        source = await getVideoFrame(bottomLayer.url);
      } else {
        source = await loadImage(bottomLayer.url);
      }

      ctx.save();
      ctx.translate(dims.w / 2 + transform.x * scale, dims.h / 2 + transform.y * scale);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(transform.scale, transform.scale);
      ctx.drawImage(source, -dims.w / 2, -dims.h / 2, dims.w, dims.h);
      ctx.restore();
    } catch (e) {
      console.error("Bottom layer draw failed:", e);
    }
  }

  onProgress?.(45);

  // Draw top layer (twibbon frame) — fixed, covers entire canvas
  if (topLayer) {
    try {
      let source: CanvasImageSource;
      if (topLayer.type === "video") {
        source = await getVideoFrame(topLayer.url);
      } else {
        source = await loadImage(topLayer.url);
      }
      ctx.drawImage(source, 0, 0, dims.w, dims.h);
    } catch (e) {
      console.error("Top layer draw failed:", e);
    }
  }

  onProgress?.(80);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob failed"));
      },
      mimeType,
      format === "jpg" ? 0.92 : undefined
    );
  });

  onProgress?.(100);
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function hasAnimation(bottom: LayerMedia | null, top: LayerMedia | null): boolean {
  return (
    bottom?.type === "video" ||
    bottom?.type === "gif" ||
    top?.type === "video" ||
    top?.type === "gif"
  );
}
