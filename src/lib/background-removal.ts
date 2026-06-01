import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";

/**
 * Browser-based background removal using @imgly/background-removal
 * (ONNX Runtime Web under the hood). Fully client-side, no API calls.
 * Model is lazy-loaded and cached by the library in IndexedDB / cache storage.
 */
export async function removeBackgroundFromFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<File> {
  const blob = await imglyRemoveBackground(file, {
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => {
      if (!total) return;
      const pct = Math.min(99, Math.round((current / total) * 100));
      onProgress?.(pct);
    },
  });

  onProgress?.(100);

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}-nobg.png`, { type: "image/png" });
}