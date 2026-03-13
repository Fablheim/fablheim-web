import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { downtimeApi } from '@/api/downtime';
import type { CreateDowntimePayload, UpdateDowntimePayload } from '@/types/downtime';

export function useDowntimeActivities(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'downtime'],
    queryFn: () => downtimeApi.list(campaignId),
    enabled: !!campaignId,
  });
}

export function useCreateDowntime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: CreateDowntimePayload;
    }) => downtimeApi.create(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'downtime'],
      });
    },
  });
}

export function useUpdateDowntime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      activityId,
      data,
    }: {
      campaignId: string;
      activityId: string;
      data: UpdateDowntimePayload;
    }) => downtimeApi.update(campaignId, activityId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'downtime'],
      });
    },
  });
}

export function useDeleteDowntime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      activityId,
    }: {
      campaignId: string;
      activityId: string;
    }) => downtimeApi.remove(campaignId, activityId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', v.campaignId, 'downtime'],
      });
    },
  });
}
