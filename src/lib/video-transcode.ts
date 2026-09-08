/**
 * Client-side video transcoding (ffmpeg.wasm).
 *
 * Used only when the browser cannot natively decode an uploaded video
 * (e.g. MOV with ProRes / HEVC / MJPEG). Produces a browser-safe H.264 MP4
 * "working copy". The original file is never modified.
 *
 * Everything runs in the browser — no server, no keys, no uploads.
 */

type FFmpegInstance = {
  load: (opts: { coreURL: string; wasmURL: string }) => Promise<boolean>;
  writeFile: (name: string, data: Uint8Array) => Promise<boolean>;
  readFile: (name: string) => Promise<unknown>;
  deleteFile: (name: string) => Promise<boolean>;
  exec: (args: string[]) => Promise<number>;
  on: (event: string, cb: (e: { progress: number }) => void) => void;
  off: (event: string, cb: (e: { progress: number }) => void) => void;
};

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

let ffmpegPromise: Promise<FFmpegInstance> | null = null;

async function getFFmpeg(): Promise<FFmpegInstance> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ff = new FFmpeg() as unknown as FFmpegInstance;
      await ff.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ff;
    })().catch((err) => {
      ffmpegPromise = null;
      throw err;
    });
  }
  return ffmpegPromise;
}

/** True when transcoding is even possible in this browser. */
export function canTranscode(): boolean {
  return typeof WebAssembly !== "undefined";
}

/**
 * Transcodes any decodable video file into an H.264/AAC MP4 usable by
 * <video>, canvas and the export pipeline.
 */
export async function transcodeToMp4(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<File> {
  const ff = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");

  const inputName = `in-${Date.now()}${/\.[a-z0-9]+$/i.exec(file.name)?.[0] || ".mov"}`;
  const outputName = `out-${Date.now()}.mp4`;

  const handler = (e: { progress: number }) => {
    if (onProgress && Number.isFinite(e.progress)) {
      onProgress(Math.max(0, Math.min(1, e.progress)));
    }
  };
  ff.on("progress", handler);

  try {
    await ff.writeFile(inputName, await fetchFile(file));
    const code = await ff.exec([
      "-i",
      inputName,
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "24",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outputName,
    ]);
    if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);

    const data = (await ff.readFile(outputName)) as Uint8Array;
    if (!data || data.length === 0) throw new Error("ffmpeg produced an empty file");

    const baseName = file.name.replace(/\.[a-z0-9]+$/i, "") || "video";
    return new File([data.slice().buffer as ArrayBuffer], `${baseName}.mp4`, {
      type: "video/mp4",
    });
  } finally {
    ff.off("progress", handler);
    await ff.deleteFile(inputName).catch(() => undefined);
    await ff.deleteFile(outputName).catch(() => undefined);
  }
}
