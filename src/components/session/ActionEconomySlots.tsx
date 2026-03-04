import { useEffect, useMemo, useState } from 'react';
import { useCombatRules, useInitiative } from '@/hooks/useLiveSession';

interface ActionEconomySlotsProps {
  campaignId: string;
  entryId: string;
  canEdit: boolean;
}

interface EntryBudgetState {
  slotsUsed: Record<string, number>;
  movementUsed: number;
}

function createInitialState(slotKeys: string[]): EntryBudgetState {
  return {
    slotsUsed: slotKeys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {}),
    movementUsed: 0,
  };
}

export function ActionEconomySlots({ campaignId, entryId, canEdit }: ActionEconomySlotsProps) {
  const { data: rules } = useCombatRules(campaignId);
  const { data: initiative } = useInitiative(campaignId);
  const [budgets, setBudgets] = useState<Record<string, EntryBudgetState>>({});

  const slots = rules?.actionEconomy.slots ?? [];
  const slotKeys = useMemo(() => slots.map((slot) => slot.key), [slots]);
  const hasMovement = !!rules?.actionEconomy.hasMovement;
  const defaultMovementFt = Math.max(0, rules?.actionEconomy.defaultMovementFt ?? 0);

  const turnToken = `${initiative?.round ?? 0}:${initiative?.currentTurn ?? 0}:${initiative?.isActive ? '1' : '0'}`;
  const currentTurnEntryId =
    initiative?.isActive && initiative.entries[initiative.currentTurn]
      ? initiative.entries[initiative.currentTurn].id
      : null;

  useEffect(() => {
    if (!initiative?.isActive || !currentTurnEntryId) return;
    setBudgets((prev) => ({
      ...prev,
      [currentTurnEntryId]: createInitialState(slotKeys),
    }));
  }, [turnToken, initiative?.isActive, currentTurnEntryId, slotKeys]);

  const current = budgets[entryId] ?? createInitialState(slotKeys);

  function setSlotUsage(slotKey: string, value: number) {
    setBudgets((prev) => {
      const base = prev[entryId] ?? createInitialState(slotKeys);
      return {
        ...prev,
        [entryId]: {
          ...base,
          slotsUsed: {
            ...base.slotsUsed,
            [slotKey]: value,
          },
        },
      };
    });
  }

  function setMovementUsed(value: number) {
    setBudgets((prev) => {
      const base = prev[entryId] ?? createInitialState(slotKeys);
      return {
        ...prev,
        [entryId]: {
          ...base,
          movementUsed: value,
        },
      };
    });
  }

  if (!rules || slots.length === 0) return null;

  return (
    <div className="rounded border border-border/60 bg-background/25 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Action Economy</p>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setBudgets((prev) => ({
                ...prev,
                [entryId]: createInitialState(slotKeys),
              }));
            }}
            className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-2">
        {slots.map((slot) => {
          const max = slot.maxPerTurn;
          const used = current.slotsUsed[slot.key] ?? 0;
          const shownMax = max >= 999 ? Infinity : Math.max(1, max);

          return (
            <div key={slot.key} className="rounded border border-border/50 bg-background/30 px-2 py-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{slot.label}</span>
                <span className="text-[11px] text-foreground">
                  {used}/{shownMax === Infinity ? '∞' : shownMax}
                </span>
              </div>

              {shownMax <= 5 ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: shownMax }).map((_, i) => {
                    const active = i < used;
                    return (
                      <button
                        key={`${slot.key}-${i}`}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => setSlotUsage(slot.key, active ? i : i + 1)}
                        className={`h-4 w-4 rounded border ${
                          active
                            ? 'border-primary/60 bg-primary/50'
                            : 'border-border/70 bg-background/50'
                        } disabled:cursor-default`}
                        title={`${slot.label} ${i + 1}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={!canEdit || used <= 0}
                    onClick={() => setSlotUsage(slot.key, Math.max(0, used - 1))}
                    className="rounded border border-border/60 px-2 py-0.5 text-xs disabled:opacity-50"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    disabled={!canEdit || used >= shownMax}
                    onClick={() => setSlotUsage(slot.key, Math.min(shownMax, used + 1))}
                    className="rounded border border-border/60 px-2 py-0.5 text-xs disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {hasMovement && (
          <div className="rounded border border-border/50 bg-background/30 px-2 py-1.5">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Movement</span>
              <span>{current.movementUsed}/{defaultMovementFt} ft</span>
            </div>
            <input
              type="range"
              min={0}
              max={defaultMovementFt}
              value={Math.min(defaultMovementFt, current.movementUsed)}
              onChange={(e) => setMovementUsed(parseInt(e.target.value, 10) || 0)}
              disabled={!canEdit}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
