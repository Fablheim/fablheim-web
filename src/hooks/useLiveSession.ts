import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liveSessionApi } from '@/api/live-session';
import type { RollDiceRequest, AddInitiativeEntryRequest, UpdateInitiativeEntryRequest } from '@/types/live-session';

export function useInitiative(campaignId: string) {
  return useQuery({
    queryKey: ['initiative', campaignId],
    queryFn: () => liveSessionApi.getInitiative(campaignId),
    enabled: !!campaignId,
  });
}

export function useDiceHistory(campaignId: string) {
  return useQuery({
    queryKey: ['dice-history', campaignId],
    queryFn: () => liveSessionApi.getDiceHistory(campaignId),
    enabled: !!campaignId,
  });
}

export function useRollDice(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RollDiceRequest) => liveSessionApi.rollDice(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dice-history', campaignId] });
    },
  });
}

export function useAddInitiativeEntry(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddInitiativeEntryRequest) =>
      liveSessionApi.addInitiativeEntry(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useUpdateInitiativeEntry(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, body }: { entryId: string; body: UpdateInitiativeEntryRequest }) =>
      liveSessionApi.updateInitiativeEntry(campaignId, entryId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useRemoveInitiativeEntry(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      liveSessionApi.removeInitiativeEntry(campaignId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useStartCombat(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => liveSessionApi.startCombat(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useNextTurn(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => liveSessionApi.nextTurn(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}

export function useEndCombat(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => liveSessionApi.endCombat(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    },
  });
}
