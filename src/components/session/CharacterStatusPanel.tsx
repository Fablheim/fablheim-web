import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, Eye, EyeOff, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useInitiative, useUpdateInitiativeEntry } from '@/hooks/useLiveSession';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
import type { InitiativeEntry, InitiativeUpdatedEvent } from '@/types/live-session';

const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
  'Exhaustion', 'Concentrating',
] as const;

const TYPE_BADGES: Record<InitiativeEntry['type'], string> = {
  pc: 'bg-blue-500/20 text-blue-400',
  npc: 'bg-green-500/20 text-green-400',
  monster: 'bg-red-500/20 text-red-400',
  other: 'bg-gray-500/20 text-gray-400',
};

const TYPE_LABELS: Record<InitiativeEntry['type'], string> = {
  pc: 'PC',
  npc: 'NPC',
  monster: 'Monster',
  other: 'Other',
};

interface CharacterStatusPanelProps {
  campaignId: string;
  isDM: boolean;
}

function getHpColor(current: number, max: number): string {
  if (current <= 0) return 'bg-red-500 animate-pulse';
  const pct = (current / max) * 100;
  if (pct > 50) return 'bg-green-500';
  if (pct >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
}

function HpBar({ current, max, obscured }: { current?: number; max?: number; obscured?: boolean }) {
  if (current == null || max == null || max === 0) return null;
  if (obscured) {
    return (
      <div className="mt-1.5">
        <div className="flex items-center justify-between font-[Cinzel] text-[10px] tracking-wider text-muted-foreground mb-0.5">
          <span>HP</span>
          <span className="italic font-['IM_Fell_English']">???</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full w-full bg-muted-foreground/20" />
        </div>
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between font-[Cinzel] text-[10px] tracking-wider text-muted-foreground mb-0.5">
        <span>HP</span>
        <span>{current} / {max}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getHpColor(current, max)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HpEditor({
  entry,
  campaignId,
}: {
  entry: InitiativeEntry;
  campaignId: string;
}) {
  const [hpInput, setHpInput] = useState('');
  const [mode, setMode] = useState<'damage' | 'heal' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateEntry = useUpdateInitiativeEntry(campaignId);

  useEffect(() => {
    if (mode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  function applyHpChange(delta: number) {
    if (entry.currentHp == null || entry.maxHp == null) return;
    const newHp = Math.max(0, Math.min(entry.maxHp, entry.currentHp + delta));
    updateEntry.mutate({ entryId: entry.id, body: { currentHp: newHp } });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseInt(hpInput, 10);
    if (isNaN(val) || val === 0) {
      setMode(null);
      setHpInput('');
      return;
    }
    applyHpChange(mode === 'damage' ? -val : val);
    setMode(null);
    setHpInput('');
  }

  if (entry.currentHp == null || entry.maxHp == null) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {mode === null ? (
        <>
          <button
            onClick={() => applyHpChange(-5)}
            className="rounded-sm border border-iron/40 bg-accent/60 px-2 py-1 font-[Cinzel] text-xs hover:border-gold/40 hover:shadow-glow-sm"
          >
            -5
          </button>
          <button
            onClick={() => applyHpChange(-1)}
            className="rounded-sm border border-iron/40 bg-accent/60 px-2 py-1 font-[Cinzel] text-xs hover:border-gold/40 hover:shadow-glow-sm"
          >
            -1
          </button>
          <button
            onClick={() => setMode('damage')}
            className="rounded-sm border border-blood/40 bg-blood/10 px-2 py-1 font-[Cinzel] text-xs text-[hsl(0,55%,55%)] hover:bg-blood/20"
          >
            Dmg
          </button>
          <button
            onClick={() => setMode('heal')}
            className="rounded-sm border border-forest/40 bg-forest/10 px-2 py-1 font-[Cinzel] text-xs text-[hsl(150,50%,55%)] hover:bg-forest/20"
          >
            Heal
          </button>
          <button
            onClick={() => applyHpChange(1)}
            className="rounded-sm border border-iron/40 bg-accent/60 px-2 py-1 font-[Cinzel] text-xs hover:border-gold/40 hover:shadow-glow-sm"
          >
            +1
          </button>
          <button
            onClick={() => applyHpChange(5)}
            className="rounded-sm border border-iron/40 bg-accent/60 px-2 py-1 font-[Cinzel] text-xs hover:border-gold/40 hover:shadow-glow-sm"
          >
            +5
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={hpInput}
            onChange={(e) => setHpInput(e.target.value)}
            placeholder={mode === 'damage' ? 'Dmg' : 'Heal'}
            className={`input-carved rounded-sm border px-2 py-1 text-sm w-16 bg-background ${
              mode === 'damage' ? 'border-blood/50' : 'border-forest/50'
            }`}
          />
          <button
            type="submit"
            className={`rounded-sm px-2 py-1 font-[Cinzel] text-xs font-medium ${
              mode === 'damage'
                ? 'bg-blood/20 text-[hsl(0,55%,55%)] hover:bg-blood/30'
                : 'bg-forest/20 text-[hsl(150,50%,55%)] hover:bg-forest/30'
            }`}
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => { setMode(null); setHpInput(''); }}
            className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </form>
      )}
    </div>
  );
}

function ConditionEditor({
  entry,
  campaignId,
}: {
  entry: InitiativeEntry;
  campaignId: string;
}) {
  const [open, setOpen] = useState(false);
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const activeConditions = entry.conditions ?? [];

  function toggleCondition(condition: string) {
    const updated = activeConditions.includes(condition)
      ? activeConditions.filter((c) => c !== condition)
      : [...activeConditions, condition];
    updateEntry.mutate({ entryId: entry.id, body: { conditions: updated } });
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        Conditions
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => toggleCondition(c)}
              className={`font-[Cinzel] text-[10px] rounded-sm tracking-wider px-2 py-0.5 transition-colors ${
                activeConditions.includes(c)
                  ? 'bg-arcane/25 text-arcane'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesEditor({
  entry,
  campaignId,
}: {
  entry: InitiativeEntry;
  campaignId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.notes ?? '');
  const updateEntry = useUpdateInitiativeEntry(campaignId);

  function save() {
    updateEntry.mutate({ entryId: entry.id, body: { notes: draft } });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className="w-full input-carved rounded-sm border border-border bg-background px-2 py-1 text-xs resize-none font-['IM_Fell_English'] italic"
          placeholder="Notes..."
        />
        <div className="mt-1 flex gap-1">
          <button
            onClick={save}
            className="rounded-sm border border-iron/40 bg-accent px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider hover:bg-accent/80"
          >
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setDraft(entry.notes ?? ''); }}
            className="rounded-sm px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mt-2 block text-xs text-muted-foreground hover:text-foreground truncate max-w-full text-left font-['IM_Fell_English'] italic"
    >
      {entry.notes ? entry.notes : '+ Add notes'}
    </button>
  );
}

function CharacterCard({
  entry,
  isDM,
  campaignId,
  isOwnCharacter,
}: {
  entry: InitiativeEntry;
  isDM: boolean;
  campaignId: string;
  isOwnCharacter: boolean;
}) {
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const isHidden = entry.isHidden;
  const showFullStats = isDM || isOwnCharacter;
  const obscureHp = !isDM && !isOwnCharacter && isHidden;

  return (
    <div
      className={`rounded-md border p-3 transition-all ${
        isHidden
          ? 'border-dashed border-border/50 opacity-50'
          : 'border-iron/30 bg-accent/20 texture-parchment hover:border-gold/30 hover:shadow-glow-sm'
      } ${!isHidden ? 'bg-accent/20' : 'bg-accent/30'}`}
    >
      {/* Header: Name + Type + AC */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-[Cinzel] font-medium text-sm text-foreground truncate">{entry.name}</span>
          <span className={`shrink-0 font-[Cinzel] text-[9px] uppercase tracking-wider rounded-sm px-1.5 py-0.5 font-medium leading-none ${TYPE_BADGES[entry.type]}`}>
            {TYPE_LABELS[entry.type]}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entry.ac != null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-iron/20 px-2 py-0.5 text-xs font-medium text-[hsl(210,40%,65%)] border border-iron/30 font-[Cinzel]">
              <Shield className="h-3 w-3" />
              {entry.ac}
            </span>
          )}
          {isDM && isHidden && (
            <span className="italic text-xs text-muted-foreground font-['IM_Fell_English']">Hidden</span>
          )}
        </div>
      </div>

      {/* HP Bar */}
      <HpBar current={entry.currentHp} max={entry.maxHp} obscured={obscureHp} />

      {/* Conditions */}
      {entry.conditions && entry.conditions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
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

      {/* Notes (visible on hover for players, always for DM) */}
      {showFullStats && entry.notes && !isDM && (
        <p className="mt-1.5 text-xs text-muted-foreground truncate font-['IM_Fell_English'] italic" title={entry.notes}>
          {entry.notes}
        </p>
      )}

      {/* DM Controls */}
      {isDM && (
        <div className="mt-1 border-t border-gold/10 pt-1">
          <HpEditor entry={entry} campaignId={campaignId} />
          <ConditionEditor entry={entry} campaignId={campaignId} />
          <NotesEditor entry={entry} campaignId={campaignId} />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() =>
                updateEntry.mutate({
                  entryId: entry.id,
                  body: { isHidden: !entry.isHidden },
                })
              }
              className="flex items-center gap-1 rounded-sm border border-iron/40 bg-accent px-2 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider hover:bg-accent/80"
            >
              {entry.isHidden ? (
                <>
                  <EyeOff className="h-3 w-3" /> Hidden
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" /> Visible
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CharacterStatusPanel({ campaignId, isDM }: CharacterStatusPanelProps) {
  const { user } = useAuth();
  const { data: initiative, isLoading, error } = useInitiative(campaignId);
  const queryClient = useQueryClient();

  // Listen for WebSocket initiative updates
  useEffect(() => {
    const socket = getSocket();

    function handleInitiativeUpdated(event: InitiativeUpdatedEvent) {
      queryClient.setQueryData(['initiative', campaignId], event.initiative);
    }

    socket.on('initiative-updated', handleInitiativeUpdated);
    return () => {
      socket.off('initiative-updated', handleInitiativeUpdated);
    };
  }, [campaignId, queryClient]);

  const entries = initiative?.entries ?? [];

  // Filter entries for player view: hide hidden entries unless it's the player's own character
  const visibleEntries = isDM
    ? entries
    : entries.filter((e) => !e.isHidden || (e.characterId && e.characterId === user?._id));

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-warm tavern-card iron-brackets texture-wood">
        <h3 className="text-carved font-[Cinzel] tracking-wider text-sm font-semibold text-foreground">
          Characters
        </h3>
        <p className="mt-3 text-xs text-muted-foreground animate-pulse font-['IM_Fell_English']">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-warm tavern-card iron-brackets texture-wood">
        <h3 className="text-carved font-[Cinzel] tracking-wider text-sm font-semibold text-foreground">
          Characters
        </h3>
        <p className="mt-3 text-xs text-destructive font-['IM_Fell_English']">Failed to load initiative data.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-warm tavern-card iron-brackets texture-wood">
      <h3 className="text-carved font-[Cinzel] tracking-wider text-sm font-semibold text-foreground">
        Characters
      </h3>

      {visibleEntries.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground font-['IM_Fell_English'] italic">No characters in initiative.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-2">
          {visibleEntries.map((entry) => (
            <CharacterCard
              key={entry.id}
              entry={entry}
              isDM={isDM}
              campaignId={campaignId}
              isOwnCharacter={!!entry.characterId && entry.characterId === user?._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
