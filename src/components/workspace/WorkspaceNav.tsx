import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Timer, ChevronLeft } from 'lucide-react';
import type { MosaicNode } from 'react-mosaic-component';
import type { CampaignStage, PanelId } from '@/types/workspace';
import { PanelAddMenu } from './PanelAddMenu';
import { WorkspacePresetManager } from './WorkspacePresetManager';

interface WorkspaceNavProps {
  campaignId: string;
  campaignName: string;
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
    <div className="flex items-center gap-1.5 rounded-md bg-[hsla(0,70%,45%,0.12)] px-2 py-0.5 text-[10px] font-medium text-[hsl(0,60%,65%)]">
      <Timer className="h-3 w-3" />
      {elapsed}
    </div>
  );
}

export function WorkspaceNav({
  campaignId,
  campaignName,
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
}: WorkspaceNavProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[hsla(38,30%,25%,0.25)] bg-[linear-gradient(180deg,hsla(38,30%,22%,0.14)_0%,hsla(24,16%,10%,0.92)_100%)] px-3">
      {renderLeft()}
      {renderStageTabs()}
      <div className="flex-1" />
      {renderRight()}
    </div>
  );

  function renderLeft() {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground"
          title="Back to Dashboard"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <img src="/fablheim-logo.png" alt="Fablheim" className="h-5 w-5 rounded-sm" />
        </button>
        <div className="h-4 w-px bg-[hsla(38,30%,30%,0.2)]" />
        <span className="truncate font-[Cinzel] text-sm font-semibold tracking-wide text-foreground text-carved max-w-[220px]">
          {campaignName}
        </span>
      </div>
    );
  }

  function renderStageTabs() {
    return (
      <div className="ml-3 flex items-center gap-0.5 rounded-md border border-[hsla(38,30%,35%,0.25)] bg-[hsla(38,20%,15%,0.42)] p-0.5">
        {(['prep', 'live', 'recap'] as CampaignStage[]).map((s) => (
          <div
            key={s}
            className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-[10px] font-medium cursor-default select-none ${
              s === stage
                ? 'bg-[hsla(38,45%,30%,0.35)] text-primary shadow-sm'
                : 'text-muted-foreground/50'
            }`}
          >
            {s === 'live' && stage === 'live' && (
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(0,70%,50%)] animate-pulse" />
            )}
            <span className="font-[Cinzel] tracking-wider uppercase">{STAGE_LABELS[s]}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderRight() {
    return (
      <div className="flex items-center gap-1.5">
        {stage === 'live' && sessionStartedAt && (
          <SessionTimer startedAt={sessionStartedAt} />
        )}

        {stage !== 'prep' && (
          <>
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
          </>
        )}

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
          className="btn-emboss flex items-center gap-1.5 rounded-md border border-brass/45 bg-[linear-gradient(180deg,hsla(38,88%,56%,0.26)_0%,hsla(16,76%,42%,0.2)_100%)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(42,95%,84%)] transition-all hover:border-brass/65 hover:bg-[linear-gradient(180deg,hsla(38,88%,56%,0.34)_0%,hsla(16,76%,42%,0.28)_100%)] disabled:opacity-50"
        >
          <Play className="h-3 w-3" />
          Start Session
        </button>
      );
    }

    if (stage === 'live') {
      return (
        <button
          onClick={onEndSession}
          disabled={isTransitioning}
          className="flex items-center gap-1 rounded-md bg-[hsla(0,60%,40%,0.2)] px-2.5 py-1 text-[10px] font-semibold text-[hsl(0,60%,60%)] transition-colors hover:bg-[hsla(0,60%,40%,0.3)] disabled:opacity-50"
        >
          <Square className="h-3 w-3" />
          End Session
        </button>
      );
    }

    if (stage === 'recap') {
      return (
        <button
          onClick={onReturnToPrep}
          disabled={isTransitioning}
          className="flex items-center gap-1 rounded-md bg-[hsla(38,50%,40%,0.15)] px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-[hsla(38,50%,40%,0.25)] disabled:opacity-50"
        >
          <ArrowLeft className="h-3 w-3" />
          Return to Prep
        </button>
      );
    }

    return null;
  }
}
