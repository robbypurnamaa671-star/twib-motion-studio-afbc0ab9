export type LayerMedia = {
  file: File;
  url: string;
  type: "image" | "gif" | "video";
};

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

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type) && !isMovFile(file)) {
    return "Unsupported file type. Use JPG, PNG, GIF, MP4, or MOV.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File exceeds 50MB limit.";
  }
  return null;
}
