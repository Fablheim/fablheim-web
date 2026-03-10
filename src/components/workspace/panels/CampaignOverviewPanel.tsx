import type { Campaign } from '@/types/campaign';
import { useAuth } from '@/context/AuthContext';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { CampaignOverview } from '@/components/campaign/CampaignOverview';
import { QuickActions } from '@/components/campaign/QuickActions';
import { ArcStatusDisplay } from '@/components/campaign/ArcStatusDisplay';
import { WorldStateTrackersDisplay } from '@/components/campaign/WorldStateTrackersDisplay';
import { InvitePanel } from '@/components/campaigns/InvitePanel';

interface CampaignOverviewPanelProps {
  campaign: Campaign;
}

export function CampaignOverviewPanel({ campaign }: CampaignOverviewPanelProps) {
  const { user } = useAuth();
  const { data: accessibleCampaigns } = useAccessibleCampaigns();
  const campaignRole = accessibleCampaigns?.find((c) => c._id === campaign._id)?.role;
  const isDM = campaignRole === 'dm' || campaignRole === 'co_dm' || user?._id === campaign.dmId;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 mkt-hero-stage">
      <CampaignOverview campaign={campaign} />
      <ArcStatusDisplay campaignId={campaign._id} isDM={isDM} />
      <WorldStateTrackersDisplay campaignId={campaign._id} isDM={isDM} />
      {isDM && <InvitePanel campaign={campaign} />}
      <QuickActions campaignId={campaign._id} />
    </div>
  );
}
