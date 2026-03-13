import { lazy, Suspense } from 'react';
import type { AppState } from '@/types/workspace';
import type { InitiativeEntry } from '@/types/live-session';
import { FocusCard } from '@/components/session/FocusCard';
import { PartyOverview } from '@/components/session/PartyOverview';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const CampaignBrainPanel = lazy(() =>
  import('@/components/workspace/panels/CampaignBrainPanel').then((m) => ({
    default: m.CampaignBrainPanel,
  })),
);

interface RightPanelRouterProps {
  campaignId: string;
  appState: AppState;
  isDM: boolean;
  activeTab: string;
  /** The initiative entry to show in the FocusCard during combat. */
  entryOverride?: InitiativeEntry | null;
}

/**
 * Routes the right panel content based on the contextual companion rule:
 * - prep (ai-tools or world tab) → Campaign Brain
 * - narrative → Party Overview
 * - combat → Focus Card
 * - recap → null
 */
export function RightPanelRouter({
  campaignId,
  appState,
  isDM,
  activeTab,
  entryOverride,
}: RightPanelRouterProps) {
  if (appState === 'combat') {
    return (
      <div className="h-full min-h-0">
        <FocusCard campaignId={campaignId} isDM={isDM} entryOverride={entryOverride} />
      </div>
    );
  }

  if (appState === 'narrative') {
    return (
      <div className="h-full overflow-y-auto">
        <PartyOverview campaignId={campaignId} />
      </div>
    );
  }

  if (appState === 'prep' && (activeTab === 'ai-tools' || activeTab === 'world')) {
    return (
      <div className="h-full overflow-y-auto">
        <Suspense fallback={<LoadingSpinner />}>
          <CampaignBrainPanel campaignId={campaignId} />
        </Suspense>
      </div>
    );
  }

  return null;
}
