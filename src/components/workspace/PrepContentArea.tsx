import { useState } from 'react';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import type { PrepSection } from '@/types/workspace';
import type { Campaign } from '@/types/campaign';
import { CampaignOverviewPanel } from './panels/CampaignOverviewPanel';
import { CampaignBrainPanel } from './panels/CampaignBrainPanel';
import { WorldBrowserPanel } from './panels/WorldBrowserPanel';
import { CharactersPanel } from './panels/CharactersPanel';
import { NPCBrowserPanel } from './panels/NPCBrowserPanel';
import { NotebookPanel } from './panels/NotebookPanel';
import { RulesPanel } from './panels/RulesPanel';
import { SessionsPrepPanel } from './panels/SessionsPrepPanel';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const EncounterPrepPage = lazy(() =>
  import('@/pages/EncounterPrepPage').then((m) => ({ default: m.EncounterPrepPage })),
);
const AIToolsPage = lazy(() =>
  import('@/pages/AIToolsPage').then((m) => ({ default: m.AIToolsPage })),
);
import { ArcsPanel } from './panels/ArcsPanel';
import { TrackersPanel } from './panels/TrackersPanel';
import { PlayerNotesPanel } from './panels/PlayerNotesPanel';

interface PrepContentAreaProps {
  activeSection: PrepSection;
  campaign: Campaign;
  isDM: boolean;
}

export function PrepContentArea({ activeSection, campaign, isDM }: PrepContentAreaProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <div key={activeSection} className="h-full prep-content-fade">
        <Suspense fallback={<LoadingSpinner />}>
          {renderContent()}
        </Suspense>
      </div>
    </div>
  );

  function renderContent() {
    switch (activeSection) {
      case 'overview':
        return <CampaignOverviewPanel campaign={campaign} />;
      case 'world':
        return <WorldBrowserPanel campaignId={campaign._id} />;
      case 'players':
        return <CharactersPanel campaignId={campaign._id} />;
      case 'npcs':
        return <NPCBrowserPanel campaignId={campaign._id} />;
      case 'encounters':
        return <EncounterPrepPage campaignId={campaign._id} />;
      case 'notes':
        return <NotebookPanel campaignId={campaign._id} />;
      case 'sessions':
        return <SessionsPrepPanel campaignId={campaign._id} />;
      case 'ai-tools':
        return <AIToolsWithBrain campaignId={campaign._id} />;
      case 'arcs':
        return <ArcsPanel campaignId={campaign._id} isDM={isDM} />;
      case 'trackers':
        return <TrackersPanel campaignId={campaign._id} isDM={isDM} />;
      case 'my-notes':
        return <PlayerNotesPanel campaignId={campaign._id} />;
      case 'rules':
        return <RulesPanel campaignId={campaign._id} system={campaign.system} />;
      default:
        return null;
    }
  }
}

// ── AI Tools with collapsible Campaign Brain header ─────────

function AIToolsWithBrain({ campaignId }: { campaignId: string }) {
  const [brainOpen, setBrainOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      {renderBrainHeader()}
      <div className="flex-1 overflow-hidden">
        <AIToolsPage campaignId={campaignId} />
      </div>
    </div>
  );

  function renderBrainHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(38,30%,25%,0.2)]">
        <button
          type="button"
          onClick={() => setBrainOpen(!brainOpen)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[hsla(38,30%,30%,0.06)]"
        >
          <Brain className="h-4 w-4 text-primary/70 shrink-0" />
          <span className="font-['IM_Fell_English'] text-sm font-semibold text-foreground">
            Campaign Brain
          </span>
          <span className="ml-1 text-[10px] text-muted-foreground/60">
            AI context & world knowledge
          </span>
          <div className="flex-1" />
          {brainOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>
        {brainOpen && (
          <div className="max-h-[50vh] overflow-y-auto">
            <CampaignBrainPanel campaignId={campaignId} />
          </div>
        )}
      </div>
    );
  }
}
