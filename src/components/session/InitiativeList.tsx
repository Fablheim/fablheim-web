import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X, Zap, Skull, TriangleAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCombatRules,
  useInitiative,
  useRemoveInitiativeEntry,
  useUpdateInitiativeEntry,
} from '@/hooks/useLiveSession';
import { useSessionWorkspaceState } from '@/components/session/SessionWorkspaceState';
import {
  checkSystemDataSize,
  setConditionValue,
  toggleConditionValue,
} from '@/lib/system-data';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';
import type { ConditionDef } from '@/types/combat-rules';
import type { InitiativeEntry } from '@/types/live-session';

const FALLBACK_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
  'Concentrating', 'Exhaustion',
] as const;

interface InitiativeListProps {
  campaignId: string;
  isDM: boolean;
}

const TYPE_BADGES: Record<InitiativeEntry['type'], { label: string; className: string }> = {
  pc: { label: 'PC', className: 'bg-blue-500/20 text-blue-400' },
  npc: { label: 'NPC', className: 'bg-green-500/20 text-green-400' },
  monster: { label: 'MON', className: 'bg-red-500/20 text-red-400' },
  other: { label: 'OTH', className: 'bg-gray-500/20 text-gray-400' },
};

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  let barColor = 'bg-green-500';
  if (pct < 25) barColor = 'bg-red-500';
  else if (pct < 50) barColor = 'bg-yellow-500';

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{current}/{max}</span>
    </div>
  );
}

