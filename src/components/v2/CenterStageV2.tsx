import type { AppState } from '@/types/workspace';
import type { Campaign } from '@/types/campaign';
import { WorldCenterStage } from './world/WorldCenterStage';
import { SessionsCenterStage } from './SessionsCenterStage';
import { OverviewCenterStage } from './OverviewCenterStage';
import { PlayersCenterStage } from './PlayersCenterStage';
import { EncounterCenterStageV2 } from './encounters/EncounterCenterStageV2';
import { HandoutsArchiveV2 } from './handouts/HandoutsArchiveV2';
import { InWorldCalendarCenterStage } from './calendar/InWorldCalendarCenterStage';
import { RulesDeskCenterStage } from './rules/RulesDeskCenterStage';
import { SafetyToolsCenterStage } from './safety/SafetyToolsCenterStage';
import { RandomTablesDeskV2 } from './random-tables/RandomTablesDeskV2';
import { DowntimeDeskV2 } from './downtime/DowntimeDeskV2';
import { StoryArcsDeskV2 } from './arcs/StoryArcsDeskV2';
import { TrackersDeskV2 } from './trackers/TrackersDeskV2';
import { CampaignHealthDeskV2 } from './campaign-health/CampaignHealthDeskV2';
import { EconomyDeskV2 } from './economy/EconomyDeskV2';
import { AIToolsDeskV2 } from './ai-tools/AIToolsDeskV2';
import { ModuleBrowserDeskV2 } from './modules/ModuleBrowserDeskV2';
import { HomebrewDeskV2 } from './homebrew/HomebrewDeskV2';
import { SessionNotesView } from './sessions/SessionNotesView';
import { CampaignTimeline } from './timeline/CampaignTimeline';
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import { MapTab } from '@/components/session/MapTab';
import { useWorldExplorerContext } from './world/useWorldExplorerContext';

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
 *
 * FIX 5 (Phase 5): No outer padding or max-width is applied here. This component
 * is a pure router — each desk/stage component manages its own internal padding.
 * No responsive padding changes are needed at this level.
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
  const { requestEntityNavigation } = useWorldExplorerContext();

  function openWorldEntity(entityId: string) {
    requestEntityNavigation(entityId);
    onTabChange('world');
  }

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
        onTabChange={onTabChange}
      />
    );
  }

  if (appState === 'prep' && activeTab === 'timeline') {
    return <CampaignTimeline campaignId={campaignId} onTabChange={onTabChange} />;
  }

  if (appState === 'prep' && activeTab === 'sessions') {
    return (
      <SessionsCenterStage
        campaignId={campaignId}
        onOpenWorldEntity={openWorldEntity}
        onTabChange={onTabChange}
      />
    );
  }

  if (appState === 'prep' && activeTab === 'players') {
    return (
      <PlayersCenterStage
        campaignId={campaignId}
        isDM={isDM}
        onOpenWorldEntity={openWorldEntity}
        onOpenArcs={() => onTabChange('arcs')}
        onTabChange={onTabChange}
      />
    );
  }

  if (appState === 'prep' && activeTab === 'encounters') {
    return <EncounterCenterStageV2 campaignId={campaignId} />;
  }

  if (appState === 'prep' && activeTab === 'handouts') {
    return <HandoutsArchiveV2 campaignId={campaignId} isDM={isDM} />;
  }

  if (appState === 'prep' && activeTab === 'calendar') {
    return <InWorldCalendarCenterStage campaignId={campaignId} />;
  }

  if (appState === 'prep' && activeTab === 'rules') {
    return <RulesDeskCenterStage />;
  }

  if (appState === 'prep' && activeTab === 'safety-tools') {
    return <SafetyToolsCenterStage campaignId={campaignId} />;
  }

  if (appState === 'prep' && activeTab === 'random-tables') {
    return <RandomTablesDeskV2 campaignId={campaignId} />;
  }

  if (appState === 'prep' && activeTab === 'downtime') {
    return <DowntimeDeskV2 campaignId={campaignId} />;
  }

  if (appState === 'prep' && activeTab === 'homebrew') {
    return <HomebrewDeskV2 />;
  }

  if (appState === 'prep' && activeTab === 'arcs') {
    return <StoryArcsDeskV2 />;
  }

  if (appState === 'prep' && activeTab === 'trackers') {
    return <TrackersDeskV2 />;
  }

  if (appState === 'prep' && activeTab === 'campaign-health') {
    return <CampaignHealthDeskV2 />;
  }

  if (appState === 'prep' && activeTab === 'economy') {
    return <EconomyDeskV2 />;
  }

  if (appState === 'prep' && activeTab === 'ai-tools') {
    return <AIToolsDeskV2 />;
  }

  if (appState === 'prep' && activeTab === 'modules') {
    return <ModuleBrowserDeskV2 />;
  }

  // ── Play-mode routing (narrative / combat) ───────────────────
  if (appState === 'narrative' || appState === 'combat') {
    // Session notes must check before WORLD_TABS since 'notes' is in both
    if (activeTab === 'session-notes' || activeTab === 'notes') {
      return <SessionNotesView campaignId={campaignId} />;
    }
    if (WORLD_TABS.has(activeTab)) {
      return (
        <WorldCenterStage
          campaignId={campaignId}
          isDM={isDM}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      );
    }
    if (activeTab === 'encounters') {
      return <EncounterCenterStageV2 campaignId={campaignId} />;
    }
    if (activeTab === 'handouts') {
      return <HandoutsArchiveV2 campaignId={campaignId} isDM={isDM} />;
    }
    if (activeTab === 'party') {
      return (
        <PlayersCenterStage
          campaignId={campaignId}
          isDM={isDM}
          onOpenWorldEntity={openWorldEntity}
          onOpenArcs={() => onTabChange('arcs')}
          onTabChange={onTabChange}
        />
      );
    }
    if (activeTab === 'ai' || activeTab === 'ai-tools') {
      return <AIToolsDeskV2 />;
    }
    if (activeTab === 'initiative') {
      return <InitiativeTracker campaignId={campaignId} isDM={isDM} />;
    }
    if (activeTab === 'map') {
      return <MapTab campaignId={campaignId} isDM={isDM} />;
    }
    if (activeTab === 'passive') {
      return renderComingSoon('Passive checks');
    }
  }

  return renderPlaceholder();

  function renderComingSoon(label: string) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p
            className="mb-1 text-sm text-[hsl(38,36%,72%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {label}
          </p>
          <p className="text-xs text-[hsl(30,14%,40%)]">
            Coming soon.
          </p>
        </div>
      </div>
    );
  }

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
            This section is not yet available.
          </p>
        </div>
      </div>
    );
  }
}
