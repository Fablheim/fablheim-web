import { useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/api/campaigns';
import { useCampaign } from './useCampaigns';

export function useCampaignStage(campaignId: string) {
  const queryClient = useQueryClient();
  const { data: campaign } = useCampaign(campaignId);

  const stage = campaign?.stage ?? 'prep';

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  };

  const startSession = useMutation({
    mutationFn: (encounterId?: string) =>
      campaignsApi.startSession(campaignId, encounterId),
    onSuccess: invalidate,
  });

  const endSession = useMutation({
    mutationFn: (keyMoments?: string[]) =>
      campaignsApi.endSession(campaignId, keyMoments),
    onSuccess: invalidate,
  });

  const returnToPrep = useMutation({
    mutationFn: () => campaignsApi.returnToPrep(campaignId),
    onSuccess: invalidate,
  });

  return {
    stage,
    isPrep: stage === 'prep',
    isLive: stage === 'live',
    isRecap: stage === 'recap',
    activeSessionId: campaign?.activeSessionId,
    startSession,
    endSession,
    returnToPrep,
    isTransitioning:
      startSession.isPending || endSession.isPending || returnToPrep.isPending,
  };
}
