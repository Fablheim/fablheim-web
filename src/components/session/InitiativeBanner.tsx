import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInitiative, useNextTurn, useEndCombat } from '@/hooks/useLiveSession';

interface InitiativeBannerProps {
  campaignId: string;
  isDM: boolean;
}

export default function InitiativeBanner({ campaignId, isDM }: InitiativeBannerProps) {
  const { data: initiative } = useInitiative(campaignId);
  const nextTurn = useNextTurn(campaignId);
  const endCombat = useEndCombat(campaignId);
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
    return (
      <div className="flex h-10 items-center justify-between border-b border-border/70 bg-card/70 px-4">
        <span className="text-xs font-[Cinzel] uppercase tracking-wide text-foreground">
          Initiative: Round {initiative.round}
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

  return (
    <div className="flex h-16 items-center gap-3 border-b border-border/70 bg-card/70 px-4">
      <div className="text-sm font-semibold text-foreground">
        Round {initiative.round}
      </div>

      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
        {visibleEntries.map((entry) => {
          const isCurrentTurn = entry.id === currentTurnEntry?.id;
          const hasHP = entry.currentHp != null && entry.maxHp != null;
          const showExactHP = hasHP && (isDM || entry.type === 'pc');

          return (
            <div
              key={entry.id}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                isCurrentTurn
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-accent/70 text-foreground'
              }`}
            >
              {entry.name}
              {showExactHP ? ` (${entry.currentHp}/${entry.maxHp})` : ''}
            </div>
          );
        })}
      </div>

      {isDM && (
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button size="sm" onClick={() => nextTurn.mutate()} disabled={nextTurn.isPending}>
            Next Turn
          </Button>
          <Button size="sm" variant="destructive" onClick={() => endCombat.mutate()} disabled={endCombat.isPending}>
            End Combat
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="inline-flex flex-shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Collapse
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
