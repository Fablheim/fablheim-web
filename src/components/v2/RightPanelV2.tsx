import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import type { AppState } from '@/types/workspace';
import { CampaignBrainPanelV2 } from './CampaignBrainPanelV2';

interface RightPanelV2Props {
  campaignId: string;
  appState: AppState;
  isDM: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const PANEL_LABELS: Record<AppState, string> = {
  prep: 'Campaign Brain',
  narrative: 'Party',
  combat: 'Focus Card',
  recap: 'Session Notes',
};

/**
 * Contextual companion panel — mirrors the sidebar pattern.
 * Open: header + content. Closed: thin rail with toggle.
 */
export function RightPanelV2({ campaignId, appState, isOpen, onToggle }: RightPanelV2Props) {
  if (!isOpen) {
    return renderRail();
  }

  return (
    <aside className="flex h-full w-[340px] min-w-[300px] max-w-[400px] flex-col border-l border-[hsla(32,26%,26%,0.75)] bg-[hsl(24,14%,9%)]">
      {renderHeader()}
      {renderContent()}
    </aside>
  );

  function renderRail() {
    return (
      <div className="flex h-full w-[52px] shrink-0 flex-col items-center border-l border-[hsla(32,26%,26%,0.75)] bg-[hsl(24,14%,9%)] py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          aria-label="Open right panel"
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  function renderHeader() {
    return (
      <div className="flex h-[42px] shrink-0 items-center justify-between border-b border-[hsla(32,26%,26%,0.4)] px-3">
        <h2
          className="text-[11px] uppercase tracking-[0.06em] text-[hsl(38,36%,72%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {PANEL_LABELS[appState]}
        </h2>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-6 w-6 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          aria-label="Close right panel"
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  function renderContent() {
    if (appState === 'prep') {
      return <CampaignBrainPanelV2 campaignId={campaignId} />;
    }

    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-3 py-2">
        <p className="text-xs text-[hsl(30,14%,40%)]">
          {PANEL_LABELS[appState]} — content goes here
        </p>
      </div>
    );
  }
}
