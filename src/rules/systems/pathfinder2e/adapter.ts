import type { CharacterAttack } from '@/types/campaign';
import type { EnemyAttack } from '@/types/enemy-template';
import type {
  SystemAction,
  SystemActionAdapter,
  SystemActionContext,
  SystemActionRollContext,
  SystemActionRollOutcome,
} from '@/rules/systems/types';

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

    return {
      primaryTotal: strike.total,
      message: `Strike ${strike.total}`,
    };
  },
};
