import { Skull } from 'lucide-react';
import { useRollDeathSave } from '@/hooks/useCharacterCombat';
import { useUpdateDeathSaves, useCombatRules } from '@/hooks/useLiveSession';
import type { InitiativeEntry } from '@/types/live-session';

interface DeathSavesTrackerProps {
  campaignId: string;
  entry: InitiativeEntry;
  canEditPcDeathSaves?: boolean;
  canEditNpcDeathSaves?: boolean;
}

export function DeathSavesTracker({
  campaignId,
  entry,
  canEditPcDeathSaves = false,
  canEditNpcDeathSaves = false,
}: DeathSavesTrackerProps) {
  const { data: rules } = useCombatRules(campaignId);
  const rollDeathSave = useRollDeathSave();
  const updateDeathSaves = useUpdateDeathSaves(campaignId);
  const deathSaves = entry.deathSaves;

  // Only show death saves UI for systems that use the death-saves model
  if (!deathSaves || (rules && rules.deathStateModel.type !== 'death-saves')) return null;

  const isPc = !!entry.characterId;
  const canEditPc = isPc && canEditPcDeathSaves;
  const canEditNpc = !isPc && canEditNpcDeathSaves;

  return (
    <div className="rounded border border-red-900/50 bg-red-950/20 p-2">
      <div className="mb-1 flex items-center gap-1.5">
        <Skull className="h-3.5 w-3.5 text-red-400" />
        <span className="text-[10px] uppercase tracking-wide text-red-300">Death Saves</span>
      </div>
      <div className="space-y-1">
        <SaveRow label="Successes" count={deathSaves.successes} success />
        <SaveRow label="Failures" count={deathSaves.failures} />
      </div>
      {canEditPc && (
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={() => entry.characterId && rollDeathSave.mutate({ id: entry.characterId, result: 'success' })}
            disabled={rollDeathSave.isPending}
            className="rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400 disabled:opacity-50"
          >
            Success
          </button>
          <button
            type="button"
            onClick={() => entry.characterId && rollDeathSave.mutate({ id: entry.characterId, result: 'failure' })}
            disabled={rollDeathSave.isPending}
            className="rounded border border-destructive/35 bg-destructive/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-destructive disabled:opacity-50"
          >
            Failure
          </button>
        </div>
      )}
      {canEditNpc && (
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() =>
              updateDeathSaves.mutate({
                entryId: entry.id,
                body: { successes: Math.min(3, (deathSaves.successes ?? 0) + 1) },
              })
            }
            disabled={updateDeathSaves.isPending}
            className="rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400 disabled:opacity-50"
          >
            +Success
          </button>
          <button
            type="button"
            onClick={() =>
              updateDeathSaves.mutate({
                entryId: entry.id,
                body: { failures: Math.min(3, (deathSaves.failures ?? 0) + 1) },
              })
            }
            disabled={updateDeathSaves.isPending}
            className="rounded border border-destructive/35 bg-destructive/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-destructive disabled:opacity-50"
          >
            +Failure
          </button>
          <button
            type="button"
            onClick={() =>
              updateDeathSaves.mutate({
                entryId: entry.id,
                body: { clear: true },
              })
            }
            disabled={updateDeathSaves.isPending}
            className="rounded border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

function SaveRow({ label, count, success = false }: { label: string; count: number; success?: boolean }) {
  const activeClass = success
    ? 'border-emerald-500 bg-emerald-500'
    : 'border-red-500 bg-red-500';
  return (
    <div className="flex items-center gap-1">
      <span className="w-16 text-[10px] text-muted-foreground">{label}</span>
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={`${label}-${i}`}
          className={`inline-block h-3 w-3 rounded-full border ${i < count ? activeClass : 'border-muted-foreground/40'}`}
        />
      ))}
    </div>
  );
}
