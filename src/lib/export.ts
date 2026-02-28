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
  if (canvasW >= canvasH) {
    const w = Math.min(canvasW, maxDim * aspect > maxDim ? maxDim : Math.round(maxDim * aspect));
    return { w: Math.round(maxDim * aspect) > maxDim ? maxDim : Math.round(maxDim * aspect), h: maxDim };
  }
  return { w: maxDim, h: Math.round(maxDim / aspect) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getVideoFrame(src: string, time: number = 0): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const vid = document.createElement("video");
    vid.muted = true;
    vid.playsInline = true;
    vid.crossOrigin = "anonymous";
    vid.preload = "auto";
    vid.currentTime = time;
    vid.onloadeddata = () => {
      vid.currentTime = time;
    };
    vid.onseeked = () => resolve(vid);
    vid.onerror = reject;
    vid.src = src;
  });
}

export async function exportStatic(opts: ExportOptions): Promise<string> {
  const { canvasW, canvasH, bottomLayer, topLayer, transform, quality, format, onProgress } = opts;

  onProgress?.(10);

  const dims = getExportDimensions(canvasW, canvasH, quality);
  const scale = dims.w / canvasW;

  const canvas = document.createElement("canvas");
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext("2d")!;

  // Fill background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, dims.w, dims.h);

  onProgress?.(20);

  // Draw bottom layer
  if (bottomLayer) {
    let source: HTMLImageElement | HTMLVideoElement;
    if (bottomLayer.type === "video") {
      source = await getVideoFrame(bottomLayer.url);
    } else {
      source = await loadImage(bottomLayer.url);
    }
    ctx.drawImage(source, 0, 0, dims.w, dims.h);
  }

  onProgress?.(50);

  // Draw top layer with transform
  if (topLayer) {
    let source: HTMLImageElement | HTMLVideoElement;
    if (topLayer.type === "video") {
      source = await getVideoFrame(topLayer.url);
    } else {
      source = await loadImage(topLayer.url);
    }

    ctx.save();
    // Move to center + transform offset
    ctx.translate(dims.w / 2 + transform.x * scale, dims.h / 2 + transform.y * scale);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    // Draw centered
    ctx.drawImage(source, -dims.w / 2, -dims.h / 2, dims.w, dims.h);
    ctx.restore();
  }

  onProgress?.(80);

  const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mimeType, format === "jpg" ? 0.92 : undefined);

  onProgress?.(100);

  return dataUrl;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function hasAnimation(bottom: LayerMedia | null, top: LayerMedia | null): boolean {
  return (
    bottom?.type === "video" ||
    bottom?.type === "gif" ||
    top?.type === "video" ||
    top?.type === "gif"
  );
}
