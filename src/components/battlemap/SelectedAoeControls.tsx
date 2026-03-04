import { RotateCcw, RotateCw, Trash2, Move } from 'lucide-react';
import type { ReactNode } from 'react';

interface SelectedAoeControlsProps {
  left: number;
  top: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDelete: () => void;
  onStartResize: () => void;
}

export function SelectedAoeControls({
  left,
  top,
  onRotateLeft,
  onRotateRight,
  onDelete,
  onStartResize,
}: SelectedAoeControlsProps) {
  return (
    <div
      className="absolute z-[20] flex items-center gap-1 rounded-full border border-border/70 bg-card/95 p-1 shadow-warm-lg backdrop-blur-sm"
      style={{ left, top }}
    >
      <ControlButton label="Rotate Left" onClick={onRotateLeft} icon={<RotateCcw className="h-3.5 w-3.5" />} />
      <ControlButton label="Rotate Right" onClick={onRotateRight} icon={<RotateCw className="h-3.5 w-3.5" />} />
      <ControlButton label="Resize/Rotate" onPointerDown={onStartResize} icon={<Move className="h-3.5 w-3.5" />} />
      <ControlButton
        label="Delete"
        onClick={onDelete}
        icon={<Trash2 className="h-3.5 w-3.5" />}
        danger
      />
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  onPointerDown,
  icon,
  danger = false,
}: {
  label: string;
  onClick?: () => void;
  onPointerDown?: () => void;
  icon: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
        danger
          ? 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'border-border/60 bg-accent/40 text-foreground hover:bg-accent'
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
