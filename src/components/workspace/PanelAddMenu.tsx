import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getPanelsForStage } from '@/lib/panel-registry';
import type { CampaignStage, PanelId } from '@/types/workspace';

interface PanelAddMenuProps {
  stage: CampaignStage;
  activePanelIds: PanelId[];
  onAdd: (panelId: PanelId) => void;
}

export function PanelAddMenu({ stage, activePanelIds, onAdd }: PanelAddMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const available = getPanelsForStage(stage).filter(
    (p) => !activePanelIds.includes(p.id),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={available.length === 0}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        title="Add Panel"
      >
        <Plus className="h-3.5 w-3.5" />
        Panel
      </button>

      {open && available.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-[180px] rounded-md border border-[hsla(38,30%,25%,0.3)] bg-[hsl(24,16%,11%)] py-1 shadow-lg">
          {available.map((panel) => {
            const Icon = panel.icon;
            return (
              <button
                key={panel.id}
                onClick={() => {
                  onAdd(panel.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0 text-[hsla(38,30%,60%,0.6)]" />
                {panel.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
