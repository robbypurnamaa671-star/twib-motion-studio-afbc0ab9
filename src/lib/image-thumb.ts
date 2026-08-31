const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
const ANIMATED_RE = /\.(gif|apng)(\?|#|$)/i;

/**
 * Returns a compressed version of a Supabase Storage image URL.
 * The full frame is preserved (no cropping / zooming): the image is
 * only scaled down to fit inside `width` and re-encoded at lower quality.
 * Videos and animated images are returned untouched.
 */
export function thumbUrl(
  url: string | null | undefined,
  width = 640,
  quality = 70,
): string | undefined {
  if (!url) return undefined;
  if (VIDEO_RE.test(url) || ANIMATED_RE.test(url)) return url;
  if (!url.includes("/storage/v1/object/public/")) return url;
  const base = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  return `${base}${base.includes("?") ? "&" : "?"}width=${width}&quality=${quality}&resize=contain`;
}
