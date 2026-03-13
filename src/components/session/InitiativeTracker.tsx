import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dices, Plus, X, Zap, Skull, Copy, Timer, TimerOff, Crosshair } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { DeathSavesTracker } from '@/components/session/DeathSavesTracker';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DownedStatePanel } from '@/components/session/DownedStatePanel';
import {
  useInitiative,
  useAddInitiativeEntry,
  useUpdateInitiativeEntry,
  useRemoveInitiativeEntry,
  useStartCombat,
  useNextTurn,
  useEndCombat,
  useCombatRules,
} from '@/hooks/useLiveSession';
import { Button } from '@/components/ui/Button';
import type { EnemyAttack } from '@/types/enemy-template';
import { useCampaignModuleEnabled, useRoundLabel } from '@/hooks/useModuleEnabled';
import type {
  Initiative,
  InitiativeEntry,
  InitiativeUpdatedEvent,
  AddInitiativeEntryRequest,
} from '@/types/live-session';

const FALLBACK_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
  'Concentrating', 'Exhaustion',
] as const;

interface InitiativeTrackerProps {
  campaignId: string;
  isDM: boolean;
  selectedEntryId?: string | null;
  onSelectEntryId?: (entryId: string) => void;
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

const NPC_CUSTOM_ATTACKS_STORAGE_KEY = 'fablheim:npc-custom-attacks';
const TURN_TIMER_STORAGE_KEY = 'fablheim:turn-timer-enabled';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

function HpBar({ current, max, hideNumbers }: { current: number; max: number; hideNumbers?: boolean }) {
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
      {!hideNumbers && (
        <span className="text-xs text-muted-foreground tabular-nums font-[Cinzel]">
          {current}/{max}
        </span>
      )}
    </div>
  );
}

