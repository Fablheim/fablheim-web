import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handoutsApi } from '@/api/handouts';

export function useHandouts(campaignId: string, role?: string) {
  return useQuery({
    queryKey: ['handouts', campaignId, role ?? 'all'],
    queryFn: () => handoutsApi.list(campaignId, role),
    enabled: !!campaignId,
  });
}

export function useCreateHandout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: { title: string; type: string; content?: string; imageUrl?: string; visibleTo?: string };
    }) => handoutsApi.create(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['handouts', v.campaignId] });
    },
  });
}

export function useShareHandout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, handoutId }: { campaignId: string; handoutId: string }) =>
      handoutsApi.share(campaignId, handoutId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['handouts', v.campaignId] });
    },
  });
}

export function useUnshareHandout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, handoutId }: { campaignId: string; handoutId: string }) =>
      handoutsApi.unshare(campaignId, handoutId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['handouts', v.campaignId] });
    },
  });
}

export function useUpdateHandout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      handoutId,
      data,
    }: {
      campaignId: string;
      handoutId: string;
      data: { title?: string; content?: string; imageUrl?: string };
    }) => handoutsApi.update(campaignId, handoutId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['handouts', v.campaignId] });
    },
  });
}

export function useDeleteHandout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, handoutId }: { campaignId: string; handoutId: string }) =>
      handoutsApi.delete(campaignId, handoutId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['handouts', v.campaignId] });
    },
  });
}
