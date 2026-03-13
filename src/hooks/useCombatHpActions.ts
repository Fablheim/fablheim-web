import { useAuth } from '@/context/AuthContext';
import { useCharacters, useUpdateCharacter } from '@/hooks/useCharacters';
import { useUpdateInitiativeEntry } from '@/hooks/useLiveSession';
import type { InitiativeEntry } from '@/types/live-session';
import { applyDamage, applyHeal } from '@/lib/combat-math';

/**
 * HP modification actions that handle the PC-vs-NPC branching:
 * - PCs: update character document via useUpdateCharacter
 * - NPCs: update initiative entry via useUpdateInitiativeEntry
 */
export function useCombatHpActions(campaignId: string) {
  const { user } = useAuth();
  const { data: characters } = useCharacters(campaignId);
  const updateCharacter = useUpdateCharacter();
  const updateEntry = useUpdateInitiativeEntry(campaignId);

  function getCharacterForEntry(entry: InitiativeEntry) {
    return entry.characterId
      ? characters?.find((c) => c._id === entry.characterId)
      : undefined;
  }

  function canEditHp(entry: InitiativeEntry, isDM: boolean): boolean {
    if (isDM) return true;
    const character = getCharacterForEntry(entry);
    return character?.userId != null && character.userId === user?._id;
  }

  function getTempHp(entry: InitiativeEntry): number {
    const character = getCharacterForEntry(entry);
    if (character) return character.hp?.temp ?? 0;
    return entry.tempHp ?? 0;
  }

  async function applyDamageToEntry(entry: InitiativeEntry, amount: number) {
    if (amount <= 0) return;
    const character = getCharacterForEntry(entry);

    if (character) {
      const hp = character.hp ?? { current: 0, max: 0, temp: 0 };
      const next = applyDamage(hp.current, hp.temp ?? 0, amount);
      await updateCharacter.mutateAsync({
        id: character._id,
        campaignId,
        data: { hp: { ...hp, current: next.currentHp, temp: next.tempHp } },
      });
      return;
    }

    const next = applyDamage(entry.currentHp ?? 0, entry.tempHp ?? 0, amount);
    await updateEntry.mutateAsync({
      entryId: entry.id,
      body: { currentHp: next.currentHp, tempHp: next.tempHp },
    });
  }

  async function applyHealToEntry(entry: InitiativeEntry, amount: number) {
    if (amount <= 0) return;
    const character = getCharacterForEntry(entry);

    if (character) {
      const hp = character.hp ?? { current: 0, max: 0, temp: 0 };
      const next = applyHeal(hp.current, hp.max, amount);
      await updateCharacter.mutateAsync({
        id: character._id,
        campaignId,
        data: { hp: { ...hp, current: next.currentHp } },
      });
      return;
    }

    const next = applyHeal(entry.currentHp ?? 0, entry.maxHp ?? 0, amount);
    await updateEntry.mutateAsync({ entryId: entry.id, body: { currentHp: next.currentHp } });
  }

  async function setTempHpForEntry(entry: InitiativeEntry, value: number) {
    if (value < 0) return;
    const character = getCharacterForEntry(entry);

    if (character) {
      const hp = character.hp ?? { current: 0, max: 0, temp: 0 };
      await updateCharacter.mutateAsync({
        id: character._id,
        campaignId,
        data: { hp: { ...hp, temp: value } },
      });
      return;
    }

    await updateEntry.mutateAsync({ entryId: entry.id, body: { tempHp: value } });
  }

  return {
    applyDamage: applyDamageToEntry,
    applyHeal: applyHealToEntry,
    setTempHp: setTempHpForEntry,
    canEditHp,
    getTempHp,
    getCharacterForEntry,
  };
}
