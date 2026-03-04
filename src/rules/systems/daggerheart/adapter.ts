import type {
  SystemAction,
  SystemActionAdapter,
  SystemActionContext,
  SystemActionRollContext,
  SystemActionRollOutcome,
} from '@/rules/systems/types';

interface DaggerheartRollPayload {
  type: 'daggerheart-roll';
  actionName: string;
  dice: string;
}

function resolveDaggerheartActions(context: SystemActionContext): SystemAction[] {
  const actionSource = Array.isArray(context.entry.systemData?.actions)
    ? context.entry.systemData.actions
    : [];
  const mapped = actionSource
    .filter((item): item is Record<string, any> => !!item && typeof item === 'object')
    .map((item, index) => {
      const label = String(item.label ?? item.name ?? `Action ${index + 1}`);
      const dice = typeof item.dice === 'string' && item.dice.trim().length > 0 ? item.dice.trim() : '1d12';
      return {
        id: `daggerheart:sys:${index}:${label}`,
        label,
        kind: 'custom',
        summary: dice,
        rollLabel: 'Strike',
        rollPayload: {
          type: 'daggerheart-roll',
          actionName: label,
          dice,
        } satisfies DaggerheartRollPayload,
        tags: ['daggerheart'],
      } satisfies SystemAction;
    });

  if (mapped.length > 0) return mapped;
  return [
    {
      id: 'daggerheart:strike',
      label: 'Strike',
      kind: 'attack',
      summary: 'System roll',
      rollLabel: 'Strike',
      rollPayload: {
        type: 'daggerheart-roll',
        actionName: 'Strike',
        dice: '1d12',
      } satisfies DaggerheartRollPayload,
      tags: ['daggerheart'],
    },
  ];
}

export const daggerheartAdapter: SystemActionAdapter = {
  toSystemActions: (context: SystemActionContext) => resolveDaggerheartActions(context),
  performActionRoll: async (
    action: SystemAction,
    context: SystemActionRollContext,
  ): Promise<SystemActionRollOutcome> => {
    const payload = action.rollPayload as DaggerheartRollPayload;
    if (payload?.type !== 'daggerheart-roll') {
      return { message: 'Unsupported action payload.' };
    }
    const result = await context.rollDice({
      dice: payload.dice,
      purpose: `${context.entry.name}: ${payload.actionName}`,
      isPrivate: context.isPrivate,
    });
    return { primaryTotal: result.total, message: `${payload.actionName} ${result.total}` };
  },
};
