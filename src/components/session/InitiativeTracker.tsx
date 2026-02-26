import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import {
  useInitiative,
  useAddInitiativeEntry,
  useUpdateInitiativeEntry,
  useRemoveInitiativeEntry,
  useStartCombat,
  useNextTurn,
  useEndCombat,
} from '@/hooks/useLiveSession';
import { Button } from '@/components/ui/Button';
import type {
  Initiative,
  InitiativeEntry,
  InitiativeUpdatedEvent,
  AddInitiativeEntryRequest,
} from '@/types/live-session';

interface InitiativeTrackerProps {
  campaignId: string;
  isDM: boolean;
  selectedEntryId?: string | null;
}

const TYPE_BADGES: Record<InitiativeEntry['type'], { label: string; className: string }> = {
  pc: { label: 'PC', className: 'bg-blue-500/20 text-blue-400' },
  npc: { label: 'NPC', className: 'bg-green-500/20 text-green-400' },
  monster: { label: 'MON', className: 'bg-red-500/20 text-red-400' },
  other: { label: 'OTH', className: 'bg-gray-500/20 text-gray-400' },
};

const ENTRY_TYPES: InitiativeEntry['type'][] = ['pc', 'npc', 'monster', 'other'];

const EMPTY_FORM: AddInitiativeEntryRequest = {
  type: 'monster',
  name: '',
  initiativeRoll: 0,
  initiativeBonus: 0,
};

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  let barColor = 'bg-green-500';
  if (pct < 25) barColor = 'bg-red-500';
  else if (pct < 50) barColor = 'bg-yellow-500';

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums font-[Cinzel]">
        {current}/{max}
      </span>
    </div>
  );
}

