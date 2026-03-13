import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInitiative, useNextTurn, useEndCombat } from '@/hooks/useLiveSession';
import { useRoundLabel } from '@/hooks/useModuleEnabled';

interface InitiativeBannerProps {
  campaignId: string;
  isDM: boolean;
  onSelectEntry?: (entryId: string) => void;
  focusedEntryId?: string | null;
}

export default function InitiativeBanner({
  campaignId,
  isDM,
  onSelectEntry,
  focusedEntryId,
}: InitiativeBannerProps) {
  const { data: initiative } = useInitiative(campaignId);
  const nextTurn = useNextTurn(campaignId);
  const endCombat = useEndCombat(campaignId);
  const roundLabel = useRoundLabel(campaignId);
  const [collapsed, setCollapsed] = useState(false);

  if (!initiative?.entries?.length || !initiative.isActive) return null;

  const visibleEntries = isDM
    ? initiative.entries
    : initiative.entries.filter((e) => !e.isHidden);

  const currentTurnEntry =
    initiative.isActive && initiative.entries[initiative.currentTurn]
      ? initiative.entries[initiative.currentTurn]
      : null;

  if (collapsed) {
    return renderCollapsed();
  }

  return renderExpanded();

  function renderCollapsed() {
    return (
      <div className="flex h-10 items-center justify-between border-b border-[hsla(38,50%,40%,0.22)] bg-card/70 px-4">
        <span className="text-xs font-[Cinzel] uppercase tracking-wide text-foreground">
          Initiative: {roundLabel} {initiative!.round}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Expand
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  function renderExpanded() {
    return (
      <div className="flex items-center gap-2 border-b border-[hsla(38,50%,40%,0.22)] bg-card/70 px-4 py-2">
        {renderRoundBadge()}
        {renderChips()}
        {renderControls()}
      </div>
    );
  }

  function renderRoundBadge() {
    return (
      <span className="shrink-0 text-[10px] font-[Cinzel] uppercase tracking-[0.12em] text-muted-foreground">
        {roundLabel} {initiative!.round}
      </span>
    );
  }

  function renderChips() {
    return (
      <div className="min-w-0 flex flex-1 items-center gap-1 overflow-x-auto pb-0.5">
        {visibleEntries.map((entry) => {
          const isCurrent = currentTurnEntry?.id === entry.id;
          const isFocused = focusedEntryId === entry.id;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelectEntry?.(entry.id)}
              className={`inline-flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-[10px] transition-colors ${
                isCurrent
                  ? 'border-primary/60 bg-primary/20 text-primary'
                  : isFocused
                    ? 'border-blue-400/60 bg-blue-500/15 text-blue-300'
                    : 'border-border/60 bg-card/60 text-muted-foreground hover:bg-accent'
              }`}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-background/60 text-[9px] font-semibold">
                {entry.name.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[120px] truncate">{entry.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  function renderControls() {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {isDM && (
          <>
            <Button size="sm" onClick={() => nextTurn.mutate()} disabled={nextTurn.isPending}>
              Next Turn
            </Button>
            <Button size="sm" variant="destructive" onClick={() => endCombat.mutate()} disabled={endCombat.isPending}>
              End Combat
            </Button>
          </>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Collapse
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
}
