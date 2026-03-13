import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useInitiative } from '@/hooks/useLiveSession';
import { useCharacters } from '@/hooks/useCharacters';
import {
  type ActionBudgetState,
  type ActionCostType,
  DEFAULT_MOVEMENT_MAX,
  formatActionCostLabel,
  getBudgetForEntry,
} from '@/lib/combat-math';

/**
 * Manages per-combatant action economy (action/bonus/reaction/movement)
 * with auto-reset on turn change and auto-clear on combat end.
 */
export function useActionBudget(campaignId: string) {
  const { data: initiative } = useInitiative(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const [budgets, setBudgets] = useState<Record<string, ActionBudgetState>>({});
  const [lastSpend, setLastSpend] = useState<{
    entryId: string;
    costType: ActionCostType;
    label: string;
  } | null>(null);

  const entries = initiative?.entries ?? [];
  const currentTurnEntry =
    initiative?.isActive && entries[initiative.currentTurn]
      ? entries[initiative.currentTurn]
      : null;

  // Auto-reset budget when turn changes
  useEffect(() => {
    if (!currentTurnEntry?.id) return;
    const currentSpeed =
      currentTurnEntry.characterId
        ? (characters?.find((c) => c._id === currentTurnEntry.characterId)?.speed ?? DEFAULT_MOVEMENT_MAX)
        : DEFAULT_MOVEMENT_MAX;
    setBudgets((prev) => ({
      ...prev,
      [currentTurnEntry.id]: {
        actionUsed: false,
        bonusUsed: false,
        reactionUsed: false,
        movementUsed: 0,
        movementMax: currentSpeed,
      },
    }));
  }, [currentTurnEntry?.id, currentTurnEntry?.characterId, characters]);

  // Clear all budgets when combat ends
  useEffect(() => {
    if (initiative?.isActive) return;
    setBudgets({});
  }, [initiative?.isActive]);

  const getBudget = useCallback(
    (entryId: string, movementMax = DEFAULT_MOVEMENT_MAX): ActionBudgetState => {
      return getBudgetForEntry(budgets[entryId], movementMax);
    },
    [budgets],
  );

  const canUseCost = useCallback(
    (entryId: string, cost: ActionCostType): boolean => {
      if (cost === 'free') return true;
      const budget = getBudgetForEntry(budgets[entryId], DEFAULT_MOVEMENT_MAX);
      if (cost === 'action') return !budget.actionUsed;
      if (cost === 'bonus') return !budget.bonusUsed;
      return !budget.reactionUsed;
    },
    [budgets],
  );

  const spendBlockedReason = useCallback(
    (entryId: string, cost: ActionCostType): string | null => {
      if (cost === 'free') return null;
      const budget = getBudgetForEntry(budgets[entryId], DEFAULT_MOVEMENT_MAX);
      if (cost === 'action' && budget.actionUsed) return 'Action already spent';
      if (cost === 'bonus' && budget.bonusUsed) return 'Bonus already spent';
      if (cost === 'reaction' && budget.reactionUsed) return 'Reaction already spent';
      return null;
    },
    [budgets],
  );

  const updateBudget = useCallback(
    (
      entryId: string,
      patch: Partial<ActionBudgetState> | ((current: ActionBudgetState) => ActionBudgetState),
    ) => {
      setBudgets((prev) => {
        const current = getBudgetForEntry(prev[entryId], DEFAULT_MOVEMENT_MAX);
        const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
        return { ...prev, [entryId]: next };
      });
    },
    [],
  );

  const resetBudget = useCallback((entryId: string) => {
    setBudgets((prev) => {
      const rest = { ...prev };
      delete rest[entryId];
      return rest;
    });
  }, []);

  const consumeCost = useCallback(
    (entryId: string, cost: ActionCostType, sourceLabel: string): boolean => {
      const budget = getBudgetForEntry(budgets[entryId], DEFAULT_MOVEMENT_MAX);

      if (cost !== 'free') {
        if (cost === 'action' && budget.actionUsed) {
          toast.error('No Action remaining for this turn');
          return false;
        }
        if (cost === 'bonus' && budget.bonusUsed) {
          toast.error('No Bonus Action remaining for this turn');
          return false;
        }
        if (cost === 'reaction' && budget.reactionUsed) {
          toast.error('No Reaction remaining for this turn');
          return false;
        }
      }

      if (cost === 'free') return true;

      const spend = { entryId, costType: cost, label: sourceLabel };

      setBudgets((prev) => {
        const current = getBudgetForEntry(prev[entryId], budget.movementMax);
        return {
          ...prev,
          [entryId]: {
            ...current,
            actionUsed: cost === 'action' ? true : current.actionUsed,
            bonusUsed: cost === 'bonus' ? true : current.bonusUsed,
            reactionUsed: cost === 'reaction' ? true : current.reactionUsed,
          },
        };
      });

      setLastSpend(spend);
      toast.message(`Spent ${formatActionCostLabel(cost)} — ${sourceLabel}`, {
        action: {
          label: 'Undo',
          onClick: () => {
            setBudgets((prev) => {
              const current = prev[spend.entryId];
              if (!current) return prev;
              return {
                ...prev,
                [spend.entryId]: {
                  ...current,
                  actionUsed: spend.costType === 'action' ? false : current.actionUsed,
                  bonusUsed: spend.costType === 'bonus' ? false : current.bonusUsed,
                  reactionUsed: spend.costType === 'reaction' ? false : current.reactionUsed,
                },
              };
            });
            setLastSpend(null);
          },
        },
      });

      return true;
    },
    [budgets],
  );

  return {
    getBudget,
    consumeCost,
    canUseCost,
    spendBlockedReason,
    updateBudget,
    resetBudget,
    lastSpend,
    clearLastSpend: useCallback(() => setLastSpend(null), []),
  };
}
