import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alliesApi } from '@/api/allies';
import { useSocketEvent } from '@/hooks/useSocket';
import type { AllyHp, CreateAllyPayload, UpdateAllyPayload } from '@/types/campaign';

export function useAllies(campaignId: string) {
  return useQuery({
    queryKey: ['allies', campaignId],
    queryFn: () => alliesApi.list(campaignId),
    enabled: !!campaignId,
  });
}

export function useAddAlly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateAllyPayload }) =>
      alliesApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allies', variables.campaignId] });
    },
  });
}

export function useUpdateAlly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      id,
      data,
    }: {
      campaignId: string;
      id: string;
      data: UpdateAllyPayload;
    }) => alliesApi.update(campaignId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allies', variables.campaignId] });
    },
  });
}

export function useUpdateAllyHp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      id,
      hp,
    }: {
      campaignId: string;
      id: string;
      hp: AllyHp;
    }) => alliesApi.updateHp(campaignId, id, hp),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allies', variables.campaignId] });
    },
  });
}

export function useRemoveAlly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, id }: { campaignId: string; id: string }) =>
      alliesApi.remove(campaignId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allies', variables.campaignId] });
    },
  });
}

export function useAllySync(campaignId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['allies', campaignId] });
  };
  useSocketEvent('ally:added', invalidate);
  useSocketEvent('ally:updated', invalidate);
  useSocketEvent('ally:removed', invalidate);
}
