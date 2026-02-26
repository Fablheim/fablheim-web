import { useState, useRef, useEffect } from 'react';
import { Save, RotateCcw, Trash2, BookmarkCheck } from 'lucide-react';
import type { MosaicNode } from 'react-mosaic-component';
import type { CampaignStage, PanelId, WorkspacePreset } from '@/types/workspace';
import { getDefaultLayout } from '@/lib/default-layouts';

interface WorkspacePresetManagerProps {
  campaignId: string;
  stage: CampaignStage;
  currentTree: MosaicNode<PanelId> | null;
  onLoad: (tree: MosaicNode<PanelId>) => void;
}

function getStorageKey(campaignId: string, stage: CampaignStage) {
  return `fablheim:workspace:${campaignId}:${stage}`;
}

function loadPresets(campaignId: string, stage: CampaignStage): WorkspacePreset[] {
  try {
    const raw = localStorage.getItem(getStorageKey(campaignId, stage));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePresets(campaignId: string, stage: CampaignStage, presets: WorkspacePreset[]) {
  localStorage.setItem(getStorageKey(campaignId, stage), JSON.stringify(presets));
}

export function WorkspacePresetManager({
  campaignId,
  stage,
  currentTree,
  onLoad,
}: WorkspacePresetManagerProps) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<WorkspacePreset[]>(() =>
    loadPresets(campaignId, stage),
  );
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPresets(loadPresets(campaignId, stage));
  }, [campaignId, stage]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSaveInput(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSave() {
    if (!saveName.trim() || !currentTree) return;
    const newPreset: WorkspacePreset = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      stage,
      mosaicTree: currentTree,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(campaignId, stage, updated);
    setSaveName('');
    setShowSaveInput(false);
  }

  function handleDelete(id: string) {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    savePresets(campaignId, stage, updated);
  }

  function handleReset() {
    onLoad(getDefaultLayout(stage));
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground"
        title="Workspace Presets"
      >
        <BookmarkCheck className="h-3.5 w-3.5" />
        Presets
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 min-w-[220px] rounded-md border border-[hsla(38,30%,25%,0.3)] bg-[hsl(24,16%,11%)] py-1 shadow-lg">
          {renderPresetList()}
          {renderDivider()}
          {renderActions()}
        </div>
      )}
    </div>
  );

  function renderPresetList() {
    if (presets.length === 0) {
      return (
        <p className="px-3 py-2 text-xs text-muted-foreground/60">
          No saved presets
        </p>
      );
    }
    return presets.map((preset) => (
      <div
        key={preset.id}
        className="flex items-center gap-1 px-1"
      >
        <button
          onClick={() => {
            onLoad(structuredClone(preset.mosaicTree));
            setOpen(false);
          }}
          className="flex-1 rounded px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground"
        >
          {preset.name}
        </button>
        <button
          onClick={() => handleDelete(preset.id)}
          className="shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:bg-blood/15 hover:text-[hsl(0,60%,55%)]"
          title="Delete preset"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    ));
  }

  function renderDivider() {
    return <div className="my-1 border-t border-[hsla(38,30%,25%,0.2)]" />;
  }

  function renderActions() {
    return (
      <>
        <button
          onClick={handleReset}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to Default
        </button>

        {showSaveInput ? (
          <div className="flex items-center gap-1 px-2 py-1">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Preset name..."
              className="flex-1 rounded bg-[hsla(38,20%,20%,0.3)] px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="shrink-0 rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/30 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            disabled={!currentTree}
            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            Save Current Layout
          </button>
        )}
      </>
    );
  }
}
