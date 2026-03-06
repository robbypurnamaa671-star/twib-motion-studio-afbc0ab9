import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { parseGIF, decompressFrames } from "gifuct-js";
import { LayerMedia, TopLayerTransform } from "./media";
import { drawImageCover } from "./export";

type AnimatedExportOptions = {
  canvasW: number;
  canvasH: number;
  bottomLayer: LayerMedia | null;
  topLayer: LayerMedia | null;
  transform: TopLayerTransform;
  quality: "720p" | "1080p";
  format: "mp4" | "gif";
  onProgress?: (pct: number) => void;
  watermark?: boolean;
};

// ──── Decoded GIF frame type ────
type DecodedGifFrames = {
  frames: ImageData[];
  delays: number[]; // ms per frame
  width: number;
  height: number;
  totalDuration: number; // seconds
};

function getExportDimensions(
  canvasW: number,
  canvasH: number,
  quality: "720p" | "1080p"
): { w: number; h: number } {
  const maxDim = quality === "720p" ? 720 : 1080;
  const aspect = canvasW / canvasH;
  if (aspect >= 1) {
    const w = Math.min(canvasW, Math.round(maxDim * aspect));
    const h = Math.round(w / aspect);
    return { w: w - (w % 2), h: h - (h % 2) };
  }
  const h = Math.min(canvasH, maxDim);
  const w = Math.round(h * aspect);
  return { w: w - (w % 2), h: h - (h % 2) };
}

// ──── Decode a GIF file into individual ImageData frames ────
async function decodeGif(layer: LayerMedia): Promise<DecodedGifFrames> {
  const response = await fetch(layer.url);
  const buffer = await response.arrayBuffer();
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);

  // We need a scratch canvas to composite GIF frames (handle disposal)
  const gifW = gif.lsd.width;
  const gifH = gif.lsd.height;
  const scratch = document.createElement("canvas");
  scratch.width = gifW;
  scratch.height = gifH;
  const sctx = scratch.getContext("2d")!;

  const imageDataFrames: ImageData[] = [];
  const delays: number[] = [];

  for (const frame of frames) {
    // Build a full-size ImageData from the patch
    const patch = sctx.createImageData(frame.dims.width, frame.dims.height);
    patch.data.set(frame.patch);
    sctx.putImageData(patch, frame.dims.left, frame.dims.top);

    // Capture current composite as a full frame
    imageDataFrames.push(sctx.getImageData(0, 0, gifW, gifH));
    delays.push(frame.delay || 100);

    // Handle disposal
    if (frame.disposalType === 2) {
      // Restore to background
      sctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    }
    // disposalType 3 (restore to previous) is rare, skip for simplicity
  }

  const totalDuration = delays.reduce((a, b) => a + b, 0) / 1000;

  return { frames: imageDataFrames, delays, width: gifW, height: gifH, totalDuration };
}

// Convert ImageData to an ImageBitmap for drawImage
function imageDataToBitmap(imageData: ImageData): Promise<ImageBitmap> {
  return createImageBitmap(imageData);
}

function loadMediaElement(layer: LayerMedia): Promise<HTMLVideoElement | HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (layer.type === "video") {
      const vid = document.createElement("video");
      vid.muted = true;
      vid.playsInline = true;
      if (!layer.url.startsWith("blob:")) vid.crossOrigin = "anonymous";
      vid.preload = "auto";
      vid.onloadeddata = () => resolve(vid);
      vid.onerror = (e) => reject(new Error(`Failed to load video: ${e}`));
      vid.src = layer.url;
    } else {
      const img = new Image();
      if (!layer.url.startsWith("blob:")) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
      img.src = layer.url;
    }
  });
}

function getVideoDuration(layer: LayerMedia): Promise<number> {
  return new Promise((resolve, reject) => {
    if (layer.type !== "video") {
      resolve(0);
      return;
    }
    const vid = document.createElement("video");
    vid.muted = true;
    vid.preload = "metadata";
    if (!layer.url.startsWith("blob:")) vid.crossOrigin = "anonymous";
    vid.onloadedmetadata = () => resolve(vid.duration);
    vid.onerror = () => reject(new Error("Failed to get video duration"));
    vid.src = layer.url;
  });
}

