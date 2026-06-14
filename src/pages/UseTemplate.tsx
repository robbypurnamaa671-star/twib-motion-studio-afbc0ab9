import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Loader2, Upload, Image, Film, X, ZoomIn, ZoomOut, RotateCw, RotateCcw, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LayerMedia, TopLayerTransform, getMediaType, validateFile } from "@/lib/media";
import { SharedTemplate, LockSettings } from "@/lib/templates";
import { exportStatic, downloadBlob } from "@/lib/export";
import ExportDialog from "@/components/ExportDialog";
import { ReportTemplateDialog } from "@/components/ReportTemplateDialog";
import { StickyHeader } from "@/components/StickyHeader";
import { lovable } from "@/integrations/lovable";
import SEOHead from "@/components/SEOHead";
import { trackView, trackUse } from "@/lib/view-tracking";

const UseTemplate = () => {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [template, setTemplate] = useState<SharedTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User's photo (bottom layer in rendering — behind the twibbon)
  const [userPhoto, setUserPhoto] = useState<LayerMedia | null>(null);
  const [transform, setTransform] = useState<TopLayerTransform>({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [exportOpen, setExportOpen] = useState(false);

  // Canvas display
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ w: 300, h: 300 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Load template
  useEffect(() => {
    const load = async () => {
      if (!templateId) { setError("No template ID"); setLoading(false); return; }
      // Support both UUID ids (legacy links) and human-readable slugs
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId);
      const query = supabase.from("shared_templates").select("*");
      const { data, error: fetchErr } = await (isUuid
        ? query.eq("id", templateId).maybeSingle()
        : query.eq("slug", templateId).maybeSingle());

      if (fetchErr || !data) {
        setError("Template not found or has expired.");
        setLoading(false);
        return;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This template has expired.");
        setLoading(false);
        return;
      }

      setTemplate({
        ...data,
        bottom_layer_config: data.bottom_layer_config as unknown as TopLayerTransform,
        lock_settings: data.lock_settings as unknown as LockSettings,
        top_layer_config: data.top_layer_config as unknown as Record<string, unknown>,
      } as SharedTemplate);
      setLoading(false);
      trackView((data as { id: string }).id);
    };
    load();
  }, [templateId]);

  // Canvas sizing
  useEffect(() => {
    if (!template) return;
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const aspect = template.canvas_w / template.canvas_h;
      let w = rect.width;
      let h = w / aspect;
      if (h > rect.height) { h = rect.height; w = h * aspect; }
      setDisplaySize({ w, h });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [template]);

  const scaleRatio = template ? displaySize.w / template.canvas_w : 1;
  const locks = template?.lock_settings || { lockBottomPosition: true, lockBottomMedia: true, allowTopRotation: true, topMinScale: 0.1, topMaxScale: 5 };

  // Drag user photo
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!userPhoto) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [userPhoto, transform]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragStart.current.x) / scaleRatio;
    const dy = (e.clientY - dragStart.current.y) / scaleRatio;
    onTransformChange({ ...transform, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
  }, [dragging, scaleRatio, transform]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  const onTransformChange = (t: TopLayerTransform) => {
    const clamped = { ...t };
    clamped.scale = Math.max(locks.topMinScale, Math.min(locks.topMaxScale, clamped.scale));
    if (!locks.allowTopRotation) clamped.rotation = 0;
    setTransform(clamped);
  };

  // Wheel zoom
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!userPhoto) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      onTransformChange({ ...transform, scale: transform.scale + delta });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [userPhoto, transform, locks]);

  // File upload handler
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) { toast({ title: "Invalid file", description: err, variant: "destructive" }); return; }
    const type = getMediaType(file);
    if (!type) return;
    if (type === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > 30) { toast({ title: "Too long", description: "Max 30s", variant: "destructive" }); return; }
        setUserPhoto({ file, url: URL.createObjectURL(file), type });
      };
      video.src = URL.createObjectURL(file);
    } else {
      setUserPhoto({ file, url: URL.createObjectURL(file), type });
    }
  }, [toast]);

  // Build LayerMedia for the twibbon (loaded from URL)
  const [twibbonMedia, setTwibbonMedia] = useState<LayerMedia | null>(null);
  useEffect(() => {
    if (!template) return;
    // Create a fake LayerMedia from the public URL
    fetch(template.bottom_layer_url)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "twibbon.png", { type: blob.type });
        const url = URL.createObjectURL(blob);
        const type = blob.type.startsWith("video") ? "video" as const : blob.type === "image/gif" ? "gif" as const : "image" as const;
        setTwibbonMedia({ file, url, type });
      })
      .catch(() => toast({ title: "Failed to load twibbon frame", variant: "destructive" }));
  }, [template]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-mono text-foreground">{error || "Template not found"}</p>
        <button onClick={() => navigate("/")} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm hover:opacity-90">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:h-screen lg:overflow-hidden">
      <SEOHead
        title={`${template.title} – Free Twibbon Template | TwibMotion`}
        description={`Create a twibbon with the "${template.title}" template on TwibMotion. Upload your photo, GIF, or video and export in seconds.`}
        canonical={`https://twibmotion.com/use-template/${template.slug || template.id}`}
        ogUrl={`https://twibmotion.com/use-template/${template.slug || template.id}`}
        ogType="website"
      />
      {/* Header */}
      <StickyHeader className="px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TwibMotion logo" width={24} height={24} className="w-6 h-6 rounded" />
          <span className="font-mono font-bold text-sm text-foreground">TwibMotion</span>
          <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground ml-2">
            {template.canvas_ratio}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Controls */}
          {userPhoto && (
            <div className="flex items-center gap-1">
              <CtrlBtn onClick={() => onTransformChange({ ...transform, scale: Math.max(locks.topMinScale, transform.scale - 0.1) })} icon={<ZoomOut className="w-4 h-4" />} title="Zoom Out" />
              <span className="text-xs font-mono text-muted-foreground w-12 text-center">{Math.round(transform.scale * 100)}%</span>
              <CtrlBtn onClick={() => onTransformChange({ ...transform, scale: Math.min(locks.topMaxScale, transform.scale + 0.1) })} icon={<ZoomIn className="w-4 h-4" />} title="Zoom In" />
              {locks.allowTopRotation && (
                <>
                  <div className="w-px h-5 bg-border mx-1" />
                  <CtrlBtn onClick={() => onTransformChange({ ...transform, rotation: transform.rotation + 15 })} icon={<RotateCw className="w-4 h-4" />} title="Rotate" />
                </>
              )}
              <div className="w-px h-5 bg-border mx-1" />
              <CtrlBtn onClick={() => onTransformChange({ x: 0, y: 0, scale: 1, rotation: 0 })} icon={<RotateCcw className="w-4 h-4" />} title="Reset" />
            </div>
          )}
          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
          <button
            onClick={() => setExportOpen(true)}
            disabled={!userPhoto || !user}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </StickyHeader>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Sidebar */}
        <aside className="lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          <div>
            <h2 className="font-mono font-bold text-lg text-foreground mb-1">{template.title}</h2>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Upload your photo below to create your twibbon</p>
              {templateId && <ReportTemplateDialog templateId={templateId} />}
            </div>
          </div>

          {/* Login prompt for unauthenticated users */}
          {!user && !authLoading && (
            <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-5 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Sign in to get started</p>
                <p className="text-xs text-muted-foreground mt-1">Sign in with Google to upload your photo and export</p>
              </div>
              <button
                onClick={() => {
                  const returnUrl = `${window.location.origin}/use-template/${templateId}`;
                  lovable.auth.signInWithOAuth("google", { redirect_uri: returnUrl });
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background font-mono text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign in with Google
              </button>
            </div>
          )}

          {/* Upload area - only for authenticated users */}
          {user && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary">📷</div>
              <span className="text-sm font-medium text-foreground">Your Photo</span>
            </div>
            {userPhoto ? (
              <div className="relative rounded-lg border-2 border-border bg-card overflow-hidden">
                <div className="aspect-video flex items-center justify-center">
                  {userPhoto.type === "video" ? (
                    <video src={userPhoto.url} className="max-h-full max-w-full object-contain" muted loop autoPlay playsInline />
                  ) : (
                    <img src={userPhoto.url} alt="Your photo" className="max-h-full max-w-full object-contain" />
                  )}
                </div>
                <button
                  onClick={() => { URL.revokeObjectURL(userPhoto.url); setUserPhoto(null); }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/80 text-xs font-mono text-foreground flex items-center gap-1">
                  {userPhoto.type === "video" ? <Film className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                  {userPhoto.type.toUpperCase()}
                </div>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border bg-card hover:border-muted-foreground/40 p-6 flex flex-col items-center gap-3 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Upload Your Photo</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, MP4 (max 50MB)</p>
                </div>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.mp4"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
          )}

          {/* Twibbon preview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-xs font-mono font-bold text-secondary-foreground">🖼</div>
              <span className="text-sm font-medium text-foreground">Twibbon Frame</span>
              <span className="text-xs text-muted-foreground ml-auto">Locked</span>
            </div>
            <div className="rounded-lg border-2 border-border bg-card overflow-hidden opacity-80">
              <div className="aspect-video flex items-center justify-center">
                {twibbonMedia ? (
                  <img src={twibbonMedia.url} alt="Twibbon" className="max-h-full max-w-full object-contain" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border text-xs text-muted-foreground">
            <p>Scroll on canvas to zoom • Drag to reposition your photo</p>
          </div>
        </aside>

        {/* Canvas */}
        <main ref={containerRef} className="flex-1 bg-secondary/30 p-4 min-h-0 flex items-center justify-center">
          <div
            className="relative overflow-hidden canvas-grid"
            style={{ width: displaySize.w, height: displaySize.h, borderRadius: 4 }}
          >
            {/* User photo layer (bottom in render, interactive) */}
            {userPhoto && (
              <div
                ref={overlayRef}
                className={`absolute ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                style={{
                  zIndex: 1,
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) translate(${transform.x * scaleRatio}px, ${transform.y * scaleRatio}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
                  width: displaySize.w,
                  height: displaySize.h,
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                {userPhoto.type === "video" ? (
                  <video src={userPhoto.url} className="w-full h-full object-cover pointer-events-none" muted loop autoPlay playsInline />
                ) : (
                  <img src={userPhoto.url} alt="Your Photo" className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
                )}
              </div>
            )}

            {/* Twibbon frame layer (top, fixed) */}
            {twibbonMedia && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                <img src={twibbonMedia.url} alt="Twibbon Frame" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Empty state */}
            {!userPhoto && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
                <p className="text-muted-foreground/40 font-mono text-sm text-center px-4">Upload your photo to preview</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Export */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        canvasW={template.canvas_w}
        canvasH={template.canvas_h}
        bottomLayer={userPhoto}
        topLayer={twibbonMedia}
        transform={transform}
        forceWatermark
      />
    </div>
  );
};

const CtrlBtn = ({ onClick, icon, title }: { onClick: () => void; icon: React.ReactNode; title: string }) => (
  <button onClick={onClick} title={title} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
    {icon}
  </button>
);

export default UseTemplate;
