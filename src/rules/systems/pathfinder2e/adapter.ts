import type { CharacterAttack } from '@/types/campaign';
import type { EnemyAttack } from '@/types/enemy-template';
import type {
  DegreeOfSuccess,
  SystemAction,
  SystemActionAdapter,
  SystemActionContext,
  SystemActionRollContext,
  SystemActionRollOutcome,
} from '@/rules/systems/types';

/**
 * PF2e degrees of success: compare total vs DC, then adjust for nat 20/1.
 * Returns undefined when DC is unknown (DM resolves manually).
 */
export function pf2eDegreeOfSuccess(total: number, nat: number, dc?: number): DegreeOfSuccess | undefined {
  if (dc == null) return undefined;
  let degree: DegreeOfSuccess;
  if (total >= dc + 10) degree = 'critical-success';
  else if (total >= dc) degree = 'success';
  else if (total <= dc - 10) degree = 'critical-failure';
  else degree = 'failure';
  // Nat 20 upgrades one step, nat 1 downgrades one step
  if (nat === 20) degree = upgradeDegree(degree);
  if (nat === 1) degree = downgradeDegree(degree);
  return degree;
}

const DEGREE_ORDER: DegreeOfSuccess[] = ['critical-failure', 'failure', 'success', 'critical-success'];
function upgradeDegree(d: DegreeOfSuccess): DegreeOfSuccess {
  const i = DEGREE_ORDER.indexOf(d);
  return DEGREE_ORDER[Math.min(i + 1, 3)];
}
function downgradeDegree(d: DegreeOfSuccess): DegreeOfSuccess {
  const i = DEGREE_ORDER.indexOf(d);
  return DEGREE_ORDER[Math.max(i - 1, 0)];
}

interface Pf2eRollPayload {
  type: 'pf2e-strike';
  strikeName: string;
  attackBonus: number;
  damageDice?: string;
}

function characterStrikes(attacks: CharacterAttack[]): SystemAction[] {
  return attacks.map((attack) => {
    const damageDice = `${attack.damageDice}${attack.damageBonus ? `${attack.damageBonus >= 0 ? '+' : ''}${attack.damageBonus}` : ''}`;
    return {
      id: `pc:${attack.id}`,
      label: attack.name,
      kind: 'attack',
      summary: `${attack.attackBonus >= 0 ? '+' : ''}${attack.attackBonus} strike${damageDice ? ` · ${damageDice}` : ''}`,
      rollLabel: 'Strike',
      rollPayload: {
        type: 'pf2e-strike',
        strikeName: attack.name,
        attackBonus: attack.attackBonus,
        damageDice,
      } satisfies Pf2eRollPayload,
      tags: ['pf2e', 'strike'],
    };
  });
}

function npcStrikes(attacks: EnemyAttack[]): SystemAction[] {
  return attacks.map((attack, index) => {
    const damageMatch = attack.damage?.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
    return {
      id: `npc:${index}:${attack.name}`,
      label: attack.name,
      kind: 'attack',
      summary: `${attack.bonus >= 0 ? '+' : ''}${attack.bonus} strike${attack.damage ? ` · ${attack.damage}` : ''}`,
      rollLabel: 'Strike',
      rollPayload: {
        type: 'pf2e-strike',
        strikeName: attack.name,
        attackBonus: attack.bonus,
        damageDice: damageMatch?.[1]?.replace(/\s+/g, ''),
      } satisfies Pf2eRollPayload,
      tags: ['pf2e', 'strike'],
    };
  });
}

export const pathfinder2eAdapter: SystemActionAdapter = {
  toSystemActions: (context: SystemActionContext) => {
    if (context.character) return characterStrikes(context.character.attacks ?? []);
    const templateActions = context.template ? npcStrikes(context.template.attacks ?? []) : [];
    const legacyActions = (context.legacyNpcAttacks?.length ?? 0) > 0
      ? npcStrikes(context.legacyNpcAttacks ?? [])
      : [];
    return [...templateActions, ...legacyActions];
  },
  performActionRoll: async (
    action: SystemAction,
    context: SystemActionRollContext,
  ): Promise<SystemActionRollOutcome> => {
    const payload = action.rollPayload as Pf2eRollPayload;
    if (payload?.type !== 'pf2e-strike') {
      return { message: 'Unsupported action payload.' };
    }

    const mapPenalty = context.options?.mapPenalty ?? 0;
    const adjustedBonus = payload.attackBonus + mapPenalty;
    const mode = context.options?.mode ?? 'roll';

    if (mode === 'damage') {
      if (!payload.damageDice) return { message: 'No damage dice configured.' };
      const damage = await context.rollDice({
        dice: payload.damageDice,
        purpose: `${context.entry.name}: ${payload.strikeName} damage`,
        isPrivate: context.isPrivate,
      });
      return { primaryTotal: damage.total, message: `Damage ${damage.total}` };
    }

    const strike = await context.rollDice({
      dice: `1d20${adjustedBonus >= 0 ? '+' : ''}${adjustedBonus}`,
      purpose: `${context.entry.name}: ${payload.strikeName} strike${mapPenalty !== 0 ? ` (MAP ${mapPenalty})` : ''}`,
      isPrivate: context.isPrivate,
    });

    const nat = strike.rolls[0] ?? 0;
    const degreeHint = nat === 20
      ? ' · Nat 20 ↑'
      : nat === 1
        ? ' · Nat 1 ↓'
        : '';

    return {
      primaryTotal: strike.total,
      naturalRoll: nat,
      message: `Strike ${strike.total} (d20: ${nat})${degreeHint}`,
    };
  },
};
