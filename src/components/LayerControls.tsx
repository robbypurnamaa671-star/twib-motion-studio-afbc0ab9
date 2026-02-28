import { TopLayerTransform } from "@/lib/media";
import { RotateCcw, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface LayerControlsProps {
  transform: TopLayerTransform;
  onTransformChange: (t: TopLayerTransform) => void;
  hasTopLayer: boolean;
}

const LayerControls = ({ transform, onTransformChange, hasTopLayer }: LayerControlsProps) => {
  if (!hasTopLayer) return null;

  const reset = () =>
    onTransformChange({ x: 0, y: 0, scale: 1, rotation: 0 });

  const zoomIn = () =>
    onTransformChange({ ...transform, scale: Math.min(5, transform.scale + 0.1) });

  const zoomOut = () =>
    onTransformChange({ ...transform, scale: Math.max(0.1, transform.scale - 0.1) });

  const rotateCW = () =>
    onTransformChange({ ...transform, rotation: transform.rotation + 15 });

  return (
    <div className="flex items-center gap-1">
      <ControlBtn onClick={zoomOut} icon={<ZoomOut className="w-4 h-4" />} title="Zoom Out" />
      <span className="text-xs font-mono text-muted-foreground w-12 text-center">
        {Math.round(transform.scale * 100)}%
      </span>
      <ControlBtn onClick={zoomIn} icon={<ZoomIn className="w-4 h-4" />} title="Zoom In" />
      <div className="w-px h-5 bg-border mx-1" />
      <ControlBtn onClick={rotateCW} icon={<RotateCw className="w-4 h-4" />} title="Rotate" />
      <div className="w-px h-5 bg-border mx-1" />
      <ControlBtn onClick={reset} icon={<RotateCcw className="w-4 h-4" />} title="Reset" />
    </div>
  );
};

const ControlBtn = ({
  onClick,
  icon,
  title,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
  >
    {icon}
  </button>
);

export default LayerControls;
