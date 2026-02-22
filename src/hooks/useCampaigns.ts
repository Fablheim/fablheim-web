import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/api/campaigns';
import type { CreateCampaignPayload, UpdateCampaignPayload } from '@/types/campaign';

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list(),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => campaignsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignPayload) => campaignsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignPayload }) =>
      campaignsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
