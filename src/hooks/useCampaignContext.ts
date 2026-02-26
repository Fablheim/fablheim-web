import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignContextApi } from '@/api/campaign-context';
import type { CampaignContext, UpdateCampaignContextPayload } from '@/types/campaign-context';

export function useGetCampaignContext(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-context', campaignId],
    queryFn: () => campaignContextApi.get(campaignId),
    enabled: !!campaignId,
  });
}

export function useUpdateCampaignContext(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCampaignContextPayload) =>
      campaignContextApi.update(campaignId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: ['campaign-context', campaignId],
      });

      const previous = queryClient.getQueryData<CampaignContext>([
        'campaign-context',
        campaignId,
      ]);

      if (previous) {
        queryClient.setQueryData<CampaignContext>(
          ['campaign-context', campaignId],
          { ...previous, ...payload },
        );
      }

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['campaign-context', campaignId],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-context', campaignId],
      });
    },
  });
}
