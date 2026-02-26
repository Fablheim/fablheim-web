import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spellsApi } from '@/api/spells';
import type { LearnSpellPayload, SpellQuery } from '@/types/spell';

export function useSpells(query?: SpellQuery) {
  return useQuery({
    queryKey: ['spells', query],
    queryFn: () => spellsApi.list(query),
  });
}

export function useSpell(id: string) {
  return useQuery({
    queryKey: ['spells', 'detail', id],
    queryFn: () => spellsApi.get(id),
    enabled: !!id,
  });
}

export function useCharacterSpells(characterId?: string) {
  return useQuery({
    queryKey: ['character-spells', characterId],
    queryFn: () => spellsApi.getCharacterSpells(characterId!),
    enabled: !!characterId,
  });
}

export function useLearnSpell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LearnSpellPayload) => spellsApi.learnSpell(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['character-spells', variables.characterId],
      });
    },
  });
}

export function useForgetSpell(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterSpellId: string) =>
      spellsApi.forgetSpell(characterSpellId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['character-spells', characterId],
      });
    },
  });
}

export function usePrepareSpell(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterSpellId,
      isPrepared,
    }: {
      characterSpellId: string;
      isPrepared: boolean;
    }) => spellsApi.prepareSpell(characterSpellId, isPrepared),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['character-spells', characterId],
      });
    },
  });
}
