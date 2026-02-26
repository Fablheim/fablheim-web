import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressionApi } from '@/api/progression';
import type { AwardXPPayload, PartyXPPayload } from '@/types/progression';

export function useProgression(characterId?: string) {
  return useQuery({
    queryKey: ['progression', characterId],
    queryFn: () => progressionApi.getProgression(characterId!),
    enabled: !!characterId,
  });
}

export function useAwardXP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { characterId: string; payload: AwardXPPayload }) =>
      progressionApi.awardXP(variables.characterId, variables.payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progression', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters', 'detail', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useSetXP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { characterId: string; xp: number }) =>
      progressionApi.setXP(variables.characterId, variables.xp),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progression', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters', 'detail', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useSetLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { characterId: string; level: number }) =>
      progressionApi.setLevel(variables.characterId, variables.level),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progression', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters', 'detail', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useAwardPartyXP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PartyXPPayload) =>
      progressionApi.awardPartyXP(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression'] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}
