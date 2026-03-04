import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useUpdateInitiativeEntry, useCombatRules } from '@/hooks/useLiveSession';
import type { InitiativeEntry } from '@/types/live-session';

interface ConcentrationBadgeProps {
  campaignId: string;
  entry: InitiativeEntry;
  canEdit: boolean;
}

export function ConcentrationBadge({ campaignId, entry, canEdit }: ConcentrationBadgeProps) {
  const { data: rules } = useCombatRules(campaignId);
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const [spellName, setSpellName] = useState(entry.concentrationSpell ?? '');

  // Don't render if the system doesn't use concentration
  if (rules && rules.concentrationModel.type === 'disabled') return null;
  const active = !!entry.isConcentrating;

  async function toggleConcentration(next: boolean) {
    const conditions = entry.conditions ?? [];
    const hasConcentrating = conditions.some((c) => c.toLowerCase() === 'concentrating');
    const nextConditions = next
      ? hasConcentrating
        ? conditions
        : [...conditions, 'Concentrating']
      : conditions.filter((c) => c.toLowerCase() !== 'concentrating');

    await updateEntry.mutateAsync({
      entryId: entry.id,
      body: {
        isConcentrating: next,
        concentrationSpell: next ? spellName.trim() || undefined : undefined,
        conditions: nextConditions,
      },
    });
  }

  return (
    <div className="rounded border border-border/60 bg-background/25 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          <Zap className={`h-3 w-3 ${active ? 'text-amber-400' : 'text-muted-foreground'}`} />
          Concentration
          {active && (
            <span className="rounded border border-amber-500/35 bg-amber-500/10 px-1 py-0.5 text-[9px] text-amber-300">
              Active
            </span>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => void toggleConcentration(!active)}
            disabled={updateEntry.isPending}
            className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            {active ? 'Drop' : 'Set'}
          </button>
        )}
      </div>
      {active && (
        <p className="mt-1 text-xs text-foreground">{entry.concentrationSpell || 'Concentrating'}</p>
      )}
      {canEdit && (
        <input
          type="text"
          value={spellName}
          onChange={(e) => setSpellName(e.target.value)}
          placeholder="Spell name (optional)"
          className="mt-2 w-full rounded border border-input bg-input px-2 py-1 text-[10px] text-foreground"
          disabled={updateEntry.isPending}
        />
      )}
    </div>
  );
}
