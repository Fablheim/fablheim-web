import { useCallback, useEffect, useState } from 'react';
import type { Campaign } from '@/types/campaign';
import type { AppState, CampaignStage } from '@/types/workspace';
import { HeaderV2 } from './HeaderV2';
import { SidebarV2 } from './SidebarV2';
import { CenterStageV2 } from './CenterStageV2';
import { RightPanelV2 } from './RightPanelV2';
import { BottomDrawerV2 } from './BottomDrawerV2';
import { WorldExplorerProvider } from './world/WorldExplorerContext';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isSmall, setIsSmall] = useState(() => window.innerWidth < 1024);

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
    if (appState === 'prep' && (activeTab === 'rules' || activeTab === 'ai-tools' || activeTab === 'modules')) {
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
      <WorldExplorerProvider>
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

          {!isSmall && (
            <RightPanelV2
              campaignId={campaignId}
              appState={appState}
              isDM={isDM}
              isOpen={rightOpen}
              onToggle={toggleRight}
            />
          )}
        </div>
      </WorldExplorerProvider>
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
