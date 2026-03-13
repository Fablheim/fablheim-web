import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useInitiative } from '@/hooks/useLiveSession';
import { useBattleMap } from '@/hooks/useBattleMap';
import { useCharacters } from '@/hooks/useCharacters';
import { useEncounters } from '@/hooks/useEncounters';
import { useEnemyTemplates } from '@/hooks/useEnemyTemplates';
import {
  useSessionWorkspaceState,
} from '@/components/session/SessionWorkspaceState';
import { resolveEnemyTemplateForEntry } from '@/lib/combat-math';

/**
 * Consolidates all combat focus derivation logic:
 * - Who is the focused combatant (selected or current turn)?
 * - What is their character / enemy template?
 * - Is combat active? Is there a tactical map?
 * - Auto-clears invalid selections.
 */
export function useCombatFocus(campaignId: string) {
  const { user } = useAuth();
  const { data: initiative } = useInitiative(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: encounters } = useEncounters(campaignId);
  const { data: enemyTemplates } = useEnemyTemplates();
  const {
    selectedEntryId,
    focusedEntryId,
    selectEntry,
  } = useSessionWorkspaceState();

  const entries = initiative?.entries ?? [];
  const isCombatActive = !!initiative?.isActive;
  const hasTacticalMap = !!(
    battleMap?.isActive ||
    (battleMap?.tokens?.length ?? 0) > 0 ||
    !!battleMap?.backgroundImageUrl
  );

  const currentTurnEntry =
    initiative?.isActive && entries[initiative.currentTurn]
      ? entries[initiative.currentTurn]
      : null;

  const upNextEntry =
    initiative?.isActive && entries.length > 1
      ? entries[(initiative.currentTurn + 1) % entries.length]
      : null;

  const focusedEntry = focusedEntryId
    ? entries.find((entry) => entry.id === focusedEntryId) ?? null
    : null;

  const activeTurnEntry =
    initiative?.isActive && entries[initiative.currentTurn]
      ? entries[initiative.currentTurn]
      : null;

  const entryToDisplay = focusedEntry ?? activeTurnEntry;

  const sourceEncounter = battleMap?.sourceEncounterId
    ? encounters?.find((e) => e._id === battleMap.sourceEncounterId)
    : undefined;

  const focusTemplate =
    entryToDisplay && !entryToDisplay.characterId
      ? resolveEnemyTemplateForEntry(entryToDisplay, sourceEncounter?.npcs, enemyTemplates)
      : undefined;

  const focusCharacter = entryToDisplay?.characterId
    ? characters?.find((c) => c._id === entryToDisplay.characterId)
    : undefined;

  const canEditHp = !!entryToDisplay && (
    !focusCharacter || focusCharacter.userId === user?._id
  );

  const focusTempHp = focusCharacter
    ? (focusCharacter.hp?.temp ?? 0)
    : entryToDisplay
      ? (entryToDisplay.tempHp ?? 0)
      : 0;

  // Auto-clear selection if selected entry no longer exists
  useEffect(() => {
    if (!selectedEntryId || !initiative) return;
    const exists = initiative.entries.some((entry) => entry.id === selectedEntryId);
    if (!exists) {
      selectEntry(null, { pin: true });
    }
  }, [initiative, selectedEntryId, selectEntry]);

  return {
    isCombatActive,
    hasTacticalMap,
    currentTurnEntry,
    upNextEntry,
    focusedEntryId,
    focusedEntry,
    entryToDisplay,
    focusTemplate,
    focusCharacter,
    focusTempHp,
    canEditHp,
    selectEntry,
    initiative,
    battleMap,
  };
}

/** Light version without SessionWorkspaceState dependency — for components outside the provider. */
export function useCombatState(campaignId: string) {
  const { data: initiative } = useInitiative(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);

  const isCombatActive = !!initiative?.isActive;
  const hasTacticalMap = !!(
    battleMap?.isActive ||
    (battleMap?.tokens?.length ?? 0) > 0 ||
    !!battleMap?.backgroundImageUrl
  );

  const entries = initiative?.entries ?? [];
  const currentTurnEntry =
    initiative?.isActive && entries[initiative.currentTurn]
      ? entries[initiative.currentTurn]
      : null;

  return {
    initiative,
    battleMap,
    isCombatActive,
    hasTacticalMap,
    currentTurnEntry,
  };
}
