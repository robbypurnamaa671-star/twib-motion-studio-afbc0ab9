import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Props = {
  url: string;
  title: string;
  refUsername?: string | null;
  compact?: boolean;
};

function withRef(url: string, ref?: string | null) {
  if (!ref) return url;
  const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://twibmotion.com");
  if (!u.searchParams.has("ref")) u.searchParams.set("ref", ref);
  return u.toString();
}

export function ShareBar({ url, title, refUsername, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = withRef(url, refUsername);
  const enc = (s: string) => encodeURIComponent(s);

  const networks = [
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(title + " " + shareUrl)}`, color: "#25D366" },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`, color: "#1877F2" },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(shareUrl)}`, color: "#000" },
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(title)}`, color: "#229ED9" },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`, color: "#0A66C2" },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-2"}`}>
      {!compact && <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mr-1">Share:</span>}
      {networks.map((n) => (
        <a
          key={n.name}
          href={n.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${n.name}`}
          className="px-3 py-1.5 rounded-md border border-border text-xs font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors"
          style={{ borderLeftColor: n.color, borderLeftWidth: 3 }}
        >
          {n.name}
        </a>
      ))}
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-mono text-foreground hover:border-primary/60 hover:text-primary transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

export default ShareBar;