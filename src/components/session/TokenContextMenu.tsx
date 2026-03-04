import { useEffect, useRef, useState } from 'react';
import { Trash2, Move, Eye, EyeOff } from 'lucide-react';
import type { MapToken } from '@/types/live-session';

interface TokenContextMenuProps {
  token: MapToken;
  position: { x: number; y: number };
  isDM: boolean;
  isOwn: boolean;
  onMove: () => void;
  onRemove: () => void;
  onToggleHidden: () => void;
  onSetSize: (size: number) => void;
  onClose: () => void;
}

const SIZE_LABELS = ['S', 'L', 'H', 'G'];

export function TokenContextMenu({
  token,
  position,
  isDM,
  isOwn,
  onMove,
  onRemove,
  onToggleHidden,
  onSetSize,
  onClose,
}: TokenContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [adjusted, setAdjusted] = useState(position);

  // Clamp menu position to viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let { x, y } = position;
    if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    setAdjusted({ x, y });
  }, [position]);

  // Close on click-outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[140px] rounded-lg border border-border bg-card py-1 shadow-[0_10px_30px_hsla(24,35%,5%,0.45)]"
      style={{ left: adjusted.x, top: adjusted.y }}
    >
      <p className="px-3 py-1 font-[Cinzel] text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate max-w-[180px]">
        {token.name}
      </p>

      {(isDM || isOwn) && (
        <MenuItem icon={Move} label="Move" onClick={onMove} />
      )}

      {isDM && (
        <>
          <MenuItem
            icon={token.isHidden ? Eye : EyeOff}
            label={token.isHidden ? 'Show' : 'Hide'}
            onClick={onToggleHidden}
          />
          <div className="my-1 h-px bg-border" />
          <p className="px-3 py-0.5 text-[9px] text-muted-foreground font-[Cinzel] uppercase">
            Size
          </p>
          <div className="flex gap-1 px-3 py-1">
            {[1, 2, 3, 4].map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => onSetSize(s)}
                title={['Small/Med', 'Large', 'Huge', 'Gargantuan'][i]}
                className={`h-6 w-6 rounded text-[10px] font-bold transition-colors ${
                  (token.size || 1) === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent/60 text-muted-foreground hover:bg-accent'
                }`}
              >
                {SIZE_LABELS[i]}
              </button>
            ))}
          </div>
          <div className="my-1 h-px bg-border" />
          <MenuItem
            icon={Trash2}
            label="Remove"
            onClick={onRemove}
            className="text-destructive hover:bg-destructive/10"
          />
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent/60 ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
