import type { Campaign } from '@/types/campaign';
import { CampaignOverview } from '@/components/campaign/CampaignOverview';
import { QuickActions } from '@/components/campaign/QuickActions';

interface CampaignOverviewPanelProps {
  campaign: Campaign;
}

export function CampaignOverviewPanel({ campaign }: CampaignOverviewPanelProps) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <CampaignOverview campaign={campaign} />
      <QuickActions campaignId={campaign._id} />
    </div>
  );
}
