import type { CharacterAttack } from '@/types/campaign';
import type { EnemyAttack } from '@/types/enemy-template';
import type {
  SystemAction,
  SystemActionAdapter,
  SystemActionContext,
  SystemActionRollContext,
  SystemActionRollOutcome,
} from '@/rules/systems/types';

interface DndRollPayload {
  type: 'dnd-attack';
  attackName: string;
  attackBonus: number;
  damageDice?: string;
}

function toDamageDice(attack: CharacterAttack): string {
  const bonus = Number.isFinite(attack.damageBonus) ? attack.damageBonus : 0;
  const sign = bonus >= 0 ? '+' : '';
  return `${attack.damageDice}${bonus !== 0 ? `${sign}${bonus}` : ''}`;
}

function normalizeNpcDamage(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
  return match?.[1]?.replace(/\s+/g, '');
}

function fromCharacterAttacks(characterAttacks: CharacterAttack[]): SystemAction[] {
  return characterAttacks.map((attack) => {
    const payload: DndRollPayload = {
      type: 'dnd-attack',
      attackName: attack.name,
      attackBonus: attack.attackBonus,
      damageDice: toDamageDice(attack),
    };
    const damageSummary = attack.damageType
      ? `${payload.damageDice} ${attack.damageType}`
      : payload.damageDice;
    return {
      id: `pc:${attack.id}`,
      label: attack.name,
      kind: 'attack',
      summary: `${attack.attackBonus >= 0 ? '+' : ''}${attack.attackBonus} to hit${damageSummary ? ` · ${damageSummary}` : ''}`,
      rollLabel: 'Attack',
      rollPayload: payload,
      tags: ['d20'],
    };
  });
}

function fromNpcAttacks(npcAttacks: EnemyAttack[]): SystemAction[] {
  return npcAttacks.map((attack, index) => {
    const payload: DndRollPayload = {
      type: 'dnd-attack',
      attackName: attack.name,
      attackBonus: attack.bonus,
      damageDice: normalizeNpcDamage(attack.damage),
    };
    return {
      id: `npc:${index}:${attack.name}`,
      label: attack.name,
      kind: 'attack',
      summary: `${attack.bonus >= 0 ? '+' : ''}${attack.bonus} to hit${attack.damage ? ` · ${attack.damage}` : ''}`,
      rollLabel: 'Attack',
      rollPayload: payload,
      tags: ['d20'],
    };
  });
}

function fromSystemData(systemData: Record<string, any> | undefined): SystemAction[] {
  const actions = Array.isArray(systemData?.actions) ? systemData.actions : [];
  return actions
    .filter((action): action is Record<string, any> => !!action && typeof action === 'object')
    .map((action, index) => {
      const attackBonus = Number.isFinite(action.attackBonus) ? Number(action.attackBonus) : 0;
      const damageDice = typeof action.damageDice === 'string' ? action.damageDice.trim() : undefined;
      const payload: DndRollPayload = {
        type: 'dnd-attack',
        attackName: String(action.name ?? `Action ${index + 1}`),
        attackBonus,
        damageDice: damageDice || undefined,
      };
      return {
        id: `sys:${index}:${payload.attackName}`,
        label: payload.attackName,
        kind: 'ability',
        summary: `${attackBonus >= 0 ? '+' : ''}${attackBonus} to hit${damageDice ? ` · ${damageDice}` : ''}`,
        rollLabel: 'Roll',
        rollPayload: payload,
        tags: ['systemData'],
      } satisfies SystemAction;
    });
}

export const dnd5eAdapter: SystemActionAdapter = {
  toSystemActions: (context: SystemActionContext) => {
    const characterActions = context.character ? fromCharacterAttacks(context.character.attacks ?? []) : [];
    const templateNpcActions = !context.character && context.template ? fromNpcAttacks(context.template.attacks ?? []) : [];
    const legacyNpcActions = !context.character && (context.legacyNpcAttacks?.length ?? 0) > 0
      ? fromNpcAttacks(context.legacyNpcAttacks ?? [])
      : [];
    const systemDataActions = fromSystemData(context.entry.systemData);
    return [...characterActions, ...templateNpcActions, ...legacyNpcActions, ...systemDataActions];
  },
  performActionRoll: async (
    action: SystemAction,
    context: SystemActionRollContext,
  ): Promise<SystemActionRollOutcome> => {
    const payload = action.rollPayload as DndRollPayload;
    if (payload?.type !== 'dnd-attack') {
      return { message: 'Unsupported action payload.' };
    }
    const mode = context.options?.mode ?? 'roll';
    if (mode === 'damage') {
      if (!payload.damageDice) return { message: 'No damage dice configured.' };
      const damageResult = await context.rollDice({
        dice: payload.damageDice,
        purpose: `${context.entry.name}: ${payload.attackName} damage`,
        isPrivate: context.isPrivate,
      });
      return { primaryTotal: damageResult.total, message: `Damage ${damageResult.total}` };
    }

    const attackResult = await context.rollDice({
      dice: `1d20${payload.attackBonus >= 0 ? '+' : ''}${payload.attackBonus}`,
      purpose: `${context.entry.name}: ${payload.attackName} attack`,
      isPrivate: context.isPrivate,
    });

    return {
      primaryTotal: attackResult.total,
      message: `Attack ${attackResult.total}`,
    };
  },
};
