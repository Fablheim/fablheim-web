import type {
  SystemAction,
  SystemActionAdapter,
  SystemActionContext,
  SystemActionRollContext,
  SystemActionRollOutcome,
} from '@/rules/systems/types';

interface DaggerheartRollPayload {
  type: 'hope-fear-roll';
  actionName: string;
  modifier: number;
}

function resolveDaggerheartActions(context: SystemActionContext): SystemAction[] {
  const actionSource = Array.isArray(context.entry.systemData?.actions)
    ? context.entry.systemData.actions
    : [];
  const mapped = actionSource
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => {
      const label = String(item.label ?? item.name ?? `Action ${index + 1}`);
      const modifier = typeof item.modifier === 'number' ? item.modifier : 0;
      return {
        id: `daggerheart:sys:${index}:${label}`,
        label,
        kind: 'custom',
        summary: modifier >= 0 ? `2d12+${modifier}` : `2d12${modifier}`,
        rollLabel: 'Roll',
        rollPayload: {
          type: 'hope-fear-roll',
          actionName: label,
          modifier,
        } satisfies DaggerheartRollPayload,
        tags: ['daggerheart'],
      } satisfies SystemAction;
    });

  if (mapped.length > 0) return mapped;
  return [
    {
      id: 'daggerheart:action-roll',
      label: 'Action Roll',
      kind: 'custom',
      summary: '2d12 Hope & Fear',
      rollLabel: 'Roll',
      rollPayload: {
        type: 'hope-fear-roll',
        actionName: 'Action Roll',
        modifier: 0,
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
    if (payload?.type !== 'hope-fear-roll') {
      return { message: 'Unsupported action payload.' };
    }

    // Use the dedicated hope-fear roll endpoint if available
    if (context.rollHopeFear) {
      const result = await context.rollHopeFear({
        modifier: payload.modifier,
        purpose: `${context.entry.name}: ${payload.actionName}`,
        isPrivate: context.isPrivate,
      });

      const outcomeLabel = result.isCritical
        ? 'Critical Success!'
        : result.withHope
          ? 'with Hope'
          : 'with Fear';

      return {
        primaryTotal: result.total,
        message: `${payload.actionName} ${result.total} — ${outcomeLabel} (Hope ${result.hopeDie} / Fear ${result.fearDie})`,
      };
    }

    // Fallback: use regular dice roller (should not happen with proper wiring)
    const result = await context.rollDice({
      dice: `2d12${payload.modifier >= 0 ? `+${payload.modifier}` : String(payload.modifier)}`,
      purpose: `${context.entry.name}: ${payload.actionName}`,
      isPrivate: context.isPrivate,
    });
    return { primaryTotal: result.total, message: `${payload.actionName} ${result.total}` };
  },
};
