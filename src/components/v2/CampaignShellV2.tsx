import { useCallback, useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import type { Campaign } from '@/types/campaign';
import type { AppState, CampaignStage } from '@/types/workspace';
import { HeaderV2 } from './HeaderV2';
import { SidebarV2 } from './SidebarV2';
import { CenterStageV2 } from './CenterStageV2';
import { RightPanelV2 } from './RightPanelV2';
import { PlayContextSidebar } from './PlayContextSidebar';
import { BottomDrawerV2 } from './BottomDrawerV2';
import { WorldExplorerProvider } from './world/WorldExplorerContext';
import { EncounterPrepProvider } from './encounters/EncounterPrepContext';
import { CalendarPrepProvider } from './calendar/CalendarPrepContext';
import { RandomTablesProvider } from './random-tables/RandomTablesContext';
import { DowntimeProvider } from './downtime/DowntimeContext';
import { StoryArcsProvider } from './arcs/StoryArcsContext';
import { TrackersProvider } from './trackers/TrackersContext';
import { CampaignHealthProvider } from './campaign-health/CampaignHealthContext';
import { EconomyProvider } from './economy/EconomyContext';
import { AIToolsProvider } from './ai-tools/AIToolsContext';
import { ModulesProvider } from './modules/ModulesContext';
import { NavigationBusProvider } from './NavigationBusContext';
import { HomebrewProvider } from './homebrew/HomebrewContext';
import { SessionWorkspaceStateProvider } from '@/components/session/SessionWorkspaceState';
import InitiativeBanner from '@/components/session/InitiativeBanner';
import { useInitiative } from '@/hooks/useLiveSession';

interface CampaignShellV2Props {
  campaignId: string;
  campaign: Campaign;
  appState: AppState;
  stage: CampaignStage;
  isDM: boolean;
  activeSessionId?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isTransitioning: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  onReturnToPrep: () => void;
}

export function CampaignShellV2({
  campaignId,
  campaign,
  appState,
  stage,
  isDM,
  activeSessionId: _activeSessionId,
  activeTab,
  onTabChange,
  isTransitioning,
  onStartSession,
  onEndSession,
  onReturnToPrep,
}: CampaignShellV2Props) {
  const { data: initiative } = useInitiative(campaignId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isSmall, setIsSmall] = useState(() => window.innerWidth < 1024);
  // FIX 1: mobile brain overlay state — visible only on isSmall screens in prep mode
  const [brainOverlayOpen, setBrainOverlayOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (appState === 'combat' && isSmall) {
      setSidebarOpen(false);
      setRightOpen(false);
    }
  }, [appState, isSmall]);

  useEffect(() => {
    if (appState === 'prep' && activeTab === 'rules') {
      setRightOpen(false);
    }
  }, [appState, activeTab]);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const toggleRight = useCallback(() => setRightOpen((v) => !v), []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[hsl(24,18%,6%)]">
      {renderHeader()}
      {renderBody()}
    </div>
  );

  function renderHeader() {
    return (
      <HeaderV2
        campaignName={campaign.name}
        appState={appState}
        stage={stage}
        isDM={isDM}
        isTransitioning={isTransitioning}
        onStartSession={onStartSession}
        onEndSession={onEndSession}
        onReturnToPrep={onReturnToPrep}
      />
    );
  }

  function renderBody() {
    return (
      <NavigationBusProvider>
      <HomebrewProvider campaignId={campaignId}>
      <WorldExplorerProvider>
      <EncounterPrepProvider campaignId={campaignId}>
      <CalendarPrepProvider campaignId={campaignId}>
      <RandomTablesProvider campaignId={campaignId}>
      <DowntimeProvider campaignId={campaignId}>
      <StoryArcsProvider campaignId={campaignId}>
      <TrackersProvider campaignId={campaignId} isDM={isDM}>
      <CampaignHealthProvider campaignId={campaignId} onTabChange={onTabChange}>
      <EconomyProvider campaignId={campaignId} onTabChange={onTabChange}>
      <AIToolsProvider campaignId={campaignId}>
      <ModulesProvider campaignId={campaignId}>
      <SessionWorkspaceStateProvider initiative={initiative}>
        {appState === 'combat' && (
          <InitiativeBanner campaignId={campaignId} isDM={isDM} />
        )}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {isSmall && sidebarOpen && (
            <div
              className="absolute inset-0 z-20 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <SidebarV2
            appState={appState}
            isDM={isDM}
            activeTab={activeTab}
            onTabChange={onTabChange}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            isSmall={isSmall}
          />

          {renderMain()}

          {!isSmall && appState === 'prep' && (
            <RightPanelV2
              campaignId={campaignId}
              appState={appState}
              activeTab={activeTab}
              isDM={isDM}
              isOpen={rightOpen}
              onToggle={toggleRight}
              onNavigateToEntity={() => onTabChange('world')}
              onTabChange={onTabChange}
            />
          )}

          {!isSmall && appState !== 'prep' && (
            <PlayContextSidebar
              campaignId={campaignId}
              isOpen={rightOpen}
              onToggle={toggleRight}
              onTabChange={onTabChange}
            />
          )}

          {/* FIX 1: Campaign Brain mobile trigger — only visible below 1024px in prep mode */}
          {isSmall && appState === 'prep' && !brainOverlayOpen && (
            <button
              type="button"
              onClick={() => setBrainOverlayOpen(true)}
              className="fixed bottom-14 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[hsla(42,72%,52%,0.38)] bg-[hsl(24,14%,12%)] text-[hsl(42,78%,74%)] shadow-xl transition hover:border-[hsla(42,72%,52%,0.58)] hover:text-[hsl(42,90%,82%)]"
              aria-label="Open Campaign Brain"
            >
              <Brain className="h-5 w-5" />
            </button>
          )}

          {/* FIX 1: Campaign Brain mobile overlay — renders existing RightPanelV2 unchanged */}
          {isSmall && appState === 'prep' && brainOverlayOpen && (
            <>
              <div
                className="fixed inset-0 z-50 bg-black/50"
                onClick={() => setBrainOverlayOpen(false)}
              />
              <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[360px] shadow-2xl">
                <RightPanelV2
                  campaignId={campaignId}
                  appState={appState}
                  activeTab={activeTab}
                  isDM={isDM}
                  isOpen={true}
                  onToggle={() => setBrainOverlayOpen(false)}
                  onNavigateToEntity={() => { onTabChange('world'); setBrainOverlayOpen(false); }}
                  onTabChange={(tab) => { onTabChange(tab); setBrainOverlayOpen(false); }}
                />
              </div>
            </>
          )}
        </div>
      </SessionWorkspaceStateProvider>
      </ModulesProvider>
      </AIToolsProvider>
      </EconomyProvider>
      </CampaignHealthProvider>
      </TrackersProvider>
      </StoryArcsProvider>
      </DowntimeProvider>
      </RandomTablesProvider>
      </CalendarPrepProvider>
      </EncounterPrepProvider>
      </WorldExplorerProvider>
      </HomebrewProvider>
      </NavigationBusProvider>
    );
  }

  function renderMain() {
    return (
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <CenterStageV2
          campaignId={campaignId}
          campaign={campaign}
          appState={appState}
          activeTab={activeTab}
          isDM={isDM}
          onTabChange={onTabChange}
          onStartSession={onStartSession}
        />

        <BottomDrawerV2 campaignId={campaignId} />
      </main>
    );
  }
}
