import {
  Play,
  Square,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import type { AppState, CampaignStage } from '@/types/workspace';

interface HeaderV2Props {
  campaignName: string;
  appState: AppState;
  stage: CampaignStage;
  isDM: boolean;
  isTransitioning: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  onReturnToPrep: () => void;
}

const STAGE_LABELS: Record<CampaignStage, string> = {
  prep: 'Prep',
  live: 'Live',
  recap: 'Recap',
};

const STAGE_COLORS: Record<CampaignStage, string> = {
  prep: 'bg-[hsl(180,50%,32%)]/15 text-[hsl(180,50%,52%)] border-[hsl(180,50%,32%)]/30',
  live: 'bg-[hsl(0,55%,28%)]/15 text-[hsl(0,62%,58%)] border-[hsl(0,55%,28%)]/30',
  recap: 'bg-[hsl(42,56%,44%)]/15 text-[hsl(42,56%,64%)] border-[hsl(42,56%,44%)]/30',
};

export function HeaderV2({
  campaignName,
  appState: _appState,
  stage,
  isDM,
  isTransitioning,
  onStartSession,
  onEndSession,
  onReturnToPrep,
}: HeaderV2Props) {
  return (
    <header className="session-top-bar flex h-11 items-center gap-3 border-b border-[hsla(32,26%,26%,0.75)] px-3">
      {renderLeft()}
      {renderCenter()}
      {renderRight()}
    </header>
  );

  function renderLeft() {
    return (
      <div className="flex items-center gap-2">
        <h1
          className="truncate text-base text-[hsl(35,24%,92%)]"
          style={{ fontFamily: "'IM Fell English', serif" }}
        >
          {campaignName}
        </h1>

        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STAGE_COLORS[stage]}`}
        >
          {STAGE_LABELS[stage]}
        </span>
      </div>
    );
  }

  function renderCenter() {
    return <div className="flex-1" />;
  }

  function renderRight() {
    if (!isDM) return null;
    return (
      <div className="flex items-center gap-2">
        {renderStageAction()}
      </div>
    );
  }

  function renderStageAction() {
    if (isTransitioning) {
      return (
        <button
          type="button"
          disabled
          className="flex h-7 items-center gap-1.5 rounded px-2.5 text-xs text-[hsl(30,12%,58%)]"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </button>
      );
    }

    if (stage === 'prep') {
      return (
        <button
          type="button"
          onClick={onStartSession}
          className="btn-emboss flex h-7 items-center gap-1.5 rounded bg-[hsl(38,92%,50%)] px-2.5 text-xs font-medium text-[hsl(24,22%,6%)]"
        >
          <Play className="h-3 w-3" />
          Start Session
        </button>
      );
    }

    if (stage === 'live') {
      return (
        <button
          type="button"
          onClick={onEndSession}
          className="btn-emboss flex h-7 items-center gap-1.5 rounded bg-[hsl(0,60%,40%)] px-2.5 text-xs font-medium text-[hsl(35,24%,92%)]"
        >
          <Square className="h-3 w-3" />
          End Session
        </button>
      );
    }

    if (stage === 'recap') {
      return (
        <button
          type="button"
          onClick={onReturnToPrep}
          className="btn-emboss flex h-7 items-center gap-1.5 rounded bg-[hsl(24,20%,15%)] px-2.5 text-xs font-medium text-[hsl(35,24%,92%)] border border-[hsla(32,26%,26%,0.75)]"
        >
          <RotateCcw className="h-3 w-3" />
          Return to Prep
        </button>
      );
    }

    return null;
  }
}
