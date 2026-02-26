import { useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCampaignStage } from '@/hooks/useCampaignStage';
import { useSessions } from '@/hooks/useSessions';
import { PrepSidebar } from './PrepSidebar';
import { LiveSidebar } from './LiveSidebar';
import { RecapSidebar } from './RecapSidebar';
import type { PanelId } from '@/types/workspace';
import type { Campaign } from '@/types/campaign';

interface StageSidebarProps {
  campaignId: string;
  campaign: Campaign;
  activePanelIds: PanelId[];
  onAddPanel: (panelId: PanelId) => void;
}

export function StageSidebar({
  campaignId,
  campaign,
  activePanelIds,
  onAddPanel,
}: StageSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const {
    stage,
    isPrep,
    isLive,
    isRecap,
    activeSessionId,
    startSession,
    endSession,
    returnToPrep,
    isTransitioning,
  } = useCampaignStage(campaignId);

  const isDM = campaign.dmId === user?._id;

  const { data: sessions } = useSessions(campaignId);
  const activeSession = sessions?.find((s) => s._id === activeSessionId);

  const handleStartSession = () =>
    startSession.mutate(undefined, {
      onError: (err) => toast.error(`Failed to start session: ${(err as Error).message}`),
    });
  const handleEndSession = () =>
    endSession.mutate(undefined, {
      onError: (err) => toast.error(`Failed to end session: ${(err as Error).message}`),
    });
  const handleReturnToPrep = () =>
    returnToPrep.mutate(undefined, {
      onError: (err) => toast.error(`Failed to return to prep: ${(err as Error).message}`),
    });

  if (collapsed) {
    return renderCollapsed();
  }

  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-[hsla(38,50%,30%,0.15)] bg-[hsl(24,20%,8%)] texture-wood">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[hsla(38,40%,30%,0.12)] px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/fablheim-logo.png" alt="" className="h-6 w-6 rounded-sm shadow-glow-sm" />
          <span className="truncate font-[Cinzel] text-xs font-semibold text-foreground">
            {campaign.name}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1 transition-colors hover:bg-muted shrink-0"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Stage Content */}
      {renderStageContent()}

      {/* User Footer */}
      {renderUserFooter()}
    </div>
  );

  function renderStageContent() {
    if (isPrep) {
      return (
        <PrepSidebar
          campaignId={campaignId}
          onAddPanel={onAddPanel}
          activePanelIds={activePanelIds}
          onStartSession={handleStartSession}
          isTransitioning={isTransitioning}
          isDM={isDM}
        />
      );
    }

    if (isLive) {
      return (
        <LiveSidebar
          campaignId={campaignId}
          onAddPanel={onAddPanel}
          activePanelIds={activePanelIds}
          onEndSession={handleEndSession}
          isTransitioning={isTransitioning}
          isDM={isDM}
          sessionStartedAt={activeSession?.startedAt}
        />
      );
    }

    if (isRecap) {
      return (
        <RecapSidebar
          campaignId={campaignId}
          onAddPanel={onAddPanel}
          activePanelIds={activePanelIds}
          onReturnToPrep={handleReturnToPrep}
          isTransitioning={isTransitioning}
          isDM={isDM}
          activeSession={activeSession}
        />
      );
    }

    return null;
  }

  function renderUserFooter() {
    return (
      <div className="border-t border-[hsla(38,40%,30%,0.12)] p-2">
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-blood/15 hover:text-[hsl(0,60%,55%)]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    );
  }

  function renderCollapsed() {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center border-r border-[hsla(38,50%,30%,0.15)] bg-[hsl(24,20%,8%)] texture-wood py-2">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-md p-1.5 transition-colors hover:bg-muted mb-2"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Stage indicator dot */}
        <div
          className={`h-2 w-2 rounded-full mt-1 ${
            isLive
              ? 'bg-[hsl(0,70%,50%)] animate-pulse'
              : isRecap
                ? 'bg-[hsl(142,50%,50%)]'
                : 'bg-[hsl(220,50%,55%)]'
          }`}
          title={`Stage: ${stage}`}
        />
      </div>
    );
  }
}
