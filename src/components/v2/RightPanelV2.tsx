import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import type { AppState } from '@/types/workspace';
import { CampaignBrainPanelV2 } from './CampaignBrainPanelV2';
import { EncounterRightPanel } from './encounters/EncounterRightPanel';
import { CalendarRightPanel } from './calendar/CalendarRightPanel';
import { RandomTablesRightPanel } from './random-tables/RandomTablesRightPanel';
import { DowntimeRightPanel } from './downtime/DowntimeRightPanel';
import { StoryArcsRightPanel } from './arcs/StoryArcsRightPanel';
import { TrackersRightPanel } from './trackers/TrackersRightPanel';
import { CampaignHealthRightPanel } from './campaign-health/CampaignHealthRightPanel';
import { EconomyRightPanel } from './economy/EconomyRightPanel';
import { AIToolsRightPanel } from './ai-tools/AIToolsRightPanel';
import { ModulesRightPanel } from './modules/ModulesRightPanel';
import { HomebrewRightPanel } from './homebrew/HomebrewRightPanel';

interface RightPanelV2Props {
  campaignId: string;
  appState: AppState;
  activeTab: string;
  isDM: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onNavigateToEntity?: (entityId: string) => void;
  onTabChange?: (tab: string) => void;
}

const PANEL_LABELS: Record<AppState, string> = {
  prep: 'Campaign Brain',
  narrative: 'Party',
  combat: 'Focus Card',
  recap: 'Session Notes',
};

const TAB_LABELS: Record<string, string> = {
  encounters: 'Encounter Prep',
  calendar: 'Chronicle View',
  'random-tables': 'Table Library',
  downtime: 'Activity Ledger',
  arcs: 'Thread Navigator',
  trackers: 'World State Shelf',
  'campaign-health': 'Campaign Pulse',
  economy: 'Economy',
  'ai-tools': 'AI Tool Library',
  modules: 'Module Library',
  homebrew: 'Homebrew Vault',
};

/**
 * Contextual companion panel — mirrors the sidebar pattern.
 * Open: header + content. Closed: thin rail with toggle.
 */
export function RightPanelV2({ campaignId, appState, activeTab, isOpen, onToggle, onNavigateToEntity, onTabChange }: RightPanelV2Props) {
  if (!isOpen) {
    return renderRail();
  }

  // FIX 3: narrower at 1024px–1279px, full width restored at xl (1280px+)
  return (
    <aside className="flex h-full w-[260px] min-w-[240px] max-w-[300px] xl:w-[340px] xl:min-w-[300px] xl:max-w-[400px] flex-col border-l border-[hsla(32,26%,26%,0.75)] bg-[hsl(24,14%,9%)]">
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
    const label = TAB_LABELS[activeTab] ?? PANEL_LABELS[appState];
    return (
      <div className="flex h-[42px] shrink-0 items-center justify-between border-b border-[hsla(32,26%,26%,0.4)] px-3">
        <h2
          className="text-[11px] uppercase tracking-[0.06em] text-[hsl(38,36%,72%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {label}
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
    if (activeTab === 'encounters') {
      return <EncounterRightPanel campaignId={campaignId} onTabChange={onTabChange} />;
    }
    if (activeTab === 'calendar') {
      return <CalendarRightPanel campaignId={campaignId} />;
    }
    if (activeTab === 'random-tables') {
      return <RandomTablesRightPanel />;
    }
    if (activeTab === 'downtime') {
      return <DowntimeRightPanel />;
    }
    if (activeTab === 'arcs') {
      return <StoryArcsRightPanel />;
    }
    if (activeTab === 'trackers') {
      return <TrackersRightPanel />;
    }
    if (activeTab === 'campaign-health') {
      return <CampaignHealthRightPanel />;
    }
    if (activeTab === 'economy') {
      return <EconomyRightPanel />;
    }
    if (activeTab === 'ai-tools') {
      return <AIToolsRightPanel />;
    }
    if (activeTab === 'modules') {
      return <ModulesRightPanel />;
    }
    if (activeTab === 'homebrew') {
      return <HomebrewRightPanel />;
    }
    return <CampaignBrainPanelV2 campaignId={campaignId} onNavigateToEntity={onNavigateToEntity} />;
  }
}