// ──── Source abstraction to handle video, gif, and static images ────
type AnimatedSource = {
  type: "video";
  el: HTMLVideoElement;
  duration: number;
} | {
  type: "gif";
  decoded: DecodedGifFrames;
  bitmaps: ImageBitmap[];
} | {
  type: "static";
  el: HTMLImageElement;
};

async function prepareSource(layer: LayerMedia | null): Promise<AnimatedSource | null> {
  if (!layer) return null;

  if (layer.type === "video") {
    const el = await loadMediaElement(layer) as HTMLVideoElement;
    return {
      type: "video",
      el,
      duration: el.duration,
    };
  }

  if (layer.type === "gif") {
    const decoded = await decodeGif(layer);
    // Pre-create ImageBitmaps for fast drawing
    const bitmaps = await Promise.all(decoded.frames.map(imageDataToBitmap));
    return { type: "gif", decoded, bitmaps };
  }

  // Static image
  const el = await loadMediaElement(layer) as HTMLImageElement;
  return { type: "static", el };
}

function getSourceDuration(source: AnimatedSource | null): number {
  if (!source) return 0;
  if (source.type === "video") return source.duration;
  if (source.type === "gif") return source.decoded.totalDuration;
  return 0; // static
}

function getGifFrameAtTime(source: AnimatedSource & { type: "gif" }, timeMs: number): ImageBitmap {
  const { decoded, bitmaps } = source;
  const loopTime = timeMs % (decoded.totalDuration * 1000);
  let elapsed = 0;
  for (let i = 0; i < decoded.delays.length; i++) {
    elapsed += decoded.delays[i];
    if (loopTime < elapsed) return bitmaps[i];
  }
  return bitmaps[bitmaps.length - 1];
}

async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.01) {
      resolve();
      return;
    }
    const handler = () => {
      video.removeEventListener("seeked", handler);
      resolve();
    };
    video.addEventListener("seeked", handler);
    video.currentTime = time;
  });
}

function getSourceImageAtTime(source: AnimatedSource | null, timeSec: number): CanvasImageSource | null {
  if (!source) return null;
  if (source.type === "static") return source.el;
  if (source.type === "video") return source.el; // caller must seek first
  if (source.type === "gif") return getGifFrameAtTime(source, timeSec * 1000);
  return null;
}

async function seekSourceToTime(source: AnimatedSource | null, timeSec: number): Promise<void> {
  if (!source) return;
  if (source.type === "video") {
    await seekVideo(source.el, timeSec % (source.duration || 1));
  }
  // GIF and static don't need seeking — handled by getSourceImageAtTime
}

function drawWatermarkOnCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.04));
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText("TwibMotion", w - fontSize * 0.5, h - fontSize * 0.4);
  ctx.restore();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bottomImg: CanvasImageSource | null,
  topImg: CanvasImageSource | null,
  transform: TopLayerTransform,
  scale: number,
  watermark?: boolean
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  if (bottomImg) {
    ctx.save();
    ctx.translate(w / 2 + transform.x * scale, h / 2 + transform.y * scale);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    drawImageCover(ctx, bottomImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  if (topImg) {
    ctx.drawImage(topImg, 0, 0, w, h);
  }

  if (watermark) {
    drawWatermarkOnCanvas(ctx, w, h);
  }
}

// ──── MP4 Export ────

async function exportMP4(opts: AnimatedExportOptions): Promise<Blob> {
  const { canvasW, canvasH, bottomLayer, topLayer, transform, quality, onProgress, watermark } = opts;
  const dims = getExportDimensions(canvasW, canvasH, quality);
  const scale = dims.w / canvasW;
  const fps = 30;

  onProgress?.(5);

  const bottomSrc = await prepareSource(bottomLayer);
  const topSrc = await prepareSource(topLayer);

  // Determine duration
  let duration = Math.max(getSourceDuration(bottomSrc), getSourceDuration(topSrc));
  if (duration <= 0) duration = 5;
  duration = Math.min(duration, 30);

  const totalFrames = Math.ceil(duration * fps);

  const canvas = document.createElement("canvas");
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext("2d")!;

  // Check WebCodecs
  if (typeof VideoEncoder === "undefined") {
    return exportWebMFallback(canvas, ctx, dims, bottomSrc, topSrc, transform, scale, duration, fps, totalFrames, onProgress, watermark);
  }

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: dims.w, height: dims.h },
    fastStart: "in-memory",
  });

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("VideoEncoder error:", e),
  });

  encoder.configure({
    codec: "avc1.640028",
    width: dims.w,
    height: dims.h,
    bitrate: quality === "1080p" ? 5_000_000 : 2_500_000,
    framerate: fps,
  });

  onProgress?.(10);

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;

    await seekSourceToTime(bottomSrc, time);
    await seekSourceToTime(topSrc, time);

    const bottomImg = getSourceImageAtTime(bottomSrc, time);
    const topImg = getSourceImageAtTime(topSrc, time);

    drawFrame(ctx, dims.w, dims.h, bottomImg, topImg, transform, scale, watermark);

    const frame = new VideoFrame(canvas, {
      timestamp: (i * 1_000_000) / fps,
      duration: 1_000_000 / fps,
    });

    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();

    onProgress?.(10 + Math.round((i / totalFrames) * 80));
    if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  await encoder.flush();
  encoder.close();
  muxer.finalize();

  onProgress?.(100);
  return new Blob([muxer.target.buffer], { type: "video/mp4" });
}

