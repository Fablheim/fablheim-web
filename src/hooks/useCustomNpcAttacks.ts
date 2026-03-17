import { useCallback, useEffect, useState } from 'react';
import type { EnemyAttack } from '@/types/creature-template';
import { normalizeCombatantName } from '@/lib/combat-math';

function getStorageKey(campaignId: string, combatantName: string): string {
  return `${campaignId}:${normalizeCombatantName(combatantName)}`;
}

function loadAttacks(key: string): EnemyAttack[] {
  try {
    const raw = localStorage.getItem('fablheim:npc-custom-attacks');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, EnemyAttack[]>;
    return (parsed[key] ?? []).map((attack) => ({
      ...attack,
      actionCost: attack.actionCost ?? 'action',
    }));
  } catch {
    return [];
  }
}

function saveAttacks(key: string, attacks: EnemyAttack[]): void {
  try {
    const raw = localStorage.getItem('fablheim:npc-custom-attacks');
    const parsed = raw ? (JSON.parse(raw) as Record<string, EnemyAttack[]>) : {};
    parsed[key] = attacks.map((attack) => ({
      name: attack.name.trim(),
      bonus: Number.isFinite(attack.bonus) ? attack.bonus : 0,
      damage: attack.damage.trim(),
      actionCost: attack.actionCost ?? 'action',
      range: attack.range?.trim() || undefined,
      description: attack.description?.trim() || undefined,
    }));
    localStorage.setItem('fablheim:npc-custom-attacks', JSON.stringify(parsed));
  } catch {
    // Ignore localStorage failures
  }
}

/**
 * Manages custom NPC attacks stored per-combatant in localStorage.
 * These are DM-defined attacks that supplement the enemy template.
 */
export function useCustomNpcAttacks(campaignId: string, combatantName: string) {
  const key = getStorageKey(campaignId, combatantName);
  const [customAttacks, setCustomAttacks] = useState<EnemyAttack[]>(() => loadAttacks(key));

  // Reload when combatant changes
  useEffect(() => {
    setCustomAttacks(loadAttacks(key));
  }, [key]);

  const addCustomAttack = useCallback(
    (attack: Omit<EnemyAttack, 'bonus'> & { bonus: number }) => {
      setCustomAttacks((prev) => {
        const next = [...prev, attack as EnemyAttack];
        saveAttacks(key, next);
        return next;
      });
    },
    [key],
  );

  const removeCustomAttack = useCallback(
    (index: number) => {
      setCustomAttacks((prev) => {
        const next = prev.filter((_, i) => i !== index);
        saveAttacks(key, next);
        return next;
      });
    },
    [key],
  );

  return {
    customAttacks,
    addCustomAttack,
    removeCustomAttack,
  };
}
