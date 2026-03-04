import type {
  SystemAction,
  SystemActionAdapter,
  SystemActionContext,
  SystemActionRollContext,
  SystemActionRollOutcome,
} from '@/rules/systems/types';

interface FateRollPayload {
  type: 'fate-action';
  actionName: string;
  baseModifier: number;
}

const FATE_ACTIONS = [
  { id: 'attack', label: 'Attack' },
  { id: 'overcome', label: 'Overcome' },
  { id: 'create-advantage', label: 'Create Advantage' },
  { id: 'defend', label: 'Defend' },
];

function resolveSkillModifier(context: SystemActionContext): number {
  const fromCharacter = context.character?.systemData?.skills;
  if (fromCharacter && typeof fromCharacter === 'object') {
    const firstSkillValue = Object.values(fromCharacter).find((value) => Number.isFinite(Number(value)));
    if (firstSkillValue != null) return Number(firstSkillValue);
  }
  const fromEntry = context.entry.systemData?.skills;
  if (fromEntry && typeof fromEntry === 'object') {
    const firstSkillValue = Object.values(fromEntry).find((value) => Number.isFinite(Number(value)));
    if (firstSkillValue != null) return Number(firstSkillValue);
  }
  return 0;
}

export const fateAdapter: SystemActionAdapter = {
  toSystemActions: (context: SystemActionContext): SystemAction[] => {
    const base = resolveSkillModifier(context);
    return FATE_ACTIONS.map((action) => ({
      id: `fate:${action.id}`,
      label: action.label,
      kind: 'ability',
      summary: `4dF ${base >= 0 ? '+' : ''}${base}`,
      rollLabel: 'Roll',
      rollPayload: {
        type: 'fate-action',
        actionName: action.label,
        baseModifier: base,
      } satisfies FateRollPayload,
      tags: ['fate'],
    }));
  },
  performActionRoll: async (
    action: SystemAction,
    context: SystemActionRollContext,
  ): Promise<SystemActionRollOutcome> => {
    const payload = action.rollPayload as FateRollPayload;
    if (payload?.type !== 'fate-action') {
      return { message: 'Unsupported action payload.' };
    }
    const modifier = payload.baseModifier + (context.options?.modifier ?? 0);
    const modPart = modifier !== 0 ? `${modifier >= 0 ? '+' : ''}${modifier}` : '';
    // 4dF approximated as 4d3-8 in the current dice engine.
    const result = await context.rollDice({
      dice: `4d3-8${modPart}`,
      purpose: `${context.entry.name}: ${payload.actionName}`,
      isPrivate: context.isPrivate,
    });
    return { primaryTotal: result.total, message: `${payload.actionName} ${result.total}` };
  },
};
