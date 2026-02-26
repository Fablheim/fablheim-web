import { useState, useMemo, useCallback } from 'react';
import { Dices, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { SystemDefinition, StatDefinition } from '@/types/system';
import type { CharacterDraft } from '@/pages/CharacterCreationWizardPage';

interface StatsStepProps {
  draft: CharacterDraft;
  systemDef: SystemDefinition;
  onUpdateStats: (stats: Record<string, number>) => void;
  errors: Record<string, string>;
}

type GenerationMethod = 'manual' | 'standard' | 'point-buy' | 'roll';

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

const POINT_BUY_BUDGET = 27;

// Fate ladder labels
const FATE_LADDER: Record<number, string> = {
  '-1': 'Poor',
  0: 'Mediocre',
  1: 'Average',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Superb',
};

function computeModifier(formula: string | null, value: number): string | null {
  if (!formula) return null;
  if (formula === 'floor((value - 10) / 2)') {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
  return null;
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function roll4d6DropLowest(): number {
  const rolls = [rollD6(), rollD6(), rollD6(), rollD6()];
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

function isDnd5eStyle(systemDef: SystemDefinition): boolean {
  return (
    systemDef.stats.length === 6 &&
    systemDef.stats.every((s) => (s.min ?? 1) <= 8 && (s.max ?? 30) >= 15) &&
    systemDef.statModifierFormula !== null
  );
}

function isFateStyle(systemDef: SystemDefinition): boolean {
  return systemDef.id === 'fate';
}

function renderMethodTabs(
  methods: { id: GenerationMethod; label: string }[],
  active: GenerationMethod,
  setActive: (m: GenerationMethod) => void,
) {
  return (
    <div className="flex gap-1 rounded-md border border-border bg-background/30 p-1">
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setActive(m.id)}
          className={`flex-1 rounded-sm px-3 py-1.5 font-[Cinzel] text-xs transition-colors ${
            active === m.id
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function renderStatCard(
  stat: StatDefinition,
  value: number,
  formula: string | null,
  onValueChange: (v: number) => void,
  disabled: boolean,
) {
  const mod = computeModifier(formula, value);
  const isFate = FATE_LADDER[value] !== undefined && formula === null;
  const ladderLabel = isFate ? FATE_LADDER[value] : null;

  return (
    <div
      key={stat.key}
      className="rounded-md border border-border bg-background/40 p-3 text-center"
    >
      <label
        htmlFor={`stat-${stat.key}`}
        className="block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground"
      >
        {stat.label}
      </label>
      <div className="mt-1 flex items-center justify-center gap-1">
        <button
          type="button"
          disabled={disabled || value <= (stat.min ?? 0)}
          onClick={() => onValueChange(value - 1)}
          className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground disabled:opacity-30"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          id={`stat-${stat.key}`}
          type="number"
          min={stat.min ?? 0}
          max={stat.max ?? 99}
          value={value}
          onChange={(e) => onValueChange(parseInt(e.target.value) || stat.defaultValue)}
          disabled={disabled}
          className="w-12 rounded-sm border border-input bg-input px-1 py-1 text-center text-sm font-bold text-foreground input-carved disabled:opacity-60"
        />
        <button
          type="button"
          disabled={disabled || value >= (stat.max ?? 99)}
          onClick={() => onValueChange(value + 1)}
          className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground disabled:opacity-30"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {mod && (
        <span className="mt-1 block text-xs font-medium text-primary">{mod}</span>
      )}
      {ladderLabel && (
        <span className="mt-1 block text-[10px] italic text-muted-foreground">
          {ladderLabel}
        </span>
      )}
    </div>
  );
}

// ── Point Buy helper ──────────────────────────────────────────────

function PointBuyInfo({ stats, values }: { stats: StatDefinition[]; values: Record<string, number> }) {
  const spent = stats.reduce((sum, s) => {
    const val = values[s.key] ?? 8;
    return sum + (POINT_BUY_COSTS[val] ?? 0);
  }, 0);
  const remaining = POINT_BUY_BUDGET - spent;

  return (
    <div className={`rounded-md border px-3 py-2 text-center text-sm font-[Cinzel] ${
      remaining < 0
        ? 'border-red-400/50 bg-red-400/10 text-red-400'
        : remaining === 0
          ? 'border-green-400/50 bg-green-400/10 text-green-400'
          : 'border-border bg-background/30 text-foreground'
    }`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">Points: </span>
      <span className="font-bold">{remaining}</span>
      <span className="text-xs text-muted-foreground"> / {POINT_BUY_BUDGET}</span>
    </div>
  );
}

// ── Roll Results ──────────────────────────────────────────────────

function RollResults({
  results,
  assignments,
  stats,
  onAssign,
  onReroll,
}: {
  results: number[];
  assignments: Record<string, number>;
  stats: StatDefinition[];
  onAssign: (statKey: string, resultIndex: number) => void;
  onReroll: () => void;
}) {
  // Which result indices are already assigned
  const assignedIndices = new Set(Object.values(assignments));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {results.map((val, i) => (
            <span
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-bold ${
                assignedIndices.has(i)
                  ? 'border-primary/30 bg-primary/10 text-primary/60'
                  : 'border-border bg-background/50 text-foreground'
              }`}
            >
              {val}
            </span>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReroll}>
          <Dices className="mr-1 h-4 w-4" />
          Reroll
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => {
          const assignedIdx = assignments[stat.key];
          const value = assignedIdx !== undefined ? results[assignedIdx] : undefined;
          return (
            <div key={stat.key} className="rounded-md border border-border bg-background/30 p-2">
              <label className="block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                {stat.abbreviation}
              </label>
              <select
                value={assignedIdx ?? ''}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  if (!isNaN(idx)) onAssign(stat.key, idx);
                }}
                className="mt-1 w-full rounded-sm border border-input bg-input px-1 py-1 text-center text-sm text-foreground input-carved"
              >
                <option value="">—</option>
                {results.map((val, i) => {
                  const taken = assignedIndices.has(i) && assignments[stat.key] !== i;
                  return (
                    <option key={i} value={i} disabled={taken}>
                      {val}{taken ? ' (used)' : ''}
                    </option>
                  );
                })}
              </select>
              {value !== undefined && (
                <span className="mt-0.5 block text-center text-xs font-medium text-primary">
                  {computeModifier('floor((value - 10) / 2)', value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function StatsStep({ draft, systemDef, onUpdateStats, errors }: StatsStepProps) {
  const showMethods = isDnd5eStyle(systemDef);
  const isFate = isFateStyle(systemDef);

  const [method, setMethod] = useState<GenerationMethod>('manual');
  const [rollResults, setRollResults] = useState<number[]>([]);
  const [rollAssignments, setRollAssignments] = useState<Record<string, number>>({});

  const methods = useMemo(() => {
    if (!showMethods) return [];
    return [
      { id: 'manual' as const, label: 'Manual' },
      { id: 'standard' as const, label: 'Standard' },
      { id: 'point-buy' as const, label: 'Point Buy' },
      { id: 'roll' as const, label: 'Roll' },
    ];
  }, [showMethods]);

  const handleMethodChange = useCallback(
    (m: GenerationMethod) => {
      setMethod(m);
      if (m === 'standard') {
        // Apply standard array in order
        const newStats: Record<string, number> = {};
        systemDef.stats.forEach((stat, i) => {
          newStats[stat.key] = STANDARD_ARRAY[i] ?? stat.defaultValue;
        });
        onUpdateStats(newStats);
      } else if (m === 'point-buy') {
        // Reset all to 8
        const newStats: Record<string, number> = {};
        systemDef.stats.forEach((stat) => {
          newStats[stat.key] = 8;
        });
        onUpdateStats(newStats);
      } else if (m === 'roll') {
        handleRoll();
      } else {
        // Manual — reset to defaults
        const newStats: Record<string, number> = {};
        systemDef.stats.forEach((stat) => {
          newStats[stat.key] = stat.defaultValue;
        });
        onUpdateStats(newStats);
      }
    },
    [systemDef, onUpdateStats],
  );

  function handleRoll() {
    const results = systemDef.stats.map(() => roll4d6DropLowest());
    results.sort((a, b) => b - a);
    setRollResults(results);
    setRollAssignments({});
  }

  function handleRollAssign(statKey: string, resultIndex: number) {
    const newAssignments = { ...rollAssignments };
    // Remove any previous assignment of this index
    for (const [key, idx] of Object.entries(newAssignments)) {
      if (idx === resultIndex && key !== statKey) delete newAssignments[key];
    }
    newAssignments[statKey] = resultIndex;
    setRollAssignments(newAssignments);

    // Update stats
    const newStats = { ...draft.stats };
    for (const [key, idx] of Object.entries(newAssignments)) {
      newStats[key] = rollResults[idx];
    }
    onUpdateStats(newStats);
  }

  function handleStatChange(key: string, value: number) {
    const stat = systemDef.stats.find((s) => s.key === key);
    if (!stat) return;
    const clamped = Math.max(stat.min ?? 0, Math.min(stat.max ?? 99, value));

    if (method === 'point-buy') {
      // Check if new value is within point-buy range (8-15)
      if (clamped < 8 || clamped > 15) return;
      // Check budget
      const currentCost = POINT_BUY_COSTS[draft.stats[key] ?? 8] ?? 0;
      const newCost = POINT_BUY_COSTS[clamped] ?? 0;
      const totalSpent = systemDef.stats.reduce((sum, s) => {
        return sum + (POINT_BUY_COSTS[draft.stats[s.key] ?? 8] ?? 0);
      }, 0);
      if (totalSpent - currentCost + newCost > POINT_BUY_BUDGET) return;
    }

    onUpdateStats({ ...draft.stats, [key]: clamped });
  }

  const cols = systemDef.stats.length <= 6 ? 3 : systemDef.stats.length <= 9 ? 3 : 4;
  const statsDisabled = method === 'standard' || method === 'roll';

  return (
    <div className="space-y-4">
      <p className="font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
        {isFate ? 'Approaches' : systemDef.statModifierFormula ? 'Ability Scores' : 'Domain Stats'}
      </p>

      {showMethods && methods.length > 0 && renderMethodTabs(methods, method, handleMethodChange)}

      {errors.stats && (
        <p className="text-xs text-red-400">{errors.stats}</p>
      )}

      {method === 'point-buy' && showMethods && (
        <PointBuyInfo stats={systemDef.stats} values={draft.stats} />
      )}

      {method === 'roll' && rollResults.length > 0 ? (
        <RollResults
          results={rollResults}
          assignments={rollAssignments}
          stats={systemDef.stats}
          onAssign={handleRollAssign}
          onReroll={handleRoll}
        />
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {systemDef.stats.map((stat) => {
            const value = draft.stats[stat.key] ?? stat.defaultValue;
            return renderStatCard(
              stat,
              value,
              systemDef.statModifierFormula,
              (v) => handleStatChange(stat.key, v),
              statsDisabled,
            );
          })}
        </div>
      )}

      {method === 'roll' && rollResults.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Dices className="h-10 w-10 text-muted-foreground" />
          <Button type="button" onClick={handleRoll}>
            <Dices className="mr-2 h-4 w-4" />
            Roll 4d6 Drop Lowest
          </Button>
          <p className="text-xs text-muted-foreground">
            Roll {systemDef.stats.length} sets and assign them to your stats
          </p>
        </div>
      )}

      {isFate && (
        <p className="text-xs text-muted-foreground">
          Typically: one Great (+4), two Good (+3), two Fair (+2), one Average (+1).
        </p>
      )}
    </div>
  );
}