function HealthDescriptor({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  let label: string;
  let className: string;
  if (current <= 0) { label = 'Dead'; className = 'text-red-600'; }
  else if (pct <= 25) { label = 'Near Death'; className = 'text-red-500'; }
  else if (pct <= 50) { label = 'Bloodied'; className = 'text-orange-500'; }
  else if (pct <= 75) { label = 'Wounded'; className = 'text-yellow-500'; }
  else { label = 'Healthy'; className = 'text-green-500'; }

  return <span className={`text-[10px] font-[Cinzel] uppercase tracking-wider ${className}`}>{label}</span>;
}

interface ConditionDurationOpts {
  durationRounds?: number;
  endsOn?: 'start' | 'end';
  source?: string;
}

function ConditionPicker({
  current,
  onToggle,
  onAddWithDuration,
  onClose,
  conditionLabels,
}: {
  current: import('@/types/live-session').ConditionEntry[];
  onToggle: (condition: string) => void;
  onAddWithDuration: (condition: string, opts: ConditionDurationOpts) => void;
  onClose: () => void;
  conditionLabels: string[];
}) {
  const activeNames = new Set(current.map((c) => c.name));
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [draftRounds, setDraftRounds] = useState('');
  const [draftEndsOn, setDraftEndsOn] = useState<'start' | 'end'>('end');
  const [draftSource, setDraftSource] = useState('');

  function handleConditionClick(c: string) {
    if (activeNames.has(c)) {
      onToggle(c);
      return;
    }
    if (configuring === c) {
      setConfiguring(null);
    } else {
      setConfiguring(c);
      setDraftRounds('');
      setDraftEndsOn('end');
      setDraftSource('');
    }
  }

  function handleApply() {
    if (!configuring) return;
    const rounds = parseInt(draftRounds, 10);
    const opts: ConditionDurationOpts = {};
    if (rounds > 0) {
      opts.durationRounds = rounds;
      opts.endsOn = draftEndsOn;
    }
    if (draftSource.trim()) opts.source = draftSource.trim();
    onAddWithDuration(configuring, opts);
    setConfiguring(null);
  }

  function handleQuickAdd() {
    if (!configuring) return;
    onAddWithDuration(configuring, {});
    setConfiguring(null);
  }

  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-64 max-w-[calc(100vw-3rem)] rounded-md border border-border bg-card p-2 shadow-warm-lg">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Conditions</span>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </div>
      <p className="mb-1 text-[10px] text-muted-foreground">Click active to remove, inactive to configure</p>
      <div className="max-h-40 overflow-y-auto pr-0.5">
        <div className="flex flex-wrap gap-1">
        {conditionLabels.map((c) => {
          const active = activeNames.has(c);
          const isConfiguring = configuring === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => handleConditionClick(c)}
              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                active
                  ? 'bg-arcane/30 text-arcane ring-1 ring-arcane/50'
                  : isConfiguring
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {c}
            </button>
          );
        })}
        </div>
      </div>
      {configuring && !activeNames.has(configuring) && (
        <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
          <p className="text-[10px] font-medium text-foreground">{configuring}</p>
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-muted-foreground">Rounds</label>
            <input
              type="number"
              min={1}
              value={draftRounds}
              onChange={(e) => setDraftRounds(e.target.value)}
              placeholder="∞"
              className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]"
            />
            <label className="text-[9px] text-muted-foreground">Ends on</label>
            <select
              value={draftEndsOn}
              onChange={(e) => setDraftEndsOn(e.target.value as 'start' | 'end')}
              className="rounded border border-border bg-background px-1 py-0.5 text-[10px]"
            >
              <option value="end">End</option>
              <option value="start">Start</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-muted-foreground">Source</label>
            <input
              type="text"
              value={draftSource}
              onChange={(e) => setDraftSource(e.target.value)}
              placeholder="e.g. Hold Person"
              className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]"
            />
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleApply}
              className="rounded border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/25"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleQuickAdd}
              className="rounded border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
            >
              No Duration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function InitiativeTracker({ campaignId, isDM, selectedEntryId, onSelectEntryId }: InitiativeTrackerProps) {
  const queryClient = useQueryClient();
  const { data: initiative } = useInitiative(campaignId);
  const { data: rules } = useCombatRules(campaignId);
  const addEntry = useAddInitiativeEntry(campaignId);
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const removeEntry = useRemoveInitiativeEntry(campaignId);
  const startCombat = useStartCombat(campaignId);
  const nextTurn = useNextTurn(campaignId);
  const endCombat = useEndCombat(campaignId);
  const roundLabel = useRoundLabel(campaignId);

  const hasSurprise = useCampaignModuleEnabled(campaignId, 'surprise-rounds');
  const hasPf2eInitiative = useCampaignModuleEnabled(campaignId, 'initiative-pf2e');
  const hasDualHp = useCampaignModuleEnabled(campaignId, 'hp-dual');
  const conditionLabels = rules?.conditions?.map((c) => c.label) ?? [...FALLBACK_CONDITIONS];

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddInitiativeEntryRequest>({ ...EMPTY_FORM });
  const [editingHpId, setEditingHpId] = useState<string | null>(null);
  const [hpInput, setHpInput] = useState('');
  const [editingInitId, setEditingInitId] = useState<string | null>(null);
  const [initInput, setInitInput] = useState('');
  const [removeConfirmEntry, setRemoveConfirmEntry] = useState<InitiativeEntry | null>(null);
  const [conditionPickerEntryId, setConditionPickerEntryId] = useState<string | null>(null);
  const [rollingInitiative, setRollingInitiative] = useState(false);
  const [rollConfirmOpen, setRollConfirmOpen] = useState(false);
  const [draftAttacks, setDraftAttacks] = useState<EnemyAttack[]>([]);
  const [aoeSelected, setAoeSelected] = useState<Set<string>>(new Set());
  const [aoeInput, setAoeInput] = useState('');
  const [timerEnabled, setTimerEnabled] = useState(() => {
    try { return localStorage.getItem(TURN_TIMER_STORAGE_KEY) === 'true'; } catch { return false; }
  });
  const [turnElapsed, setTurnElapsed] = useState(0);
  const turnStartRef = useRef<number>(Date.now());
  const hpInputRef = useRef<HTMLInputElement>(null);
  const initInputRef = useRef<HTMLInputElement>(null);
  const aoeInputRef = useRef<HTMLInputElement>(null);

  // Listen for WebSocket initiative updates and sync-response
  useEffect(() => {
    const socket = getSocket();

    function onInitiativeUpdated(event: InitiativeUpdatedEvent) {
      queryClient.setQueryData<Initiative>(['initiative', campaignId], event.initiative);
    }

    // On sync-response, update initiative data only if it actually changed
    function onSyncResponse(data: { initiative?: Initiative | null }) {
      if (data.initiative) {
        const current = queryClient.getQueryData<Initiative>(['initiative', campaignId]);
        // Compare as strings to handle Date vs ISO-string mismatch from JSON serialization
        const currentTs = current?.lastUpdatedAt ? String(current.lastUpdatedAt) : '';
        const incomingTs = data.initiative.lastUpdatedAt ? String(data.initiative.lastUpdatedAt) : '';
        if (!current || currentTs !== incomingTs) {
          queryClient.setQueryData<Initiative>(['initiative', campaignId], data.initiative);
        }
      }
    }

    socket.on('initiative-updated', onInitiativeUpdated);
    socket.on('sync-response', onSyncResponse);
    return () => {
      socket.off('initiative-updated', onInitiativeUpdated);
      socket.off('sync-response', onSyncResponse);
    };
  }, [campaignId, queryClient]);

  // Focus HP input when editing
  useEffect(() => {
    if (editingHpId && hpInputRef.current) {
      hpInputRef.current.focus();
      hpInputRef.current.select();
    }
  }, [editingHpId]);

  // Focus initiative input when editing
  useEffect(() => {
    if (editingInitId && initInputRef.current) {
      initInputRef.current.focus();
      initInputRef.current.select();
    }
  }, [editingInitId]);

  // Reset turn timer when turn changes
  useEffect(() => {
    turnStartRef.current = Date.now();
    setTurnElapsed(0);
  }, [initiative?.currentTurn, initiative?.round]);

  // Tick the turn timer every second when active
  useEffect(() => {
    if (!timerEnabled || !initiative?.isActive) return;
    const interval = setInterval(() => {
      setTurnElapsed(Math.floor((Date.now() - turnStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnabled, initiative?.isActive]);

  const handleAddEntry = useCallback(() => {
    if (!form.name.trim() || form.initiativeRoll === undefined) return;
    const trimmedName = form.name.trim();
    addEntry.mutate(
      {
        ...form,
        name: trimmedName,
        currentHp: form.currentHp || undefined,
        maxHp: form.maxHp || undefined,
        ac: form.ac || undefined,
      },
      {
        onSuccess: () => {
          if (form.type !== 'pc' && draftAttacks.length > 0) {
            setCustomNpcAttacks(
              getCustomNpcAttackKey(campaignId, trimmedName),
              draftAttacks,
            );
          }
          setForm({ ...EMPTY_FORM });
          setDraftAttacks([]);
          setShowAddForm(false);
        },
      },
    );
  }, [campaignId, form, addEntry, draftAttacks]);

  const handleHpSubmit = useCallback(
    (entryId: string, currentHp: number | undefined) => {
      const trimmed = hpInput.trim();
      if (!trimmed) { setEditingHpId(null); return; }

      let newHp: number;
      // Support delta notation: "+5" adds, "-3" subtracts from current HP
      if ((trimmed.startsWith('+') || trimmed.startsWith('-')) && currentHp != null) {
        const delta = parseInt(trimmed, 10);
        if (isNaN(delta)) { setEditingHpId(null); return; }
        newHp = currentHp + delta;
      } else {
        newHp = parseInt(trimmed, 10);
        if (isNaN(newHp)) { setEditingHpId(null); return; }
      }

      updateEntry.mutate(
        { entryId, body: { currentHp: Math.max(0, newHp) } },
        { onSettled: () => setEditingHpId(null) },
      );
    },
    [hpInput, updateEntry],
  );

  const handleInitSubmit = useCallback(
    (entryId: string) => {
      const val = parseInt(initInput, 10);
      if (isNaN(val)) {
        setEditingInitId(null);
        return;
      }
      updateEntry.mutate(
        { entryId, body: { initiativeRoll: val } },
        { onSettled: () => setEditingInitId(null) },
      );
    },
    [initInput, updateEntry],
  );

  const handleToggleCondition = useCallback(
    (entryId: string, conditionName: string) => {
      const entry = initiative?.entries.find((e) => e.id === entryId);
      if (!entry) return;
      const current = entry.conditions ?? [];
      const hasCondition = current.some((c) => c.name === conditionName);
      const updated = hasCondition
        ? current.filter((c) => c.name !== conditionName)
        : [...current, { id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: conditionName }];
      updateEntry.mutate({ entryId, body: { conditions: updated } });
    },
    [initiative?.entries, updateEntry],
  );

  const handleAddConditionWithDuration = useCallback(
    (entryId: string, conditionName: string, opts: ConditionDurationOpts) => {
      const entry = initiative?.entries.find((e) => e.id === entryId);
      if (!entry) return;
      const current = entry.conditions ?? [];
      if (current.some((c) => c.name === conditionName)) return;
      const newCond: import('@/types/live-session').ConditionEntry = {
        id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: conditionName,
      };
      if (opts.durationRounds) {
        newCond.durationRounds = opts.durationRounds;
        newCond.remainingRounds = opts.durationRounds;
        newCond.endsOn = opts.endsOn ?? 'end';
        newCond.appliedRound = initiative?.round;
      }
      if (opts.source) newCond.source = opts.source;
      updateEntry.mutate({ entryId, body: { conditions: [...current, newCond] } });
    },
    [initiative?.entries, initiative?.round, updateEntry],
  );

  const doRollAll = useCallback(async () => {
    if (!initiative?.entries.length) return;
    setRollingInitiative(true);
    try {
      for (const entry of initiative.entries) {
        if (entry.type === 'pc') continue;
        const roll = Math.floor(Math.random() * 20) + 1 + (entry.initiativeBonus || 0);
        await updateEntry.mutateAsync({ entryId: entry.id, body: { initiativeRoll: roll } });
      }
    } finally {
      setRollingInitiative(false);
    }
  }, [initiative?.entries, updateEntry]);

  const handleRollAll = useCallback(() => {
    if (!initiative?.entries.length) return;
    // Check if any non-PC entry already has a non-zero roll
    const hasExistingRolls = initiative.entries.some(
      (e) => e.type !== 'pc' && e.initiativeRoll > 0,
    );
    if (hasExistingRolls) {
      setRollConfirmOpen(true);
    } else {
      doRollAll();
    }
  }, [initiative?.entries, doRollAll]);

  const handleAoeDamage = useCallback(async () => {
    const trimmed = aoeInput.trim();
    if (!trimmed || aoeSelected.size === 0 || !initiative?.entries) return;
    for (const entry of initiative.entries) {
      if (!aoeSelected.has(entry.id) || entry.currentHp == null) continue;
      let newHp: number;
      if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
        const delta = parseInt(trimmed, 10);
        if (isNaN(delta)) continue;
        newHp = entry.currentHp + delta;
      } else {
        const val = parseInt(trimmed, 10);
        if (isNaN(val)) continue;
        newHp = val;
      }
      await updateEntry.mutateAsync({ entryId: entry.id, body: { currentHp: Math.max(0, newHp) } });
    }
    setAoeInput('');
    setAoeSelected(new Set());
  }, [aoeInput, aoeSelected, initiative?.entries, updateEntry]);

  const handleDuplicateEntry = useCallback(
    (entry: InitiativeEntry) => {
      // Increment trailing number in name, or append " 2"
      const match = entry.name.match(/^(.*?)(\d+)$/);
      let newName: string;
      if (match) {
        const nextNum = parseInt(match[2], 10) + 1;
        newName = `${match[1]}${nextNum}`;
      } else {
        newName = `${entry.name} 2`;
      }
      const roll = Math.floor(Math.random() * 20) + 1 + (entry.initiativeBonus || 0);
      addEntry.mutate({
        type: entry.type,
        name: newName,
        initiativeRoll: roll,
        initiativeBonus: entry.initiativeBonus,
        currentHp: entry.maxHp,
        maxHp: entry.maxHp,
        ac: entry.ac,
        isHidden: entry.isHidden,
      });
    },
    [addEntry],
  );

  const sortedEntries = initiative
    ? [...initiative.entries].sort((a, b) => b.initiativeRoll - a.initiativeRoll)
    : [];

  // Filter hidden entries for non-DM users
  const visibleEntries = isDM
    ? sortedEntries
    : sortedEntries.filter((e) => !e.isHidden);
  const selectedEntry = selectedEntryId
    ? sortedEntries.find((entry) => entry.id === selectedEntryId)
    : null;

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
        <div className="flex items-center gap-2">
          {initiative?.isActive && timerEnabled && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums font-[Cinzel] text-muted-foreground">
              {formatElapsed(turnElapsed)}
            </span>
          )}
          {initiative?.isActive && (
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary tabular-nums font-[Cinzel] shadow-glow-sm">
              {roundLabel} {initiative.round}
            </span>
          )}
          {isDM && (
            <button
              type="button"
              onClick={() => {
                const next = !timerEnabled;
                setTimerEnabled(next);
                try { localStorage.setItem(TURN_TIMER_STORAGE_KEY, String(next)); } catch { /* ignore storage errors */ }
              }}
              className={`rounded p-1 transition-colors ${timerEnabled ? 'text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'}`}
              title={timerEnabled ? 'Disable turn timer' : 'Enable turn timer'}
            >
              {timerEnabled ? <Timer className="h-3.5 w-3.5" /> : <TimerOff className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
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
          {!initiative?.isActive && sortedEntries.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={rollingInitiative}
              onClick={handleRollAll}
              title="Auto-roll initiative for all listed entries"
            >
              <Dices className="mr-1.5 h-3.5 w-3.5" />
              {rollingInitiative ? 'Rolling...' : 'Roll NPC Init'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm((v) => !v)}
            title={showAddForm ? 'Close add entry form' : 'Add a combatant to initiative'}
          >
            {showAddForm ? 'Cancel' : 'Add Combatant'}
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
              <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                {hasPf2eInitiative ? 'Skill Bonus' : 'Bonus'}
              </label>
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

            {/* PF2e Exploration Activity */}
            {hasPf2eInitiative && (
              <div className="col-span-2">
                <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                  Exploration Activity
                </label>
                <select
                  value={(form as AddInitiativeEntryRequest & { systemData?: Record<string, unknown> }).systemData?.explorationActivity as string ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      systemData: { ...f.systemData, explorationActivity: e.target.value || undefined },
                    }))
                  }
                  className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Perception (default)</option>
                  <option value="Avoid Notice">Avoid Notice (Stealth)</option>
                  <option value="Detect Magic">Detect Magic (Arcana/etc.)</option>
                  <option value="Scout">Scout (Perception)</option>
                  <option value="Search">Search (Perception/etc.)</option>
                </select>
                <p className="mt-0.5 text-[9px] text-muted-foreground">
                  Use the skill bonus from the chosen activity
                </p>
              </div>
            )}

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

            {/* Stress Threshold (hp-dual) */}
            {hasDualHp && (
              <div className="col-span-2">
                <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Stress Threshold</label>
                <input
                  type="number"
                  value={(form as AddInitiativeEntryRequest & { systemData?: Record<string, unknown> }).systemData?.stressThreshold as number ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      systemData: {
                        ...f.systemData,
                        stressThreshold: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        stress: f.systemData?.stress ?? 0,
                      },
                    }))
                  }
                  placeholder="6"
                  className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-0.5 text-[9px] text-muted-foreground">
                  When stress reaches the threshold, the character is in crisis
                </p>
              </div>
            )}

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

            {/* Hidden + Surprised */}
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground font-[Cinzel]">
                <input
                  type="checkbox"
                  checked={form.isHidden ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, isHidden: e.target.checked }))}
                  className="rounded border-border"
                />
                Hidden
              </label>
              {hasSurprise && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground font-[Cinzel]">
                  <input
                    type="checkbox"
                    checked={form.isSurprised ?? false}
                    onChange={(e) => setForm((f) => ({ ...f, isSurprised: e.target.checked }))}
                    className="rounded border-border"
                  />
                  Surprised
                </label>
              )}
            </div>

            {/* Optional attacks for NPC/monster/other */}
            {form.type !== 'pc' && (
              <div className="col-span-2 rounded border border-border/60 bg-background/30 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                    Attacks (optional)
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftAttacks((prev) => [
                        ...prev,
                        { name: '', bonus: 0, damage: '1d6', actionCost: 'action' },
                      ])
                    }
                    className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20"
                  >
                    Add Attack
                  </button>
                </div>
                {draftAttacks.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">
                    Leave blank if this combatant should use template/default attacks.
                  </p>
                ) : (
                  <div className="max-h-36 space-y-1 overflow-y-auto pr-0.5">
                    {draftAttacks.map((attack, index) => (
                      <div key={`${index}-${attack.name}`} className="grid grid-cols-1 gap-1 sm:grid-cols-[1.2fr_0.5fr_0.8fr_0.8fr_auto]">
                        <input
                          type="text"
                          value={attack.name}
                          onChange={(e) =>
                            setDraftAttacks((prev) =>
                              prev.map((a, i) => (i === index ? { ...a, name: e.target.value } : a)),
                            )
                          }
                          placeholder="Attack name"
                          className="rounded border border-input bg-input px-2 py-1 text-[10px] text-foreground"
                        />
                        <input
                          type="number"
                          value={attack.bonus}
                          onChange={(e) =>
                            setDraftAttacks((prev) =>
                              prev.map((a, i) => (i === index ? { ...a, bonus: parseInt(e.target.value, 10) || 0 } : a)),
                            )
                          }
                          placeholder="+5"
                          className="rounded border border-input bg-input px-2 py-1 text-[10px] text-foreground"
                        />
                        <input
                          type="text"
                          value={attack.damage}
                          onChange={(e) =>
                            setDraftAttacks((prev) =>
                              prev.map((a, i) => (i === index ? { ...a, damage: e.target.value } : a)),
                            )
                          }
                          placeholder="1d6+2"
                          className="rounded border border-input bg-input px-2 py-1 text-[10px] text-foreground"
                        />
                        <select
                          value={attack.actionCost ?? 'action'}
                          onChange={(e) =>
                            setDraftAttacks((prev) =>
                              prev.map((a, i) => (
                                i === index
                                  ? { ...a, actionCost: e.target.value as EnemyAttack['actionCost'] }
                                  : a
                              )),
                            )
                          }
                          className="rounded border border-input bg-input px-2 py-1 text-[10px] text-foreground"
                        >
                          <option value="action">Action</option>
                          <option value="bonus">Bonus</option>
                          <option value="reaction">Reaction</option>
                          <option value="free">Free</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setDraftAttacks((prev) => prev.filter((_, i) => i !== index))}
                          className="rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] text-destructive hover:bg-destructive/20"
                          title="Remove attack"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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

      {/* AoE damage/heal bar */}
      {isDM && aoeSelected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-arcane/30 bg-arcane/10 px-3 py-2">
          <Crosshair className="h-3.5 w-3.5 flex-shrink-0 text-arcane" />
          <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-arcane">
            {aoeSelected.size} selected
          </span>
          <input
            ref={aoeInputRef}
            type="text"
            inputMode="numeric"
            value={aoeInput}
            onChange={(e) => setAoeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAoeDamage(); }}
            placeholder="-10 / +5"
            className="w-20 input-carved rounded-sm border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-arcane"
          />
          <Button size="sm" variant="outline" onClick={handleAoeDamage} disabled={!aoeInput.trim()}>
            Apply
          </Button>
          <button
            type="button"
            onClick={() => { setAoeSelected(new Set()); setAoeInput(''); }}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
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
                onClick={() => onSelectEntryId?.(entry.id)}
                className={`initiative-row flex items-center gap-2.5 rounded-md px-3 py-2 transition-all ${
                  isCurrent
                    ? 'border-l-4 border-primary/80 bg-primary/10 shadow-[0_0_10px_hsla(38,90%,50%,0.12)]'
                    : isMapSelected
                      ? 'border-l-4 border-blue-400/80 bg-blue-500/10 shadow-[0_0_6px_hsla(220,80%,60%,0.12)]'
                      : isHidden
                        ? 'border-l-4 border-dashed border-iron/40 opacity-50'
                        : 'border-l-4 border-transparent'
                } ${onSelectEntryId ? 'cursor-pointer hover:bg-accent/35' : ''}`}
              >
                {/* AoE select checkbox (DM only, entries with HP) */}
                {isDM && entry.currentHp != null && (
                  <input
                    type="checkbox"
                    checked={aoeSelected.has(entry.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setAoeSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(entry.id);
                        else next.delete(entry.id);
                        return next;
                      });
                    }}
                    className="h-3 w-3 flex-shrink-0 rounded border-border accent-arcane"
                    title="Select for AoE damage/heal"
                  />
                )}

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
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground font-[Cinzel]">
                      {entry.name}
                    </span>
                    {entry.isConcentrating && (
                      <span title="Concentrating" className="text-amber-400">
                        <Zap className="h-3 w-3" />
                      </span>
                    )}
                    {entry.deathSaves && (
                      <span title="Death saves active" className="text-red-400">
                        <Skull className="h-3 w-3" />
                      </span>
                    )}
                    {isHidden && isDM && (
                      <span className="text-muted-foreground" title="Hidden from players">
                        &#128065;&#xFE0E;
                      </span>
                    )}
                  </div>
                  {renderConditions(entry, isDM, conditionPickerEntryId, setConditionPickerEntryId, handleToggleCondition, handleAddConditionWithDuration, conditionLabels)}
                </div>

                {/* AC badge — hide from players for non-PC entries */}
                {entry.ac != null && (isDM || entry.type === 'pc') && (
                  <span
                    className="flex-shrink-0 rounded border border-iron/30 bg-iron/20 px-1.5 py-0.5 text-xs tabular-nums text-iron font-[Cinzel]"
                    title="Armor Class"
                  >
                    AC {entry.ac}
                  </span>
                )}

                {/* HP display — DM sees everything, players see descriptors for enemies */}
                {entry.currentHp != null && entry.maxHp != null && (
                  <div className="flex-shrink-0">
                    {isDM ? renderDMHp(entry, editingHpId, hpInput, hpInputRef, setEditingHpId, setHpInput, handleHpSubmit) : (
                      entry.type === 'pc'
                        ? <HpBar current={entry.currentHp} max={entry.maxHp} />
                        : <HealthDescriptor current={entry.currentHp} max={entry.maxHp} />
                    )}
                    {isDM && (entry.tempHp ?? 0) > 0 && (
                      <p className="mt-0.5 text-right text-[10px] text-cyan-300">+{entry.tempHp} temp</p>
                    )}
                  </div>
                )}

                {/* Initiative roll — DM can click to edit */}
                {isDM && editingInitId === entry.id ? (
                  <input
                    ref={initInputRef}
                    type="number"
                    value={initInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setInitInput(e.target.value)}
                    onBlur={() => handleInitSubmit(entry.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInitSubmit(entry.id);
                      if (e.key === 'Escape') setEditingInitId(null);
                    }}
                    className="w-12 flex-shrink-0 input-carved rounded-sm border border-border bg-background px-1 py-0.5 text-right text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={!isDM}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingInitId(entry.id);
                      setInitInput(String(entry.initiativeRoll));
                    }}
                    className={`flex-shrink-0 w-8 text-right text-sm font-[Cinzel] font-bold tabular-nums text-foreground ${isDM ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                    title={isDM ? 'Click to set initiative' : undefined}
                  >
                    {entry.initiativeRoll}
                  </button>
                )}

                {/* Clone button (DM, non-PC only) */}
                {isDM && entry.type !== 'pc' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateEntry(entry);
                    }}
                    className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-primary/20 hover:text-primary"
                    title={`Duplicate ${entry.name}`}
                    aria-label={`Duplicate ${entry.name}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Remove button (DM only) */}
                {isDM && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRemoveConfirmEntry(entry);
                    }}
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

      {selectedEntry?.deathSaves && (
        <div className="mt-2 rounded border border-border/60 bg-background/30 p-2">
          <DeathSavesTracker
            campaignId={campaignId}
            entry={selectedEntry}
            canEditPcDeathSaves={isDM}
            canEditNpcDeathSaves={isDM && !selectedEntry.characterId}
          />
        </div>
      )}

      {selectedEntry && (
        <DownedStatePanel
          campaignId={campaignId}
          entry={selectedEntry}
          canEdit={isDM}
        />
      )}

      <ConfirmDialog
        open={!!removeConfirmEntry}
        title="Remove Combatant"
        description={removeConfirmEntry ? `Remove ${removeConfirmEntry.name} from initiative?` : ''}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => {
          if (removeConfirmEntry) {
            removeEntry.mutate(removeConfirmEntry.id, {
              onSettled: () => setRemoveConfirmEntry(null),
            });
          }
        }}
        onCancel={() => setRemoveConfirmEntry(null)}
        isPending={removeEntry.isPending}
      />

      <ConfirmDialog
        open={rollConfirmOpen}
        title="Re-roll Initiative"
        description="Some NPCs already have initiative rolls. Re-rolling will overwrite their current values."
        confirmLabel="Re-roll"
        onConfirm={() => { setRollConfirmOpen(false); doRollAll(); }}
        onCancel={() => setRollConfirmOpen(false)}
      />
    </div>
  );
}

function normalizeCombatantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+#?\d+$/g, '')
    .trim();
}

function getCustomNpcAttackKey(campaignId: string, name: string): string {
  return `${campaignId}:${normalizeCombatantName(name)}`;
}

function setCustomNpcAttacks(key: string, attacks: EnemyAttack[]): void {
  try {
    const raw = localStorage.getItem(NPC_CUSTOM_ATTACKS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, EnemyAttack[]>) : {};
    parsed[key] = attacks
      .map((attack) => ({
        name: attack.name.trim(),
        bonus: Number.isFinite(attack.bonus) ? attack.bonus : 0,
        damage: attack.damage.trim(),
        actionCost: attack.actionCost ?? 'action',
        range: attack.range?.trim() || undefined,
        description: attack.description?.trim() || undefined,
      }))
      .filter((attack) => attack.name.length > 0 && attack.damage.length > 0);
    localStorage.setItem(NPC_CUSTOM_ATTACKS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore localStorage failures
  }
}

function renderConditions(
  entry: InitiativeEntry,
  isDM: boolean,
  conditionPickerEntryId: string | null,
  setConditionPickerEntryId: (id: string | null) => void,
  handleToggleCondition: (entryId: string, condition: string) => void,
  handleAddCondition: (entryId: string, condition: string, opts: ConditionDurationOpts) => void,
  conditionLabels: string[],
) {
  const conditions = entry.conditions ?? [];
  const showPicker = isDM && conditionPickerEntryId === entry.id;

  if (!isDM && conditions.length === 0) return null;

  return (
    <div className="relative mt-0.5 flex max-w-full flex-wrap items-center gap-1 overflow-hidden">
      {conditions.map((c) => {
        const isExpiring = c.remainingRounds != null && c.remainingRounds <= 1;
        const durationLabel = c.remainingRounds != null ? ` (${c.remainingRounds}r)` : '';
        const tooltip = [
          c.name,
          c.source ? `Source: ${c.source}` : '',
          c.saveDC ? `DC ${c.saveDC} ${c.saveAbility ?? ''}` : '',
          c.remainingRounds != null ? `${c.remainingRounds} round${c.remainingRounds !== 1 ? 's' : ''} left` : '',
        ].filter(Boolean).join(' · ');
        return (
          <span
            key={c.id}
            className={`rounded-full px-2 py-0.5 text-xs ${
              isExpiring
                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                : 'bg-arcane/20 text-arcane'
            } ${isDM ? 'cursor-pointer hover:bg-destructive/20 hover:text-destructive' : ''}`}
            onClick={isDM ? (e) => { e.stopPropagation(); handleToggleCondition(entry.id, c.name); } : undefined}
            title={isDM ? `Remove ${c.name}` : tooltip}
          >
            {c.name}{durationLabel}
          </span>
        );
      })}
      {isDM && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConditionPickerEntryId(showPicker ? null : entry.id);
          }}
          className="inline-flex max-w-full items-center gap-1 rounded-sm border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
          title={showPicker ? 'Close condition picker' : 'Add or remove conditions'}
        >
          <Plus className="h-3 w-3" />
          <span className="max-w-[72px] truncate">
            {conditions.length > 0 ? `Cond (${conditions.length})` : 'Conditions'}
          </span>
        </button>
      )}
      {showPicker && (
        <ConditionPicker
          current={conditions}
          onToggle={(c) => handleToggleCondition(entry.id, c)}
          onAddWithDuration={(c, opts) => handleAddCondition(entry.id, c, opts)}
          onClose={() => setConditionPickerEntryId(null)}
          conditionLabels={conditionLabels}
        />
      )}
    </div>
  );
}

function renderDMHp(
  entry: InitiativeEntry,
  editingHpId: string | null,
  hpInput: string,
  hpInputRef: React.RefObject<HTMLInputElement | null>,
  setEditingHpId: (id: string | null) => void,
  setHpInput: (val: string) => void,
  handleHpSubmit: (entryId: string, currentHp: number | undefined) => void,
) {
  if (editingHpId === entry.id) {
    return (
      <input
        ref={hpInputRef}
        type="text"
        inputMode="numeric"
        value={hpInput}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setHpInput(e.target.value)}
        onBlur={() => handleHpSubmit(entry.id, entry.currentHp)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleHpSubmit(entry.id, entry.currentHp);
          if (e.key === 'Escape') setEditingHpId(null);
        }}
        placeholder="+5 / -3 / 20"
        className="w-16 input-carved rounded-sm border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setEditingHpId(entry.id);
        setHpInput(String(entry.currentHp ?? 0));
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className="cursor-pointer"
      title="Click to edit HP"
    >
      <HpBar current={entry.currentHp!} max={entry.maxHp!} />
    </button>
  );
}
