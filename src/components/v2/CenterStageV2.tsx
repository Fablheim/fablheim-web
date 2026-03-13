import type { AppState } from '@/types/workspace';
import type { Campaign } from '@/types/campaign';
import { WorldCenterStage } from './world/WorldCenterStage';
import { SessionsCenterStage } from './SessionsCenterStage';
import { OverviewCenterStage } from './OverviewCenterStage';
import { PlayersCenterStage } from './PlayersCenterStage';

interface CenterStageV2Props {
  campaignId: string;
  campaign: Campaign;
  appState: AppState;
  activeTab: string;
  isDM: boolean;
  onTabChange: (tab: string) => void;
  onStartSession: () => void;
}

const STATE_LABELS: Record<AppState, string> = {
  prep: 'Prep Workspace',
  narrative: 'Narrative Play',
  combat: 'Tactical Map',
  recap: 'Session Recap',
};

/** Sidebar tabs that map to the world center stage */
const WORLD_TABS = new Set(['world', 'npcs', 'notes', 'relationships']);

/**
 * The main working surface. Content changes based on appState and active tab:
 * - prep: world/entity browser, encounters, sessions, etc.
 * - narrative: current scene (location + NPCs + quest state)
 * - combat: tactical map
 * - recap: session summary + notes
 */
export function CenterStageV2({
  campaignId,
  campaign,
  appState,
  activeTab,
  isDM,
  onTabChange,
  onStartSession,
}: CenterStageV2Props) {
  if (appState === 'prep' && activeTab === 'overview') {
    return (
      <OverviewCenterStage
        campaignId={campaignId}
        campaign={campaign}
        appState={appState}
        isDM={isDM}
        onTabChange={onTabChange}
        onStartSession={onStartSession}
      />
    );
  }

  if (appState === 'prep' && WORLD_TABS.has(activeTab)) {
    return (
      <WorldCenterStage
        campaignId={campaignId}
        isDM={isDM}
        activeTab={activeTab}
      />
    );
  }

  if (appState === 'prep' && activeTab === 'sessions') {
    return (
      <SessionsCenterStage
        campaignId={campaignId}
        onOpenWorldEntity={() => onTabChange('world')}
      />
    );
  }

  if (appState === 'prep' && activeTab === 'players') {
    return (
      <PlayersCenterStage
        campaignId={campaignId}
        isDM={isDM}
        onOpenWorldEntity={() => onTabChange('world')}
      />
    );
  }

  return renderPlaceholder();

  function renderPlaceholder() {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p
            className="mb-1 text-sm text-[hsl(38,36%,72%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {STATE_LABELS[appState]}
          </p>
          <p className="text-xs text-[hsl(30,14%,40%)]">
            Active tab: {activeTab}
          </p>
        </div>
      </div>
    );
  }
}
