import { useParams } from 'react-router-dom';
import { useCampaign } from '@/hooks/useCampaigns';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useAuth } from '@/context/AuthContext';
import { useCampaignStage } from '@/hooks/useCampaignStage';
import { useAppState } from '@/components/shell/useAppState';
import { useSidebarTab } from '@/hooks/useSidebarTab';
import { CampaignShellV2 } from '@/components/v2/CampaignShellV2';

export function CampaignPageV2() {
  const { id } = useParams<{ id: string }>();
  const campaignId = id!;
  const { user } = useAuth();
  const { data: campaign, isLoading, error } = useCampaign(campaignId);
  const { data: accessibleCampaigns } = useAccessibleCampaigns();
  const { stage, activeSessionId, startSession, endSession, returnToPrep, isTransitioning } =
    useCampaignStage(campaignId);
  const { appState } = useAppState(campaignId);
  const { activeTab, setActiveTab } = useSidebarTab(campaignId, appState, isDM());

  function isDM(): boolean {
    const role = accessibleCampaigns?.find((c) => c._id === campaignId)?.role;
    return role === 'dm' || role === 'co_dm' || campaign?.dmId === user?._id;
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[hsl(24,18%,6%)]">
        <p className="text-sm text-[hsl(30,12%,58%)]">Loading campaign…</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex h-full items-center justify-center bg-[hsl(24,18%,6%)]">
        <p className="text-sm text-[hsl(0,62%,58%)]">
          {(error as Error)?.message ?? 'Campaign not found'}
        </p>
      </div>
    );
  }

  return (
    <CampaignShellV2
      campaignId={campaignId}
      campaign={campaign}
      appState={appState}
      stage={stage}
      isDM={isDM()}
      activeSessionId={activeSessionId}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isTransitioning={isTransitioning}
      onStartSession={() => startSession.mutate(undefined)}
      onEndSession={() => endSession.mutate(undefined)}
      onReturnToPrep={() => returnToPrep.mutate(undefined)}
    />
  );
}
