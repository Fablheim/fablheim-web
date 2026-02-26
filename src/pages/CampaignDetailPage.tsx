import { useParams, useNavigate } from 'react-router-dom';
import { useCampaign } from '@/hooks/useCampaigns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignWorkspace } from '@/components/workspace/CampaignWorkspace';

interface CampaignDetailPageProps {
  campaignId?: string;
}

export function CampaignDetailPage({ campaignId: propId }: CampaignDetailPageProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propId || paramId!;
  const navigate = useNavigate();
  const { data: campaign, isLoading, error } = useCampaign(id);

  if (isLoading) {
    return <LoadingSpinner message="Loading campaign..." />;
  }

  if (error || !campaign) {
    return (
      <PageContainer>
        <ErrorMessage
          title="Failed to load campaign"
          message={(error as Error)?.message ?? 'Campaign not found'}
          onRetry={() => navigate('/app/campaigns')}
        />
      </PageContainer>
    );
  }

  return <CampaignWorkspace campaignId={id} campaign={campaign} />;
}
