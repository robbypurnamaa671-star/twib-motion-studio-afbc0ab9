import { Heart } from "lucide-react";
import { useFavorite } from "@/hooks/useFavorite";

export function FavoriteButton({
  templateId,
  className = "",
  size = "sm",
}: {
  templateId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { favorited, toggle, loading } = useFavorite(templateId);
  const px = size === "md" ? "p-2" : "p-1.5";
  const ic = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!loading) toggle();
      }}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className={`${px} rounded-full bg-background/80 backdrop-blur border border-border hover:border-primary/60 transition-colors ${
        favorited ? "text-primary" : "text-foreground"
      } ${className}`}
    >
      <Heart className={`${ic} ${favorited ? "fill-current" : ""}`} />
    </button>
  );
}