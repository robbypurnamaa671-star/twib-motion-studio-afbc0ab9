import { Link } from "react-router-dom";
import { Eye, Heart, Sparkles } from "lucide-react";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { FavoriteButton } from "@/components/community/FavoriteButton";
import type { CommunityTemplate } from "@/lib/community-queries";

export function TemplateGrid({ items, emptyText }: { items: CommunityTemplate[]; emptyText?: string }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
        <Sparkles className="w-5 h-5 mx-auto mb-2 text-primary" />
        {emptyText || "Belum ada template di sini."}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((t) => {
        const href = `/template/${t.slug || t.id}`;
        const img = t.preview_url || t.bottom_layer_url;
        const alt = `Template Twibbon ${t.title}${t.profiles?.username ? ` oleh @${t.profiles.username}` : ""}`;
        return (
          <div key={t.id} className="relative group">
            <Link
              to={href}
              className="group block aspect-square overflow-hidden rounded-lg border border-border bg-card relative"
              aria-label={alt}
            >
              {img ? (
                <ProgressiveImage src={img} alt={alt} className="transition-transform duration-500 group-hover:scale-105" />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2 z-10">
                <p className="text-xs font-mono text-foreground truncate">{t.title}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-0.5">
                  {t.profiles?.username ? (
                    <span className="truncate">@{t.profiles.username}</span>
                  ) : <span />}
                  <span className="inline-flex items-center gap-2 shrink-0">
                    {(t.like_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5"><Heart className="w-3 h-3" />{t.like_count}</span>
                    )}
                    {(t.view_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5"><Eye className="w-3 h-3" />{t.view_count}</span>
                    )}
                  </span>
                </div>
              </div>
            </Link>
            <FavoriteButton templateId={t.id} className="absolute top-2 right-2 z-20" />
          </div>
        );
      })}
    </div>
  );
}