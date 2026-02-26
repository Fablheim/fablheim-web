import { useState, useEffect } from 'react';
import { Play, Square, ArrowLeft, Timer } from 'lucide-react';
import type { MosaicNode } from 'react-mosaic-component';
import type { CampaignStage, PanelId } from '@/types/workspace';
import { PanelAddMenu } from './PanelAddMenu';
import { WorkspacePresetManager } from './WorkspacePresetManager';

interface StageToolbarProps {
  campaignId: string;
  stage: CampaignStage;
  isDM: boolean;
  isTransitioning: boolean;
  activePanelIds: PanelId[];
  currentTree: MosaicNode<PanelId> | null;
  sessionStartedAt?: string;
  onStartSession: () => void;
  onEndSession: () => void;
  onReturnToPrep: () => void;
  onAddPanel: (panelId: PanelId) => void;
  onLoadPreset: (tree: MosaicNode<PanelId>) => void;
}

const STAGE_LABELS: Record<CampaignStage, string> = {
  prep: 'Prep',
  live: 'Live',
  recap: 'Recap',
};

function SessionTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(startedAt).getTime();

    function update() {
      const diff = Date.now() - start;
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        hrs > 0
          ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          : `${mins}:${String(secs).padStart(2, '0')}`,
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-[hsla(0,70%,45%,0.12)] px-2.5 py-1 text-xs font-medium text-[hsl(0,60%,65%)]">
      <Timer className="h-3.5 w-3.5" />
      {elapsed}
    </div>
  );
}

export function StageToolbar({
  campaignId,
  stage,
  isDM,
  isTransitioning,
  activePanelIds,
  currentTree,
  sessionStartedAt,
  onStartSession,
  onEndSession,
  onReturnToPrep,
  onAddPanel,
  onLoadPreset,
}: StageToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-[hsla(38,30%,25%,0.2)] bg-[hsl(24,16%,10%)] px-3 py-1.5">
      {renderStageTabs()}
      {renderSpacer()}
      {renderControls()}
    </div>
  );

  function renderStageTabs() {
    return (
      <div className="flex items-center gap-0.5 rounded-md bg-[hsla(38,20%,15%,0.4)] p-0.5">
        {(['prep', 'live', 'recap'] as CampaignStage[]).map((s) => (
          <div
            key={s}
            className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${
              s === stage
                ? 'bg-[hsla(38,40%,25%,0.3)] text-primary shadow-sm'
                : 'text-muted-foreground/50'
            }`}
          >
            {s === 'live' && stage === 'live' && (
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(0,70%,50%)] animate-pulse" />
            )}
            <span className="font-[Cinzel] tracking-wider uppercase">
              {STAGE_LABELS[s]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  function renderSpacer() {
    return <div className="flex-1" />;
  }

  function renderControls() {
    return (
      <div className="flex items-center gap-1.5">
        {stage === 'live' && sessionStartedAt && (
          <SessionTimer startedAt={sessionStartedAt} />
        )}

        <PanelAddMenu
          stage={stage}
          activePanelIds={activePanelIds}
          onAdd={onAddPanel}
        />

        <WorkspacePresetManager
          campaignId={campaignId}
          stage={stage}
          currentTree={currentTree}
          onLoad={onLoadPreset}
        />

        {isDM && renderTransitionButton()}
      </div>
    );
  }

  function renderTransitionButton() {
    if (stage === 'prep') {
      return (
        <button
          onClick={onStartSession}
          disabled={isTransitioning}
          className="flex items-center gap-1.5 rounded-md bg-[hsla(120,50%,35%,0.2)] px-3 py-1.5 text-xs font-semibold text-[hsl(120,50%,60%)] transition-colors hover:bg-[hsla(120,50%,35%,0.3)] disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          Start Session
        </button>
      );
    }

    if (stage === 'live') {
      return (
        <button
          onClick={onEndSession}
          disabled={isTransitioning}
          className="flex items-center gap-1.5 rounded-md bg-[hsla(0,60%,40%,0.2)] px-3 py-1.5 text-xs font-semibold text-[hsl(0,60%,60%)] transition-colors hover:bg-[hsla(0,60%,40%,0.3)] disabled:opacity-50"
        >
          <Square className="h-3.5 w-3.5" />
          End Session
        </button>
      );
    }

    if (stage === 'recap') {
      return (
        <button
          onClick={onReturnToPrep}
          disabled={isTransitioning}
          className="flex items-center gap-1.5 rounded-md bg-[hsla(38,50%,40%,0.15)] px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-[hsla(38,50%,40%,0.25)] disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Prep
        </button>
      );
    }

    return null;
  }
}
