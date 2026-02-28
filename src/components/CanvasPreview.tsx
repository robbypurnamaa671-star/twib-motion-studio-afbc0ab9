import { useRef, useState, useCallback, useEffect } from "react";
import { LayerMedia, TopLayerTransform } from "@/lib/media";

interface CanvasPreviewProps {
  canvasW: number;
  canvasH: number;
  bottomLayer: LayerMedia | null;
  topLayer: LayerMedia | null;
  transform: TopLayerTransform;
  onTransformChange: (t: TopLayerTransform) => void;
}

const CanvasPreview = ({
  canvasW,
  canvasH,
  bottomLayer,
  topLayer,
  transform,
  onTransformChange,
}: CanvasPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const [displaySize, setDisplaySize] = useState({ w: 300, h: 300 });

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const maxW = rect.width;
      const maxH = rect.height;
      const aspect = canvasW / canvasH;
      let w = maxW;
      let h = w / aspect;
      if (h > maxH) {
        h = maxH;
        w = h * aspect;
      }
      setDisplaySize({ w, h });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [canvasW, canvasH]);

  const scaleRatio = displaySize.w / canvasW;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!topLayer) return;
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: transform.x,
        ty: transform.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [topLayer, transform]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = (e.clientX - dragStart.current.x) / scaleRatio;
      const dy = (e.clientY - dragStart.current.y) / scaleRatio;
      onTransformChange({
        ...transform,
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      });
    },
    [dragging, scaleRatio, transform, onTransformChange]
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Wheel zoom on canvas overlay only
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!topLayer) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.1, Math.min(5, transform.scale + delta));
      onTransformChange({ ...transform, scale: newScale });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [topLayer, transform, onTransformChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
    >
      <div
        className="relative overflow-hidden canvas-grid"
        style={{
          width: displaySize.w,
          height: displaySize.h,
          borderRadius: 4,
        }}
      >
        {/* Bottom Layer (Twibbon) — always behind */}
        {bottomLayer && (
          <div className="absolute inset-0" style={{ zIndex: 1 }}>
            {bottomLayer.type === "video" ? (
              <video
                src={bottomLayer.url}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={bottomLayer.url}
                alt="Twibbon Layer"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Top Layer (User - editable) — always on top */}
        {topLayer && (
          <div
            ref={overlayRef}
            className={`absolute ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{
              zIndex: 2,
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
            {topLayer.type === "video" ? (
              <video
                src={topLayer.url}
                className="w-full h-full object-cover pointer-events-none"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={topLayer.url}
                alt="User Layer"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />
            )}
          </div>
        )}

        {/* Safe area guides — highest z */}
        <div
          className="absolute border border-primary/20 pointer-events-none"
          style={{
            zIndex: 10,
            top: "5%",
            left: "5%",
            right: "5%",
            bottom: "5%",
          }}
        />

        {/* Empty state */}
        {!bottomLayer && !topLayer && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground/40 font-mono text-sm text-center px-4">
              Upload layers to preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasPreview;