function ConditionPicker({
  currentKeys,
  onToggle,
  onClose,
  conditionDefs,
}: {
  currentKeys: string[];
  onToggle: (conditionKey: string) => void;
  onClose: () => void;
  conditionDefs: ConditionDef[];
}) {
  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-56 max-w-[calc(100vw-3rem)] rounded-md border border-border bg-card p-2 shadow-warm-lg">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Conditions</span>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto pr-0.5">
        <div className="flex flex-wrap gap-1">
          {conditionDefs.map((condition) => {
            const active = currentKeys.includes(condition.key);
            return (
              <button
                key={condition.key}
                type="button"
                onClick={() => onToggle(condition.key)}
                className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                  active
                    ? 'bg-arcane/30 text-arcane ring-1 ring-arcane/50'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                title={condition.description}
              >
                {condition.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function toFallbackDefs(): ConditionDef[] {
  return FALLBACK_CONDITIONS.map((label) => ({
    key: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    description: label,
    hasValue: false,
  }));
}

export function InitiativeList({ campaignId, isDM }: InitiativeListProps) {
  const { data: initiative } = useInitiative(campaignId);
  const { data: rules } = useCombatRules(campaignId);
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const removeEntry = useRemoveInitiativeEntry(campaignId);
  const { selectedEntryId, selectEntry } = useSessionWorkspaceState();

  const hasSurprise = useCampaignModuleEnabled(campaignId, 'surprise-rounds');
  const hasConcentration = useCampaignModuleEnabled(campaignId, 'concentration-check');

  const [editingHpId, setEditingHpId] = useState<string | null>(null);
  const [hpInput, setHpInput] = useState('');
  const hpInputRef = useRef<HTMLInputElement>(null);
  const [conditionPickerEntryId, setConditionPickerEntryId] = useState<string | null>(null);

  const conditionDefs = useMemo(() => rules?.conditions ?? toFallbackDefs(), [rules?.conditions]);
  const conditionByKey = useMemo(
    () => new Map(conditionDefs.map((condition) => [condition.key, condition])),
    [conditionDefs],
  );
  const labelToKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const condition of conditionDefs) {
      map.set(condition.label.toLowerCase(), condition.key);
    }
    return map;
  }, [conditionDefs]);

  useEffect(() => {
    if (editingHpId && hpInputRef.current) {
      hpInputRef.current.focus();
      hpInputRef.current.select();
    }
  }, [editingHpId]);

  const resolveConditionKey = useCallback(
    (raw: string): string => {
      if (conditionByKey.has(raw)) return raw;
      const byLabel = labelToKey.get(raw.toLowerCase());
      return byLabel ?? raw;
    },
    [conditionByKey, labelToKey],
  );

  const normalizeEntryConditions = useCallback(
    (entry: InitiativeEntry): string[] => {
      const raw = entry.conditions ?? [];
      return Array.from(new Set(raw.map((c) => resolveConditionKey(c.name))));
    },
    [resolveConditionKey],
  );

  const persistConditionPatch = useCallback(
    (entry: InitiativeEntry, nextConditions: import('@/types/live-session').ConditionEntry[], nextSystemData: InitiativeEntry['systemData']) => {
      const sizeCheck = checkSystemDataSize(nextSystemData);
      if (!sizeCheck.ok) {
        toast.error(sizeCheck.error ?? 'systemData is too large to save');
        return;
      }
      if (sizeCheck.warning) {
        toast.warning(sizeCheck.warning);
      }

      updateEntry.mutate({
        entryId: entry.id,
        body: {
          conditions: nextConditions,
          systemData: nextSystemData,
        },
      });
    },
    [updateEntry],
  );

  const handleHpSubmit = useCallback(
    (entryId: string) => {
      const val = parseInt(hpInput, 10);
      if (isNaN(val)) {
        setEditingHpId(null);
        return;
      }
      updateEntry.mutate(
        { entryId, body: { currentHp: val } },
        { onSettled: () => setEditingHpId(null) },
      );
    },
    [hpInput, updateEntry],
  );

  const handleToggleCondition = useCallback(
    (entry: InitiativeEntry, rawConditionKey: string) => {
      const conditionKey = resolveConditionKey(rawConditionKey);
      const conditionDef = conditionByKey.get(conditionKey);
      const current = entry.conditions ?? [];
      const isActive = current.some((c) => resolveConditionKey(c.name) === conditionKey);

      const nextConditions = isActive
        ? current.filter((c) => resolveConditionKey(c.name) !== conditionKey)
        : [...current, { id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: conditionKey }];

      let nextSystemData = entry.systemData;
      if (conditionDef?.hasValue) {
        nextSystemData = toggleConditionValue(entry.systemData, conditionKey, !isActive);
      }

      persistConditionPatch(entry, nextConditions, nextSystemData);
    },
    [conditionByKey, persistConditionPatch, resolveConditionKey],
  );

  const handleConditionValueChange = useCallback(
    (entry: InitiativeEntry, conditionKey: string, value: number) => {
      const normalizedValue = Math.max(1, Math.floor(value || 1));
      const nextSystemData = setConditionValue(entry.systemData, conditionKey, normalizedValue);
      const current = entry.conditions ?? [];
      const nextConditions = current.some((c) => resolveConditionKey(c.name) === conditionKey)
        ? [...current]
        : [...current, { id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: conditionKey }];
      persistConditionPatch(entry, nextConditions, nextSystemData);
    },
    [persistConditionPatch, resolveConditionKey],
  );

  const sortedEntries = initiative
    ? [...initiative.entries].sort((a, b) => b.initiativeRoll - a.initiativeRoll)
    : [];

  const visibleEntries = isDM
    ? sortedEntries
    : sortedEntries.filter((e) => !e.isHidden);

  const currentTurnEntryId =
    initiative && initiative.isActive && initiative.entries[initiative.currentTurn]
      ? initiative.entries[initiative.currentTurn].id
      : null;

  if (visibleEntries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-3 text-xs text-muted-foreground">
        No initiative entries.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-2 py-2">
      <div className="space-y-1">
        {visibleEntries.map((entry) => {
          const isCurrent = initiative?.isActive && entry.id === currentTurnEntryId;
          const isSelected = selectedEntryId === entry.id;
          const isHidden = !!entry.isHidden;
          const normalizedConditions = normalizeEntryConditions(entry);
          const showPicker = isDM && conditionPickerEntryId === entry.id;

          return (
            <div
              key={entry.id}
              onClick={() => selectEntry(entry.id, { pin: true })}
              className={`initiative-row rounded-md px-2 py-1.5 transition-all ${
                isCurrent
                  ? 'border-l-4 border-primary bg-primary/15 shadow-[inset_0_0_0_1px_hsla(38,78%,60%,0.22)]'
                  : isSelected
                    ? 'border-l-4 border-blue-400/80 bg-blue-500/10'
                    : isHidden
                      ? 'border-l-4 border-dashed border-iron/40 opacity-50'
                      : 'border-l-4 border-transparent'
              } cursor-pointer hover:bg-accent/35`}
            >
              <div className="flex items-center gap-2">
                {isCurrent ? (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className={`rounded-sm px-1.5 py-0.5 text-[9px] uppercase leading-none ${TYPE_BADGES[entry.type].className}`}>
                  {TYPE_BADGES[entry.type].label}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm text-foreground">{entry.name}</span>
                    {hasConcentration && entry.isConcentrating && <Zap className="h-3 w-3 text-amber-400" />}
                    {entry.deathSaves && <Skull className="h-3 w-3 text-red-400" />}
                    {normalizedConditions.some((key) => {
                      const def = conditionByKey.get(key);
                      return !!def?.hasValue && entry.systemData?.conditions?.[key] != null;
                    }) && (
                      <TriangleAlert className="h-3 w-3 text-violet-300" />
                    )}
                    {hasSurprise && entry.isSurprised && (
                      <span className="rounded bg-gray-500/20 px-1 py-0.5 text-[9px] uppercase tracking-wide text-gray-400">
                        Surprised
                      </span>
                    )}
                    {isCurrent && !(hasSurprise && entry.isSurprised) && (
                      <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] uppercase tracking-wide text-primary">
                        Acting
                      </span>
                    )}
                  </div>

                  <div className="relative mt-0.5 flex max-w-full flex-wrap items-center gap-1 overflow-hidden">
                    {entry.currentHp != null && entry.maxHp != null && (
                      <span className="rounded bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        HP {entry.currentHp}/{entry.maxHp}
                      </span>
                    )}
                    {normalizedConditions.map((conditionKey) => {
                      const def = conditionByKey.get(conditionKey);
                      const label = def?.label ?? conditionKey;
                      const value = entry.systemData?.conditions?.[conditionKey];

                      return (
                        <div key={conditionKey} className="inline-flex items-center gap-1">
                          <span
                            className={`rounded-full bg-arcane/20 px-2 py-0.5 text-xs text-arcane ${
                              isDM ? 'cursor-pointer hover:bg-destructive/20 hover:text-destructive' : ''
                            }`}
                            onClick={isDM ? (e) => { e.stopPropagation(); handleToggleCondition(entry, conditionKey); } : undefined}
                            title={def?.description ?? label}
                          >
                            {label}
                          </span>

                          {isDM && def?.hasValue && (
                            <input
                              type="number"
                              min={1}
                              value={Math.max(1, value ?? 1)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleConditionValueChange(entry, conditionKey, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-12 rounded border border-border bg-background px-1 py-0.5 text-[10px]"
                              title={`${label} value`}
                            />
                          )}
                        </div>
                      );
                    })}

                    {isDM && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConditionPickerEntryId(showPicker ? null : entry.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-sm border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-primary/15 hover:text-primary"
                      >
                        <Plus className="h-3 w-3" />
                        Cond
                      </button>
                    )}

                    {showPicker && (
                      <ConditionPicker
                        currentKeys={normalizedConditions}
                        onToggle={(conditionKey) => handleToggleCondition(entry, conditionKey)}
                        onClose={() => setConditionPickerEntryId(null)}
                        conditionDefs={conditionDefs}
                      />
                    )}
                  </div>
                </div>

                {entry.currentHp != null && entry.maxHp != null && (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isDM ? (
                      editingHpId === entry.id ? (
                        <input
                          ref={hpInputRef}
                          type="number"
                          value={hpInput}
                          onChange={(e) => setHpInput(e.target.value)}
                          onBlur={() => handleHpSubmit(entry.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleHpSubmit(entry.id);
                            if (e.key === 'Escape') setEditingHpId(null);
                          }}
                          className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-xs"
                        />
                      ) : (
                        <button
                          type="button"
                          className="cursor-pointer"
                          onClick={() => {
                            setEditingHpId(entry.id);
                            setHpInput(String(entry.currentHp ?? 0));
                          }}
                        >
                          <HpBar current={entry.currentHp} max={entry.maxHp} />
                        </button>
                      )
                    ) : (
                      <HpBar current={entry.currentHp} max={entry.maxHp} />
                    )}
                  </div>
                )}

                <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
                  {entry.initiativeRoll}
                </span>

                {isDM && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEntry.mutate(entry.id);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                    title="Remove entry"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
