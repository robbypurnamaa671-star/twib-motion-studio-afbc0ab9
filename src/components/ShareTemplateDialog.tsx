import { useState } from "react";
import { X, Share2, Copy, Check, Loader2, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LayerMedia, TopLayerTransform } from "@/lib/media";
import { DEFAULT_LOCK_SETTINGS, LockSettings } from "@/lib/templates";

interface ShareTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  canvasRatio: string;
  canvasW: number;
  canvasH: number;
  bottomLayer: LayerMedia | null;
  topLayer: LayerMedia | null;
  transform: TopLayerTransform;
}

const ShareTemplateDialog = ({
  open,
  onClose,
  canvasRatio,
  canvasW,
  canvasH,
  bottomLayer,
  topLayer,
  transform,
}: ShareTemplateDialogProps) => {
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("My Twibbon Template");
  const [locks, setLocks] = useState<LockSettings>(DEFAULT_LOCK_SETTINGS);
  const [expireHours, setExpireHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleShare = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    if (!topLayer) {
      toast({ title: "Missing twibbon", description: "Upload a twibbon frame (top layer) before sharing.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Upload twibbon frame to storage
      const ext = topLayer.file.name.split(".").pop() || "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("template-assets")
        .upload(path, topLayer.file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("template-assets")
        .getPublicUrl(path);

      const expiresAt = expireHours
        ? new Date(Date.now() + expireHours * 3600000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("shared_templates")
        .insert({
          owner_id: user.id,
          title,
          canvas_ratio: canvasRatio,
          canvas_w: canvasW,
          canvas_h: canvasH,
          bottom_layer_url: urlData.publicUrl,
          bottom_layer_config: transform as unknown as Record<string, unknown>,
          top_layer_config: {},
          lock_settings: locks as unknown as Record<string, unknown>,
          expires_at: expiresAt,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/use-template/${data.id}`;
      setShareUrl(url);
      toast({ title: "Template shared!", description: "Your shareable link is ready." });
    } catch (err: any) {
      console.error("Share failed:", err);
      toast({ title: "Share failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareUrl(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="font-mono font-bold text-lg text-foreground">Share as Template</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground">
            <p>You need to sign in to share templates.</p>
          </div>
        )}

        {/* Share URL result */}
        {shareUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Your template is live! Share this link:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm font-mono border border-border"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-mono hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Template Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:border-primary focus:outline-none transition-colors"
                placeholder="e.g. School Event 2026"
              />
            </div>

            {/* Lock settings */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">Lock Settings</label>
              <div className="space-y-2">
                <LockToggle
                  label="Lock twibbon position"
                  description="Users can't move the twibbon frame"
                  checked={locks.lockBottomPosition}
                  onChange={(v) => setLocks({ ...locks, lockBottomPosition: v })}
                />
                <LockToggle
                  label="Lock twibbon media"
                  description="Users can't replace the twibbon frame"
                  checked={locks.lockBottomMedia}
                  onChange={(v) => setLocks({ ...locks, lockBottomMedia: v })}
                />
                <LockToggle
                  label="Allow photo rotation"
                  description="Users can rotate their uploaded photo"
                  checked={locks.allowTopRotation}
                  onChange={(v) => setLocks({ ...locks, allowTopRotation: v })}
                />
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">Expiration</label>
              <div className="flex gap-2">
                {[
                  { label: "Never", value: null },
                  { label: "24h", value: 24 },
                  { label: "7 days", value: 168 },
                  { label: "30 days", value: 720 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setExpireHours(opt.value)}
                    className={`flex-1 py-2 rounded-lg font-mono text-xs border transition-colors ${
                      expireHours === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:border-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={saving || !topLayer}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {saving ? "Uploading…" : !user ? "Sign in & Share" : "Generate Share Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const LockToggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!checked)}
    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
  >
    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${checked ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
      {checked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </button>
);

export default ShareTemplateDialog;
