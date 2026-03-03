import { useState, useRef, useEffect } from 'react';
import { BookmarkCheck, RotateCcw } from 'lucide-react';
import { SESSION_LAYOUT_PRESETS } from '@/config/layout-presets';

interface LayoutPresetSelectorProps {
  onLoadPreset: (presetId: string) => void;
  onResetToDefault: () => void;
}

export function LayoutPresetSelector({ onLoadPreset, onResetToDefault }: LayoutPresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="app-focus-ring inline-flex items-center gap-1.5 rounded-md border border-iron/80 bg-accent/70 px-3.5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
      >
        <BookmarkCheck className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Layout</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1.5 min-w-[240px] rounded-lg border border-[hsla(38,30%,25%,0.45)] bg-[hsl(24,16%,11%)] py-1.5 shadow-[0_16px_38px_hsla(24,30%,4%,0.55)]">
          {SESSION_LAYOUT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                onLoadPreset(preset.id);
                setOpen(false);
              }}
              className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-[hsla(38,30%,30%,0.12)]"
            >
              <span className="text-sm font-medium text-foreground">{preset.name}</span>
              <span className="text-[11px] text-muted-foreground">{preset.description}</span>
            </button>
          ))}

          <div className="my-1 border-t border-[hsla(38,30%,25%,0.2)]" />

          <button
            type="button"
            onClick={() => {
              onResetToDefault();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </button>
        </div>
      )}
    </div>
  );
}
