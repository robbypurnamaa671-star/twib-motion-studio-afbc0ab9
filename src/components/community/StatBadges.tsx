import { Eye, Heart, Download, Wand2, Calendar } from "lucide-react";

export function StatBadges({
  views,
  uses,
  downloads,
  likes,
  publishedAt,
}: {
  views?: number | null;
  uses?: number | null;
  downloads?: number | null;
  likes?: number | null;
  publishedAt?: string | null;
}) {
  const items = [
    uses != null && { Icon: Wand2, label: `Used ${uses.toLocaleString()} times` },
    views != null && { Icon: Eye, label: `Viewed ${views.toLocaleString()} times` },
    likes != null && likes > 0 && { Icon: Heart, label: `${likes.toLocaleString()} favorites` },
    downloads != null && downloads > 0 && { Icon: Download, label: `${downloads.toLocaleString()} downloads` },
    publishedAt && {
      Icon: Calendar,
      label: `Published ${new Date(publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
    },
  ].filter(Boolean) as { Icon: typeof Eye; label: string }[];
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2 mb-6" aria-label="Template stats">
      {items.map(({ Icon, label }) => (
        <li
          key={label}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground"
        >
          <Icon className="w-3.5 h-3.5 text-primary" />
          {label}
        </li>
      ))}
    </ul>
  );
}