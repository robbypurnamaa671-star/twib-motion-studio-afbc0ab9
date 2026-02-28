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
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Calculate display size to fit container
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

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!topLayer) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.1, Math.min(5, transform.scale + delta));
      onTransformChange({ ...transform, scale: newScale });
    },
    [topLayer, transform, onTransformChange]
  );

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
        {/* Safe area guides */}
        <div
          className="absolute border border-primary/20 pointer-events-none z-30"
          style={{
            top: "5%",
            left: "5%",
            right: "5%",
            bottom: "5%",
          }}
        />

        {/* Bottom Layer (Twibbon) */}
        {bottomLayer && (
          <div className="absolute inset-0 z-10">
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

        {/* Top Layer (User - editable) */}
        {topLayer && (
          <div
            className={`absolute z-20 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translate(${transform.x * scaleRatio}px, ${transform.y * scaleRatio}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
              width: displaySize.w,
              height: displaySize.h,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
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

        {/* Empty state */}
        {!bottomLayer && !topLayer && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
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
