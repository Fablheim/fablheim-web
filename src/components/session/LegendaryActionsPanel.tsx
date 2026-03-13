import { Crown } from 'lucide-react';
import { useUpdateInitiativeEntry } from '@/hooks/useLiveSession';
import type { InitiativeEntry } from '@/types/live-session';

interface LegendaryActionsPanelProps {
  campaignId: string;
  entry: InitiativeEntry;
  canEdit: boolean;
}

export function LegendaryActionsPanel({ campaignId, entry, canEdit }: LegendaryActionsPanelProps) {
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const la = entry.legendaryActions;

  if (!la || la.total <= 0) return null;

  function useLegendaryAction() {
    if (!la || la.remaining <= 0) return;
    updateEntry.mutate({
      entryId: entry.id,
      body: { legendaryActions: { total: la.total, remaining: la.remaining - 1 } },
    });
  }

  function resetLegendaryActions() {
    if (!la) return;
    updateEntry.mutate({
      entryId: entry.id,
      body: { legendaryActions: { total: la.total, remaining: la.total } },
    });
  }

  return (
    <div className="rounded border border-border/60 bg-background/25 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          <Crown className={`h-3 w-3 ${la.remaining > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
          Legendary Actions
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={resetLegendaryActions}
            disabled={updateEntry.isPending || la.remaining === la.total}
            className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        {Array.from({ length: la.total }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={!canEdit || updateEntry.isPending}
            onClick={() => {
              if (i < la.remaining) useLegendaryAction();
            }}
            className={`h-4 w-4 rounded-full border transition-colors ${
              i < la.remaining
                ? 'border-amber-400 bg-amber-400/40 hover:bg-amber-400/60'
                : 'border-border bg-muted/30'
            } disabled:cursor-default`}
            title={i < la.remaining ? 'Use legendary action' : 'Used'}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">
          {la.remaining}/{la.total}
        </span>
      </div>
    </div>
  );
}
