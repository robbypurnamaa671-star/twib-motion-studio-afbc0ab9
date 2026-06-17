import { useState } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export function EmbedCodeDialog({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://twibmotion.com/embed/${slug}`;
  const code = `<iframe src="${url}" width="400" height="500" frameborder="0" allowfullscreen loading="lazy" title="TwibMotion template"></iframe>`;

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Embed code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-xs font-mono text-foreground hover:border-primary/60 hover:text-primary">
          <Code2 className="w-3.5 h-3.5" /> Embed
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Embed this template</DialogTitle>
          <DialogDescription>Paste this HTML into your blog, website, or landing page.</DialogDescription>
        </DialogHeader>
        <pre className="bg-secondary p-3 rounded-md text-xs font-mono overflow-x-auto">{code}</pre>
        <button onClick={copy} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono font-semibold text-sm">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default EmbedCodeDialog;