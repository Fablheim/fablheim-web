import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { passiveChecksApi } from '@/api/passive-checks';
import type { CreatePassiveCheckData, UpdatePassiveCheckData } from '@/api/passive-checks';

export function usePassiveChecks(campaignId: string, status?: string) {
  return useQuery({
    queryKey: ['passive-checks', campaignId, status ?? 'all'],
    queryFn: () => passiveChecksApi.list(campaignId, status),
    enabled: !!campaignId,
  });
}

export function usePassiveCheckSummary(campaignId: string, id: string) {
  return useQuery({
    queryKey: ['passive-checks', campaignId, id, 'summary'],
    queryFn: () => passiveChecksApi.getSummary(campaignId, id),
    enabled: !!campaignId && !!id,
  });
}

export function useCreatePassiveCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: CreatePassiveCheckData;
    }) => passiveChecksApi.create(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['passive-checks', v.campaignId] });
    },
  });
}

export function useUpdatePassiveCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      id,
      data,
    }: {
      campaignId: string;
      id: string;
      data: UpdatePassiveCheckData;
    }) => passiveChecksApi.update(campaignId, id, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['passive-checks', v.campaignId] });
    },
  });
}

export function useDeletePassiveCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, id }: { campaignId: string; id: string }) =>
      passiveChecksApi.remove(campaignId, id),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['passive-checks', v.campaignId] });
    },
  });
}
