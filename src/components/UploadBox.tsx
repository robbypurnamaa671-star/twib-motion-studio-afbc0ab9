import { useCallback, useRef, useState } from "react";
import { Upload, Image, Film, X } from "lucide-react";
import { LayerMedia, getMediaType, validateFile } from "@/lib/media";
import { useToast } from "@/hooks/use-toast";

interface UploadBoxProps {
  label: string;
  sublabel: string;
  media: LayerMedia | null;
  onMediaChange: (media: LayerMedia | null) => void;
  icon: "bottom" | "top";
}

const UploadBox = ({ label, sublabel, media, onMediaChange, icon }: UploadBoxProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast({ title: "Invalid file", description: error, variant: "destructive" });
        return;
      }
      const type = getMediaType(file);
      if (!type) return;

      if (type === "video") {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          if (video.duration > 30) {
            toast({ title: "Too long", description: "Max video duration is 30 seconds.", variant: "destructive" });
            return;
          }
          onMediaChange({ file, url: URL.createObjectURL(file), type });
        };
        video.src = URL.createObjectURL(file);
      } else {
        onMediaChange({ file, url: URL.createObjectURL(file), type });
      }
    },
    [onMediaChange, toast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const remove = () => {
    if (media) URL.revokeObjectURL(media.url);
    onMediaChange(null);
  };

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed transition-all duration-200 ${
        dragOver
          ? "border-primary bg-primary/5 glow-border"
          : media
          ? "border-border bg-card"
          : "border-border bg-card hover:border-muted-foreground/40"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {media ? (
        <div className="relative aspect-video flex items-center justify-center overflow-hidden rounded-md">
          {media.type === "video" ? (
            <video src={media.url} className="max-h-full max-w-full object-contain" muted loop autoPlay playsInline />
          ) : (
            <img src={media.url} alt={label} className="max-h-full max-w-full object-contain" />
          )}
          <button
            onClick={remove}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/80 text-xs font-mono text-foreground flex items-center gap-1">
            {media.type === "video" ? <Film className="w-3 h-3" /> : <Image className="w-3 h-3" />}
            {media.type.toUpperCase()}
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full p-6 flex flex-col items-center gap-3 cursor-pointer"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            icon === "bottom" ? "bg-secondary" : "bg-primary/10"
          }`}>
            <Upload className={`w-5 h-5 ${icon === "bottom" ? "text-secondary-foreground" : "text-primary"}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          </div>
          <p className="text-xs text-muted-foreground/60">JPG, PNG, GIF, MP4 (max 50MB)</p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.mp4"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

export default UploadBox;
