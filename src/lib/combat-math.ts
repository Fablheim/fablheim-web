import type { CharacterAttack } from '@/types/campaign';
import type { InitiativeEntry } from '@/types/live-session';
import type { EnemyTemplate } from '@/types/enemy-template';

// ── Action Economy ──────────────────────────────────────────

export type ActionCostType = 'action' | 'bonus' | 'reaction' | 'free';

export interface ActionBudgetState {
  actionUsed: boolean;
  bonusUsed: boolean;
  reactionUsed: boolean;
  movementUsed: number;
  movementMax: number;
}

export const DEFAULT_MOVEMENT_MAX = 30;

export function getDefaultBudget(movementMax = DEFAULT_MOVEMENT_MAX): ActionBudgetState {
  return {
    actionUsed: false,
    bonusUsed: false,
    reactionUsed: false,
    movementUsed: 0,
    movementMax,
  };
}

export function getBudgetForEntry(
  budget: ActionBudgetState | undefined,
  movementMax: number,
): ActionBudgetState {
  if (!budget) return getDefaultBudget(movementMax);
  return {
    ...budget,
    movementMax,
    movementUsed: clamp(budget.movementUsed, 0, movementMax),
  };
}

export function formatActionCostLabel(cost: ActionCostType): string {
  if (cost === 'bonus') return 'Bonus';
  if (cost === 'reaction') return 'Reaction';
  if (cost === 'free') return 'Free';
  return 'Action';
}

// ── HP Math ─────────────────────────────────────────────────

export function applyDamage(
  currentHp: number,
  tempHp: number,
  damage: number,
): { currentHp: number; tempHp: number } {
  const normalizedDamage = Math.max(0, damage);
  const tempAfter = Math.max(0, tempHp - normalizedDamage);
  const remainingDamage = Math.max(0, normalizedDamage - tempHp);
  return {
    currentHp: Math.max(0, currentHp - remainingDamage),
    tempHp: tempAfter,
  };
}

export function applyHeal(
  currentHp: number,
  maxHp: number,
  heal: number,
): { currentHp: number } {
  return {
    currentHp: clamp(currentHp + Math.max(0, heal), 0, Math.max(0, maxHp)),
  };
}

// ── Dice Helpers ────────────────────────────────────────────

export function buildCharacterDamageDice(attack: CharacterAttack): string {
  const bonus = Number.isFinite(attack.damageBonus) ? attack.damageBonus : 0;
  const sign = bonus >= 0 ? '+' : '';
  return `${attack.damageDice}${bonus !== 0 ? `${sign}${bonus}` : ''}`;
}

export function extractDamageDice(damage: string): string | null {
  const match = damage.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
  if (!match) return null;
  return match[1].replace(/\s+/g, '');
}

// ── Combatant Name Resolution ───────────────────────────────

export function normalizeCombatantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+#?\d+$/g, '')
    .trim();
}

export function resolveEnemyTemplateForEntry(
  entry: InitiativeEntry,
  encounterNpcs?: Array<{ name: string }>,
  templates?: EnemyTemplate[],
): EnemyTemplate | undefined {
  if (!templates || templates.length === 0) return undefined;
  const entryName = normalizeCombatantName(entry.name);
  const encounterNpcName = encounterNpcs
    ?.map((npc) => npc.name)
    .find((name) => {
      const normalized = normalizeCombatantName(name);
      return entryName === normalized || entryName.startsWith(`${normalized} `);
    });
  const targetName = normalizeCombatantName(encounterNpcName ?? entry.name);
  return templates.find((template) => normalizeCombatantName(template.name) === targetName);
}

// ── General Utilities ───────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
