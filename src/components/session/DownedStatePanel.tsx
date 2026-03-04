import { useState } from 'react';
import { Skull, Heart, AlertTriangle } from 'lucide-react';
import { useCombatRules, useUpdateInitiativeEntry } from '@/hooks/useLiveSession';
import { mergeSystemData } from '@/lib/system-data';
import type { InitiativeEntry } from '@/types/live-session';

interface DownedStatePanelProps {
  campaignId: string;
  entry: InitiativeEntry;
  canEdit: boolean;
}

/**
 * Renders system-appropriate downed state UI based on the combat rules profile.
 * - death-saves → handled by DeathSavesTracker (not here)
 * - dying-value → PF2e dying/wounded tracker
 * - stress-track → Fate stress boxes + consequences
 * - last-breath → Daggerheart narrative prompt
 * - none → nothing
 */
export function DownedStatePanel({ campaignId, entry, canEdit }: DownedStatePanelProps) {
  const { data: rules } = useCombatRules(campaignId);

  if (!rules) return null;

  const { type } = rules.deathStateModel;

  // death-saves is handled by DeathSavesTracker, 'none' shows nothing
  if (type === 'death-saves' || type === 'none') return null;

  // Only show when entry is at 0 HP (or has existing downed data)
  const isDown = (entry.currentHp ?? 1) <= 0;
  const hasDowned = !!entry.systemData?.downed;
  if (!isDown && !hasDowned) return null;

  switch (type) {
    case 'dying-value':
      return <DyingValuePanel campaignId={campaignId} entry={entry} canEdit={canEdit} config={rules.deathStateModel.config} />;
    case 'stress-track':
      return <StressTrackPanel campaignId={campaignId} entry={entry} canEdit={canEdit} config={rules.deathStateModel.config} />;
    case 'last-breath':
      return <LastBreathPanel campaignId={campaignId} entry={entry} canEdit={canEdit} config={rules.deathStateModel.config} />;
    default:
      return null;
  }
}

// ── PF2e Dying Value Panel ──────────────────────────────────

