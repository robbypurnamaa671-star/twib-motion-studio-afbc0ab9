import { useState } from "react";
import { X, Share2, Copy, Check, Loader2, Lock, Unlock, Globe, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [title, setTitle] = useState(t("share.defaultTitle"));
  const [locks, setLocks] = useState<LockSettings>(DEFAULT_LOCK_SETTINGS);
  const [expireHours, setExpireHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  if (!open) return null;

  const handleShare = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    if (!topLayer) {
      toast({ title: t("share.missingTwibbon"), description: t("share.missingTwibbonDesc"), variant: "destructive" });
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
          is_public: isPublic,
          preview_url: urlData.publicUrl,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/use-template/${data.id}`;
      setShareUrl(url);
      toast({ title: t("share.shared"), description: t("share.sharedDesc") });
    } catch (err: any) {
      console.error("Share failed:", err);
      toast({ title: t("share.shareFailed"), description: err.message || String(err), variant: "destructive" });
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
            <h2 className="font-mono font-bold text-lg text-foreground">{t("share.title")}</h2>
          </div>
          <button onClick={handleClose} aria-label={t("common.cancel")} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground">
            <p>{t("share.signinNotice")}</p>
          </div>
        )}

        {/* Share URL result */}
        {shareUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("share.yourLink")}</p>
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
                {copied ? t("common.copied") : t("common.copy")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">{t("share.templateTitle")}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:border-primary focus:outline-none transition-colors"
                placeholder={t("share.titlePlaceholder")}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    !isPublic ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-muted-foreground"
                  }`}
                >
                  <EyeOff className="w-4 h-4 text-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Private</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Only people with the link</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    isPublic ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-muted-foreground"
                  }`}
                >
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Public</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Show on homepage gallery</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">Lock settings</label>
              <div className="space-y-2">
                <LockToggle
                  label={t("share.lockPosition")}
                  description={t("share.lockPositionDesc")}
                  checked={locks.lockBottomPosition}
                  onChange={(v) => setLocks({ ...locks, lockBottomPosition: v })}
                />
                <LockToggle
                  label={t("share.lockMedia")}
                  description={t("share.lockMediaDesc")}
                  checked={locks.lockBottomMedia}
                  onChange={(v) => setLocks({ ...locks, lockBottomMedia: v })}
                />
                <LockToggle
                  label={t("share.allowRotation")}
                  description={t("share.allowRotationDesc")}
                  checked={locks.allowTopRotation}
                  onChange={(v) => setLocks({ ...locks, allowTopRotation: v })}
                />
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">{t("share.expiration")}</label>
              <div className="flex gap-2">
                {[
                  { label: t("share.never"), value: null },
                  { label: t("share.h24"), value: 24 },
                  { label: t("share.days7"), value: 168 },
                  { label: t("share.days30"), value: 720 },
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
              {saving ? t("share.uploading") : !user ? t("share.signinShare") : t("share.generateLink")}
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