export function InitiativeTracker({ campaignId, isDM, selectedEntryId }: InitiativeTrackerProps) {
  const queryClient = useQueryClient();
  const { data: initiative } = useInitiative(campaignId);
  const addEntry = useAddInitiativeEntry(campaignId);
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const removeEntry = useRemoveInitiativeEntry(campaignId);
  const startCombat = useStartCombat(campaignId);
  const nextTurn = useNextTurn(campaignId);
  const endCombat = useEndCombat(campaignId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddInitiativeEntryRequest>({ ...EMPTY_FORM });
  const [editingHpId, setEditingHpId] = useState<string | null>(null);
  const [hpInput, setHpInput] = useState('');
  const hpInputRef = useRef<HTMLInputElement>(null);

  // Listen for WebSocket initiative updates
  useEffect(() => {
    const socket = getSocket();

    function onInitiativeUpdated(event: InitiativeUpdatedEvent) {
      queryClient.setQueryData<Initiative>(['initiative', campaignId], event.initiative);
    }

    socket.on('initiative-updated', onInitiativeUpdated);
    return () => {
      socket.off('initiative-updated', onInitiativeUpdated);
    };
  }, [campaignId, queryClient]);

  // Focus HP input when editing
  useEffect(() => {
    if (editingHpId && hpInputRef.current) {
      hpInputRef.current.focus();
      hpInputRef.current.select();
    }
  }, [editingHpId]);

  const handleAddEntry = useCallback(() => {
    if (!form.name.trim() || form.initiativeRoll === undefined) return;
    addEntry.mutate(
      {
        ...form,
        name: form.name.trim(),
        currentHp: form.currentHp || undefined,
        maxHp: form.maxHp || undefined,
        ac: form.ac || undefined,
      },
      {
        onSuccess: () => {
          setForm({ ...EMPTY_FORM });
          setShowAddForm(false);
        },
      },
    );
  }, [form, addEntry]);

  const handleHpSubmit = useCallback(
    (entryId: string, _currentHp: number | undefined) => {
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

  const sortedEntries = initiative
    ? [...initiative.entries].sort((a, b) => b.initiativeRoll - a.initiativeRoll)
    : [];

  // Filter hidden entries for non-DM users
  const visibleEntries = isDM
    ? sortedEntries
    : sortedEntries.filter((e) => !e.isHidden);

  // Map sorted index back to original index for currentTurn matching
  const currentTurnEntryId =
    initiative && initiative.isActive && initiative.entries[initiative.currentTurn]
      ? initiative.entries[initiative.currentTurn].id
      : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-warm tavern-card iron-brackets texture-wood">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-carved font-[Cinzel] tracking-wider text-sm font-semibold text-foreground">
          Initiative Tracker
        </h3>
        {initiative?.isActive && (
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary tabular-nums font-[Cinzel] shadow-glow-sm">
            Round {initiative.round}
          </span>
        )}
      </div>

      {/* DM combat controls */}
      {isDM && (
        <div className="mb-3 flex flex-wrap gap-2">
          {!initiative?.isActive ? (
            <Button
              size="sm"
              variant="primary"
              disabled={!sortedEntries.length || startCombat.isPending}
              onClick={() => startCombat.mutate()}
            >
              Start Combat
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="primary"
                disabled={nextTurn.isPending}
                onClick={() => nextTurn.mutate()}
              >
                Next Turn
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={endCombat.isPending}
                onClick={() => endCombat.mutate()}
              >
                End Combat
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? 'Cancel' : 'Add Entry'}
          </Button>
        </div>
      )}

      {/* Add entry form */}
      {isDM && showAddForm && (
        <div className="mb-3 rounded-md border border-gold/20 texture-parchment bg-accent/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div className="col-span-2">
              <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Type</label>
              <div className="flex gap-1">
                {ENTRY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`font-[Cinzel] text-[10px] uppercase tracking-wider rounded-sm px-2.5 py-1 font-medium transition-colors ${
                      form.type === t
                        ? TYPE_BADGES[t].className + ' ring-1 ring-current'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {TYPE_BADGES[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="col-span-2">
              <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Goblin Scout"
                className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Initiative Roll */}
            <div>
              <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Initiative *</label>
              <input
                type="number"
                value={form.initiativeRoll || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, initiativeRoll: parseInt(e.target.value, 10) || 0 }))
                }
                placeholder="15"
                className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Initiative Bonus */}
            <div>
              <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Bonus</label>
              <input
                type="number"
                value={form.initiativeBonus || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, initiativeBonus: parseInt(e.target.value, 10) || 0 }))
                }
                placeholder="+2"
                className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* HP Current */}
            <div>
              <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Current HP</label>
              <input
                type="number"
                value={form.currentHp ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    currentHp: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  }))
                }
                placeholder="25"
                className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* HP Max */}
            <div>
              <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Max HP</label>
              <input
                type="number"
                value={form.maxHp ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxHp: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  }))
                }
                placeholder="25"
                className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* AC */}
            <div>
              <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">AC</label>
              <input
                type="number"
                value={form.ac ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ac: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  }))
                }
                placeholder="14"
                className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Hidden */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground font-[Cinzel]">
                <input
                  type="checkbox"
                  checked={form.isHidden ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, isHidden: e.target.checked }))}
                  className="rounded border-border"
                />
                Hidden
              </label>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              disabled={!form.name.trim() || addEntry.isPending}
              onClick={handleAddEntry}
            >
              {addEntry.isPending ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      )}

      {/* Initiative list */}
      {visibleEntries.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground font-['IM_Fell_English'] italic">
          No entries yet.{isDM ? ' Add combatants to begin.' : ''}
        </p>
      ) : (
        <div className="space-y-1">
          {visibleEntries.map((entry) => {
            const isCurrent = initiative?.isActive && entry.id === currentTurnEntryId;
            const isHidden = entry.isHidden;
            const isMapSelected = selectedEntryId === entry.id;

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all ${
                  isCurrent
                    ? 'border-l-4 border-primary bg-primary/8 shadow-[0_0_18px_hsla(38,90%,50%,0.18)] animate-candle'
                    : isMapSelected
                      ? 'border-l-4 border-blue-400 bg-blue-500/8 shadow-[0_0_8px_hsla(220,80%,60%,0.15)]'
                      : isHidden
                        ? 'border-l-4 border-dashed border-iron/40 opacity-50'
                        : 'border-l-4 border-transparent'
                }`}
              >
                {/* Turn indicator */}
                <div className="w-4 flex-shrink-0 text-center">
                  {isCurrent && (
                    <span className="text-primary" aria-label="Current turn">
                      &#9654;
                    </span>
                  )}
                </div>

                {/* Type badge */}
                <span
                  className={`flex-shrink-0 font-[Cinzel] text-[9px] tracking-wider rounded-sm px-1.5 py-0.5 font-bold uppercase leading-none ${TYPE_BADGES[entry.type].className}`}
                >
                  {TYPE_BADGES[entry.type].label}
                </span>

                {/* Name and conditions */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground font-[Cinzel]">
                      {entry.name}
                    </span>
                    {isHidden && isDM && (
                      <span className="text-muted-foreground" title="Hidden from players">
                        &#128065;&#xFE0E;
                      </span>
                    )}
                  </div>
                  {entry.conditions && entry.conditions.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {entry.conditions.map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-arcane/20 px-2 py-0.5 text-xs text-arcane"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AC badge */}
                {entry.ac != null && (
                  <span
                    className="flex-shrink-0 rounded border border-iron/30 bg-iron/20 px-1.5 py-0.5 text-xs tabular-nums text-iron font-[Cinzel]"
                    title="Armor Class"
                  >
                    AC {entry.ac}
                  </span>
                )}

                {/* HP bar / inline edit */}
                {entry.currentHp != null && entry.maxHp != null && (
                  <div className="flex-shrink-0">
                    {isDM && editingHpId === entry.id ? (
                      <input
                        ref={hpInputRef}
                        type="number"
                        value={hpInput}
                        onChange={(e) => setHpInput(e.target.value)}
                        onBlur={() => handleHpSubmit(entry.id, entry.currentHp)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleHpSubmit(entry.id, entry.currentHp);
                          if (e.key === 'Escape') setEditingHpId(null);
                        }}
                        className="w-16 input-carved rounded-sm border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isDM) return;
                          setEditingHpId(entry.id);
                          setHpInput(String(entry.currentHp ?? 0));
                        }}
                        className={isDM ? 'cursor-pointer' : 'cursor-default'}
                        title={isDM ? 'Click to edit HP' : undefined}
                      >
                        <HpBar current={entry.currentHp} max={entry.maxHp} />
                      </button>
                    )}
                  </div>
                )}

                {/* Initiative roll */}
                <span className="flex-shrink-0 w-8 text-right text-sm font-[Cinzel] font-bold tabular-nums text-foreground">
                  {entry.initiativeRoll}
                </span>

                {/* Remove button (DM only) */}
                {isDM && (
                  <button
                    type="button"
                    onClick={() => removeEntry.mutate(entry.id)}
                    className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                    title="Remove entry"
                    aria-label={`Remove ${entry.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
