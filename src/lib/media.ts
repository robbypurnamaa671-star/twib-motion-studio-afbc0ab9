export type LayerMedia = {
  /** Original asset as provided by the user (MOV stays MOV). */
  file: File;
  /** Object/remote URL of the original asset. */
  url: string;
  type: "image" | "gif" | "video";
  /** Browser-playable H.264 MP4 copy, present only when transcoding was needed. */
  workingFile?: File;
  workingUrl?: string;
  transcoded?: boolean;
};

/** URL that <video>/canvas/export must always use. */
export function playableUrl(media: LayerMedia): string {
  return media.workingUrl || media.url;
}

/** File that should be uploaded/persisted so templates never re-transcode. */
export function playableFile(media: LayerMedia): File {
  return media.workingFile || media.file;
}

export type CanvasRatio = {
  label: string;
  w: number;
  h: number;
};

export type TopLayerTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/mp4",
  // MOV is accepted as an input only — exports are always MP4/GIF.
  "video/quicktime",
  "video/x-quicktime",
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_VIDEO_DURATION = 30; // seconds

function isMovFile(file: File): boolean {
  return (
    file.type === "video/quicktime" ||
    file.type === "video/x-quicktime" ||
    /\.mov$/i.test(file.name)
  );
}

export function getMediaType(file: File): "image" | "gif" | "video" | null {
  if (file.type === "video/mp4" || isMovFile(file)) return "video";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/jpeg" || file.type === "image/png") return "image";
  return null;
}

export function getMediaTypeFromUrl(url: string, mimeType?: string): "image" | "gif" | "video" {
  const normalizedMime = mimeType?.toLowerCase() || "";
  if (normalizedMime.startsWith("video/") || /\.mov(?:[?#]|$)/i.test(url) || /\.mp4(?:[?#]|$)/i.test(url)) {
    return "video";
  }
  if (normalizedMime === "image/gif" || /\.gif(?:[?#]|$)/i.test(url)) return "gif";
  return "image";
}

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type) && !isMovFile(file)) {
    return "Unsupported file type. Use JPG, PNG, GIF, MP4, or MOV.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File exceeds 50MB limit.";
  }
  return null;
}

// ──── MOV / video diagnostics ────────────────────────────────────────────────
export type VideoProbe = {
  ok: boolean;
  width: number;
  height: number;
  duration: number;
  readyState: number;
  errorCode?: number;
  errorMessage?: string;
};

/** Rough browser capability check for a given file (container level only). */
export function canBrowserPlayFile(file: File): "probably" | "maybe" | "" {
  const v = document.createElement("video");
  const candidates: string[] = [];
  if (file.type) candidates.push(file.type);
  if (isMovFile(file)) {
    candidates.push('video/quicktime; codecs="avc1.42E01E"', "video/quicktime");
  }
  if (/\.mp4$/i.test(file.name)) candidates.push("video/mp4");
  let best: "probably" | "maybe" | "" = "";
  for (const c of candidates) {
    const r = v.canPlayType(c) as "probably" | "maybe" | "";
    if (r === "probably") return "probably";
    if (r === "maybe") best = "maybe";
  }
  return best;
}

/**
 * Loads a video URL and reports real decoding capability.
 * Resolves (never rejects) with diagnostics; times out after `timeoutMs`.
 */
export function probeVideo(url: string, timeoutMs = 8000): Promise<VideoProbe> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    (v as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
    let settled = false;
    const finish = (probe: VideoProbe) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      v.removeAttribute("src");
      v.load();
      resolve(probe);
    };
    const timer = setTimeout(
      () =>
        finish({
          ok: false,
          width: 0,
          height: 0,
          duration: 0,
          readyState: v.readyState,
          errorMessage: "timeout waiting for video metadata",
        }),
      timeoutMs,
    );
    v.onloadedmetadata = () =>
      finish({
        ok: v.videoWidth > 0 && v.videoHeight > 0,
        width: v.videoWidth,
        height: v.videoHeight,
        duration: Number.isFinite(v.duration) ? v.duration : 0,
        readyState: v.readyState,
        errorMessage:
          v.videoWidth > 0 ? undefined : "metadata loaded but no video track could be decoded",
      });
    v.onerror = () =>
      finish({
        ok: false,
        width: 0,
        height: 0,
        duration: 0,
        readyState: v.readyState,
        errorCode: v.error?.code,
        errorMessage: v.error?.message || "video element error",
      });
    v.src = url;
  });
}

export function logMediaDiagnostics(stage: string, file: File, extra?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.info(`[media:${stage}]`, {
    name: file.name,
    type: file.type || "(empty)",
    size: file.size,
    extension: file.name.split(".").pop()?.toLowerCase(),
    detected: getMediaType(file),
    canPlayType: canBrowserPlayFile(file),
    ...extra,
  });
}
