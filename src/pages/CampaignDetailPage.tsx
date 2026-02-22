import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Radio } from 'lucide-react';
import { useCampaign } from '@/hooks/useCampaigns';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { InvitePanel } from '@/components/campaigns/InvitePanel';
import { systemLabels, statusLabels } from '@/types/campaign';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openTab } = useTabs();
  const { data: campaign, isLoading, error } = useCampaign(id!);

  function handleStartLiveSession() {
    if (!campaign) return;
    openTab({
      title: `Live: ${campaign.name}`,
      path: `/app/campaigns/${campaign._id}/live`,
      content: resolveRouteContent(`/app/campaigns/${campaign._id}/live`, `Live: ${campaign.name}`),
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <p className="font-medium text-destructive">Failed to load campaign</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as Error)?.message ?? 'Campaign not found'}
          </p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/app/campaigns')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={campaign.name}
      subtitle={campaign.setting || undefined}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/app/campaigns')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleStartLiveSession}
            className="btn-emboss shimmer-gold"
          >
            <Radio className="mr-2 h-4 w-4" />
            Start Live Session
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Campaign info */}
        <div className="rounded-lg border border-border bg-card p-6 tavern-card texture-parchment iron-brackets">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-brass/20 px-2 py-0.5 text-xs font-medium text-brass">
              {systemLabels[campaign.system]}
            </span>
            <span className="inline-flex items-center rounded-md bg-forest/20 px-2 py-0.5 text-xs font-medium text-forest">
              {statusLabels[campaign.status]}
            </span>
          </div>
          {campaign.description && (
            <p className="mt-3 text-base text-muted-foreground font-['IM_Fell_English'] italic">{campaign.description}</p>
          )}
        </div>

        {/* Invite panel */}
        <InvitePanel campaign={campaign} />
      </div>
    </PageContainer>
  );
}