function DyingValuePanel({
  campaignId,
  entry,
  canEdit,
  config,
}: {
  campaignId: string;
  entry: InitiativeEntry;
  canEdit: boolean;
  config: { maxDyingValue?: number };
}) {
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const downed = (entry.systemData?.downed ?? {}) as {
    dyingValue?: number;
    woundedValue?: number;
  };
  const maxDying = config.maxDyingValue ?? 4;
  const dying = downed.dyingValue ?? 0;
  const wounded = downed.woundedValue ?? 0;

  function setDowned(patch: Record<string, unknown>) {
    updateEntry.mutate({
      entryId: entry.id,
      body: {
        systemData: mergeSystemData(entry.systemData, { downed: patch }),
      },
    });
  }

  return (
    <div className="rounded border border-red-900/50 bg-red-950/20 p-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Skull className="h-3.5 w-3.5 text-red-400" />
        <span className="text-[10px] uppercase tracking-wide text-red-300">Dying / Wounded</span>
      </div>

      <div className="space-y-1.5">
        {/* Dying value */}
        <div className="flex items-center gap-2">
          <span className="w-16 text-[10px] text-muted-foreground">Dying</span>
          <div className="flex gap-0.5">
            {Array.from({ length: maxDying }).map((_, i) => (
              <span
                key={`dying-${i}`}
                className={`inline-block h-3 w-3 rounded-full border ${
                  i < dying ? 'border-red-500 bg-red-500' : 'border-muted-foreground/40'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">{dying}/{maxDying}</span>
        </div>

        {/* Wounded value */}
        <div className="flex items-center gap-2">
          <span className="w-16 text-[10px] text-muted-foreground">Wounded</span>
          <span className="text-xs font-medium text-amber-400">{wounded}</span>
        </div>
      </div>

      {canEdit && (
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setDowned({ dyingValue: Math.min(maxDying, dying + 1) })}
            disabled={updateEntry.isPending || dying >= maxDying}
            className="rounded border border-red-500/35 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-400 disabled:opacity-50"
          >
            +Dying
          </button>
          <button
            type="button"
            onClick={() => setDowned({ dyingValue: Math.max(0, dying - 1) })}
            disabled={updateEntry.isPending || dying <= 0}
            className="rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400 disabled:opacity-50"
          >
            -Dying
          </button>
          <button
            type="button"
            onClick={() => setDowned({ woundedValue: wounded + 1 })}
            disabled={updateEntry.isPending}
            className="rounded border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400 disabled:opacity-50"
          >
            +Wounded
          </button>
          <button
            type="button"
            onClick={() => setDowned({ dyingValue: 0, woundedValue: 0 })}
            disabled={updateEntry.isPending || (dying === 0 && wounded === 0)}
            className="rounded border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

// ── Fate Stress Track Panel ─────────────────────────────────

function StressTrackPanel({
  campaignId,
  entry,
  canEdit,
  config,
}: {
  campaignId: string;
  entry: InitiativeEntry;
  canEdit: boolean;
  config: { physicalBoxes?: number; mentalBoxes?: number; consequenceSlots?: string[] };
}) {
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const downed = (entry.systemData?.downed ?? {}) as {
    stressPhysical?: boolean[];
    stressMental?: boolean[];
    consequences?: Record<string, string>;
  };

  const physicalCount = config.physicalBoxes ?? 2;
  const mentalCount = config.mentalBoxes ?? 2;
  const consequenceSlots = config.consequenceSlots ?? ['mild', 'moderate', 'severe'];

  const physical = downed.stressPhysical ?? Array(physicalCount).fill(false);
  const mental = downed.stressMental ?? Array(mentalCount).fill(false);
  const consequences = downed.consequences ?? {};

  function setDowned(patch: Record<string, unknown>) {
    updateEntry.mutate({
      entryId: entry.id,
      body: {
        systemData: mergeSystemData(entry.systemData, { downed: patch }),
      },
    });
  }

  function toggleStress(track: 'stressPhysical' | 'stressMental', index: number) {
    const current = track === 'stressPhysical' ? [...physical] : [...mental];
    current[index] = !current[index];
    setDowned({ [track]: current });
  }

  return (
    <div className="rounded border border-violet-900/50 bg-violet-950/20 p-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] uppercase tracking-wide text-violet-300">Stress / Consequences</span>
      </div>

      <div className="space-y-1.5">
        {/* Physical stress */}
        <StressRow
          label="Physical"
          boxes={physical}
          canEdit={canEdit}
          disabled={updateEntry.isPending}
          onToggle={(i) => toggleStress('stressPhysical', i)}
        />
        {/* Mental stress */}
        <StressRow
          label="Mental"
          boxes={mental}
          canEdit={canEdit}
          disabled={updateEntry.isPending}
          onToggle={(i) => toggleStress('stressMental', i)}
        />
      </div>

      {/* Consequences */}
      <div className="mt-2 space-y-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Consequences</p>
        {consequenceSlots.map((slot) => (
          <ConsequenceRow
            key={slot}
            slot={slot}
            value={consequences[slot] ?? ''}
            canEdit={canEdit}
            disabled={updateEntry.isPending}
            onChange={(val) => {
              const updated = { ...consequences, [slot]: val };
              if (!val) delete updated[slot];
              setDowned({ consequences: Object.keys(updated).length > 0 ? updated : null });
            }}
          />
        ))}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={() => setDowned({
            stressPhysical: Array(physicalCount).fill(false),
            stressMental: Array(mentalCount).fill(false),
            consequences: null,
          })}
          disabled={updateEntry.isPending}
          className="mt-2 rounded border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground disabled:opacity-50"
        >
          Clear All
        </button>
      )}
    </div>
  );
}

function StressRow({
  label,
  boxes,
  canEdit,
  disabled,
  onToggle,
}: {
  label: string;
  boxes: boolean[];
  canEdit: boolean;
  disabled: boolean;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[10px] text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {boxes.map((filled, i) => (
          <button
            key={`${label}-${i}`}
            type="button"
            onClick={() => canEdit && onToggle(i)}
            disabled={!canEdit || disabled}
            className={`h-4 w-4 rounded border transition-colors ${
              filled
                ? 'border-violet-500 bg-violet-500'
                : 'border-muted-foreground/40 hover:border-violet-400'
            } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
          />
        ))}
      </div>
    </div>
  );
}

function ConsequenceRow({
  slot,
  value,
  canEdit,
  disabled,
  onChange,
}: {
  slot: string;
  value: string;
  canEdit: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const label = slot.charAt(0).toUpperCase() + slot.slice(1);

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-16 shrink-0 text-[10px] capitalize text-muted-foreground">{label}</span>
      {canEdit ? (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { if (draft !== value) onChange(draft); }}
          disabled={disabled}
          placeholder={`${label} consequence...`}
          className="min-w-0 flex-1 rounded border border-input bg-input px-1.5 py-0.5 text-[10px] text-foreground"
        />
      ) : (
        <span className="text-[10px] text-foreground">{value || '—'}</span>
      )}
    </div>
  );
}

// ── Daggerheart Last Breath Panel ───────────────────────────

function LastBreathPanel({
  campaignId,
  entry,
  canEdit,
  config,
}: {
  campaignId: string;
  entry: InitiativeEntry;
  canEdit: boolean;
  config: { promptText?: string };
}) {
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const downed = (entry.systemData?.downed ?? {}) as {
    lastBreathUsed?: boolean;
  };
  const used = downed.lastBreathUsed ?? false;

  function toggleLastBreath(next: boolean) {
    updateEntry.mutate({
      entryId: entry.id,
      body: {
        systemData: mergeSystemData(entry.systemData, {
          downed: { lastBreathUsed: next || null },
        }),
      },
    });
  }

  return (
    <div className="rounded border border-rose-900/50 bg-rose-950/20 p-2">
      <div className="mb-1 flex items-center gap-1.5">
        <Heart className="h-3.5 w-3.5 text-rose-400" />
        <span className="text-[10px] uppercase tracking-wide text-rose-300">Last Breath</span>
        {used && (
          <span className="rounded border border-rose-500/35 bg-rose-500/10 px-1 py-0.5 text-[9px] text-rose-300">
            Used
          </span>
        )}
      </div>

      {config.promptText && (
        <p className="mb-1.5 text-[10px] italic text-muted-foreground">{config.promptText}</p>
      )}

      {canEdit && (
        <button
          type="button"
          onClick={() => toggleLastBreath(!used)}
          disabled={updateEntry.isPending}
          className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider disabled:opacity-50 ${
            used
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/35 bg-rose-500/10 text-rose-400'
          }`}
        >
          {used ? 'Reset Last Breath' : 'Mark Last Breath Used'}
        </button>
      )}
    </div>
  );
}
