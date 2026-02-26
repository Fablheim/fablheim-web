import { useMutation, useQueryClient } from '@tanstack/react-query';
import { charactersApi } from '@/api/characters';
import type { CharacterAttack, AttackRollResult, AbilityRollResult } from '@/types/campaign';

/** Shared onSuccess helper: invalidates character detail + campaign list */
function useCharacterCombatMutation<TVariables>(
  mutationFn: (vars: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      const id = (variables as Record<string, unknown>).id as string;
      queryClient.invalidateQueries({ queryKey: ['characters', 'detail', id] });
    },
  });
}

export function useTakeDamage() {
  return useCharacterCombatMutation(
    ({ id, amount, type }: { id: string; amount: number; type?: string }) =>
      charactersApi.takeDamage(id, amount, type),
  );
}

export function useHeal() {
  return useCharacterCombatMutation(
    ({ id, amount }: { id: string; amount: number }) =>
      charactersApi.heal(id, amount),
  );
}

export function useAddTempHP() {
  return useCharacterCombatMutation(
    ({ id, amount }: { id: string; amount: number }) =>
      charactersApi.addTempHP(id, amount),
  );
}

export function useUpdateHP() {
  return useCharacterCombatMutation(
    ({ id, hp }: { id: string; hp: { current: number; max: number; temp: number } }) =>
      charactersApi.updateHP(id, hp),
  );
}

export function useUpdateAttacks() {
  return useCharacterCombatMutation(
    ({ id, attacks }: { id: string; attacks: CharacterAttack[] }) =>
      charactersApi.updateAttacks(id, attacks),
  );
}

export function useConsumeSpellSlot() {
  return useCharacterCombatMutation(
    ({ id, level }: { id: string; level: number }) =>
      charactersApi.consumeSpellSlot(id, level),
  );
}

export function useRestoreSpellSlot() {
  return useCharacterCombatMutation(
    ({ id, level }: { id: string; level: number }) =>
      charactersApi.restoreSpellSlot(id, level),
  );
}

export function useUpdateConditions() {
  return useCharacterCombatMutation(
    ({ id, conditions }: { id: string; conditions: string[] }) =>
      charactersApi.updateConditions(id, conditions),
  );
}

export function useRollDeathSave() {
  return useCharacterCombatMutation(
    ({ id, result }: { id: string; result: 'success' | 'failure' }) =>
      charactersApi.rollDeathSave(id, result),
  );
}

// ── Roll Actions (return results, don't invalidate character) ──

export function useRollAttack() {
  return useMutation<
    AttackRollResult,
    Error,
    { id: string; attackId: string; campaignId?: string }
  >({
    mutationFn: ({ id, attackId, campaignId }) =>
      charactersApi.rollAttack(id, attackId, campaignId),
  });
}

export function useRollAbility() {
  return useMutation<
    AbilityRollResult,
    Error,
    { id: string; ability: string; type: 'check' | 'save'; campaignId?: string }
  >({
    mutationFn: ({ id, ability, type, campaignId }) =>
      charactersApi.rollAbility(id, ability, type, campaignId),
  });
}
