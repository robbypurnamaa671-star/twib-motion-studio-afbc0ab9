import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { LayerMedia, TopLayerTransform } from "./media";

type AnimatedExportOptions = {
  canvasW: number;
  canvasH: number;
  bottomLayer: LayerMedia | null;
  topLayer: LayerMedia | null;
  transform: TopLayerTransform;
  quality: "720p" | "1080p";
  format: "mp4" | "gif";
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
    const w = Math.min(canvasW, Math.round(maxDim * aspect));
    const h = Math.round(w / aspect);
    // Ensure even dimensions for video encoding
    return { w: w - (w % 2), h: h - (h % 2) };
  }
  const h = Math.min(canvasH, maxDim);
  const w = Math.round(h * aspect);
  return { w: w - (w % 2), h: h - (h % 2) };
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

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bottomSource: CanvasImageSource | null,
  topSource: CanvasImageSource | null,
  transform: TopLayerTransform,
  scale: number
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  if (bottomSource) {
    ctx.save();
    ctx.translate(w / 2 + transform.x * scale, h / 2 + transform.y * scale);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(bottomSource, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  if (topSource) {
    ctx.drawImage(topSource, 0, 0, w, h);
  }
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

// ──── MP4 Export using WebCodecs ────

async function exportMP4(opts: AnimatedExportOptions): Promise<Blob> {
  const { canvasW, canvasH, bottomLayer, topLayer, transform, quality, onProgress } = opts;
  const dims = getExportDimensions(canvasW, canvasH, quality);
  const scale = dims.w / canvasW;
  const fps = 30;

  // Determine duration from animated layer(s)
  let duration = 5; // default for GIF-only
  if (bottomLayer?.type === "video") {
    duration = Math.min(await getVideoDuration(bottomLayer), 30);
  }
  if (topLayer?.type === "video") {
    const topDur = Math.min(await getVideoDuration(topLayer), 30);
    duration = Math.max(duration, topDur);
  }

  const totalFrames = Math.ceil(duration * fps);

  onProgress?.(5);

  // Load media elements
  const bottomEl = bottomLayer ? await loadMediaElement(bottomLayer) : null;
  const topEl = topLayer ? await loadMediaElement(topLayer) : null;

  // Create offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext("2d")!;

  // Check if WebCodecs is available
  if (typeof VideoEncoder === "undefined") {
    // Fallback: use MediaRecorder with WebM
    return exportWebMFallback(canvas, ctx, dims, bottomEl, topEl, transform, scale, duration, fps, totalFrames, onProgress);
  }

  // Setup mp4-muxer
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: dims.w,
      height: dims.h,
    },
    fastStart: "in-memory",
  });

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
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

    // Seek video elements
    if (bottomEl instanceof HTMLVideoElement) {
      await seekVideo(bottomEl, time % (bottomEl.duration || 1));
    }
    if (topEl instanceof HTMLVideoElement) {
      await seekVideo(topEl, time % (topEl.duration || 1));
    }

    drawFrame(ctx, dims.w, dims.h, bottomEl, topEl, transform, scale);

    const frame = new VideoFrame(canvas, {
      timestamp: (i * 1_000_000) / fps,
      duration: 1_000_000 / fps,
    });

    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();

    const pct = 10 + Math.round((i / totalFrames) * 80);
    onProgress?.(pct);

    // Yield to keep UI responsive
    if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  await encoder.flush();
  encoder.close();
  muxer.finalize();

  const { buffer } = muxer.target;
  onProgress?.(100);

  return new Blob([buffer], { type: "video/mp4" });
}

// ──── WebM Fallback using MediaRecorder ────

async function exportWebMFallback(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  dims: { w: number; h: number },
  bottomEl: HTMLVideoElement | HTMLImageElement | null,
  topEl: HTMLVideoElement | HTMLImageElement | null,
  transform: TopLayerTransform,
  scale: number,
  duration: number,
  fps: number,
  totalFrames: number,
  onProgress?: (pct: number) => void
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

    if (bottomEl instanceof HTMLVideoElement) {
      await seekVideo(bottomEl, time % (bottomEl.duration || 1));
    }
    if (topEl instanceof HTMLVideoElement) {
      await seekVideo(topEl, time % (topEl.duration || 1));
    }

    drawFrame(ctx, dims.w, dims.h, bottomEl, topEl, transform, scale);

    const pct = 10 + Math.round((i / totalFrames) * 80);
    onProgress?.(pct);

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
  const { canvasW, canvasH, bottomLayer, topLayer, transform, quality, onProgress } = opts;

  // GIF: cap at 720p and 15 seconds, lower framerate
  const dims = getExportDimensions(canvasW, canvasH, "720p");
  const scale = dims.w / canvasW;
  const fps = 10; // GIF framerate

  let duration = 5;
  if (bottomLayer?.type === "video") {
    duration = Math.min(await getVideoDuration(bottomLayer), 15);
  }
  if (topLayer?.type === "video") {
    const topDur = Math.min(await getVideoDuration(topLayer), 15);
    duration = Math.max(duration, topDur);
  }

  const totalFrames = Math.ceil(duration * fps);

  onProgress?.(5);

  const bottomEl = bottomLayer ? await loadMediaElement(bottomLayer) : null;
  const topEl = topLayer ? await loadMediaElement(topLayer) : null;

  const canvas = document.createElement("canvas");
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext("2d")!;

  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);

  onProgress?.(10);

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;

    if (bottomEl instanceof HTMLVideoElement) {
      await seekVideo(bottomEl, time % (bottomEl.duration || 1));
    }
    if (topEl instanceof HTMLVideoElement) {
      await seekVideo(topEl, time % (topEl.duration || 1));
    }

    drawFrame(ctx, dims.w, dims.h, bottomEl, topEl, transform, scale);

    const imageData = ctx.getImageData(0, 0, dims.w, dims.h);
    const palette = quantize(imageData.data, 256);
    const index = applyPalette(imageData.data, palette);
    gif.writeFrame(index, dims.w, dims.h, { palette, delay });

    const pct = 10 + Math.round((i / totalFrames) * 85);
    onProgress?.(pct);

    if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  gif.finish();
  onProgress?.(100);

  return new Blob([gif.bytesView()], { type: "image/gif" });
}

// ──── Main export dispatcher ────

export async function exportAnimated(opts: AnimatedExportOptions): Promise<Blob> {
  if (opts.format === "gif") {
    return exportGIF(opts);
  }
  return exportMP4(opts);
}