// ──── WebM Fallback ────

async function exportWebMFallback(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  dims: { w: number; h: number },
  bottomSrc: AnimatedSource | null,
  topSrc: AnimatedSource | null,
  transform: TopLayerTransform,
  scale: number,
  duration: number,
  fps: number,
  totalFrames: number,
  onProgress?: (pct: number) => void,
  watermark?: boolean
): Promise<Blob> {
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();
  onProgress?.(10);

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;

    await seekSourceToTime(bottomSrc, time);
    await seekSourceToTime(topSrc, time);

    const bottomImg = getSourceImageAtTime(bottomSrc, time);
    const topImg = getSourceImageAtTime(topSrc, time);

    drawFrame(ctx, dims.w, dims.h, bottomImg, topImg, transform, scale, watermark);

    onProgress?.(10 + Math.round((i / totalFrames) * 80));
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  recorder.stop();

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      onProgress?.(100);
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
  });
}

// ──── GIF Export ────

async function exportGIF(opts: AnimatedExportOptions): Promise<Blob> {
  const { canvasW, canvasH, bottomLayer, topLayer, transform, onProgress, watermark } = opts;
  const dims = getExportDimensions(canvasW, canvasH, "720p");
  const scale = dims.w / canvasW;
  const fps = 10;

  onProgress?.(5);

  const bottomSrc = await prepareSource(bottomLayer);
  const topSrc = await prepareSource(topLayer);

  let duration = Math.max(getSourceDuration(bottomSrc), getSourceDuration(topSrc));
  if (duration <= 0) duration = 5;
  duration = Math.min(duration, 15);

  const totalFrames = Math.ceil(duration * fps);

  const canvas = document.createElement("canvas");
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext("2d")!;

  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);

  onProgress?.(10);

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;

    await seekSourceToTime(bottomSrc, time);
    await seekSourceToTime(topSrc, time);

    const bottomImg = getSourceImageAtTime(bottomSrc, time);
    const topImg = getSourceImageAtTime(topSrc, time);

    drawFrame(ctx, dims.w, dims.h, bottomImg, topImg, transform, scale, watermark);

    const imageData = ctx.getImageData(0, 0, dims.w, dims.h);
    const palette = quantize(imageData.data, 256);
    const index = applyPalette(imageData.data, palette);
    gif.writeFrame(index, dims.w, dims.h, { palette, delay });

    onProgress?.(10 + Math.round((i / totalFrames) * 85));
    if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  gif.finish();
  onProgress?.(100);

  return new Blob([gif.bytesView()], { type: "image/gif" });
}

// ──── Main dispatcher ────

export async function exportAnimated(opts: AnimatedExportOptions): Promise<Blob> {
  if (opts.format === "gif") return exportGIF(opts);
  return exportMP4(opts);
}
