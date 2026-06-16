import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { FeaturedCreator } from "@/lib/community-queries";

export function CreatorCard({ c }: { c: FeaturedCreator }) {
  return (
    <Link
      to={`/creator/${c.username}`}
      className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/60 transition-colors"
    >
      {c.avatar_url ? (
        <img src={c.avatar_url} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-base font-mono">
          {(c.display_name || c.username || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-sm font-mono font-bold text-foreground truncate">
            {c.display_name || `@${c.username}`}
          </div>
          {c.is_featured_creator && <Star className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />}
        </div>
        <div className="text-[11px] font-mono text-muted-foreground truncate">@{c.username}</div>
        <div className="text-[11px] font-mono text-muted-foreground mt-1">
          {c.template_count} template · {c.total_uses.toLocaleString()} uses
        </div>
      </div>
    </Link>
  );
}