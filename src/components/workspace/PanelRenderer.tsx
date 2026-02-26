import type { PanelId } from '@/types/workspace';
import type { Campaign } from '@/types/campaign';

// Session components
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import { MapTab } from '@/components/session/MapTab';
import { ChatPanel } from '@/components/session/ChatPanel';
import { SessionNotesTab } from '@/components/session/SessionNotesTab';
import { EncountersTab } from '@/components/session/EncountersTab';
import { EventsFeed } from '@/components/session/EventsFeed';
import { HandoutsTab } from '@/components/session/HandoutsTab';
import { AIToolsTab } from '@/components/session/AIToolsTab';
import { PartyOverview } from '@/components/session/PartyOverview';
import { QuickReference } from '@/components/session/QuickReference';
import DiceRoller from '@/components/session/DiceRoller';

// Page components used as panels
import { AIToolsPage } from '@/pages/AIToolsPage';
import { EncounterPrepPage } from '@/pages/EncounterPrepPage';

// Workspace-specific panels
import { CampaignOverviewPanel } from './panels/CampaignOverviewPanel';
import { SessionRecapPanel } from './panels/SessionRecapPanel';
import { SessionStatisticsPanel } from './panels/SessionStatisticsPanel';
import { NextSessionPanel } from './panels/NextSessionPanel';
import { WorldBrowserPanel } from './panels/WorldBrowserPanel';
import { NotebookPanel } from './panels/NotebookPanel';
import { CharactersPanel } from './panels/CharactersPanel';
import { SessionNotesRecapPanel } from './panels/SessionNotesRecapPanel';
import { CampaignBrainPanel } from './panels/CampaignBrainPanel';

export interface PanelRendererProps {
  panelId: PanelId;
  campaign: Campaign;
  isDM: boolean;
  sessionId?: string;
}

export function PanelRenderer({ panelId, campaign, isDM, sessionId }: PanelRendererProps) {
  const campaignId = campaign._id;

  switch (panelId) {
    // ── Prep ──────────────────────────────────────────────
    case 'campaign-overview':
      return <CampaignOverviewPanel campaign={campaign} />;
    case 'encounter-prep':
      return <EncounterPrepPage campaignId={campaignId} />;
    case 'world-browser':
      return <WorldBrowserPanel campaignId={campaignId} />;
    case 'notebook':
      return <NotebookPanel campaignId={campaignId} />;
    case 'characters':
      return <CharactersPanel campaignId={campaignId} />;
    case 'ai-tools':
      return <AIToolsPage campaignId={campaignId} />;
    case 'campaign-brain':
      return <CampaignBrainPanel campaignId={campaignId} />;

    // ── Live ──────────────────────────────────────────────
    case 'initiative':
      return <InitiativeTracker campaignId={campaignId} isDM={isDM} />;
    case 'map':
      return <MapTab campaignId={campaignId} isDM={isDM} />;
    case 'chat':
      return <ChatPanel campaignId={campaignId} connectedUsers={[]} />;
    case 'session-notes':
      return <SessionNotesTab campaignId={campaignId} />;
    case 'encounters-live':
      return <EncountersTab campaignId={campaignId} isDM={isDM} />;
    case 'events':
      return <EventsFeed campaignId={campaignId} />;
    case 'handouts':
      return <HandoutsTab campaignId={campaignId} isDM={isDM} />;
    case 'ai-tools-live':
      return <AIToolsTab campaignId={campaignId} />;
    case 'party-overview':
      return <PartyOverview campaignId={campaignId} />;
    case 'quick-reference':
      return <QuickReference campaignId={campaignId} />;
    case 'dice-roller':
      return <DiceRoller campaignId={campaignId} />;

    // ── Recap ─────────────────────────────────────────────
    case 'session-recap':
      return <SessionRecapPanel campaignId={campaignId} sessionId={sessionId} />;
    case 'session-statistics':
      return <SessionStatisticsPanel campaignId={campaignId} sessionId={sessionId} />;
    case 'session-notes-recap':
      return <SessionNotesRecapPanel campaignId={campaignId} sessionId={sessionId} />;
    case 'next-session':
      return <NextSessionPanel campaignId={campaignId} />;

    default:
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>Unknown panel: {panelId}</p>
        </div>
      );
  }
}
