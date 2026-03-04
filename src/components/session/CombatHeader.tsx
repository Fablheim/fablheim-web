import { Play, SkipForward, Square } from 'lucide-react';
import { useInitiative, useStartCombat, useNextTurn, useEndCombat } from '@/hooks/useLiveSession';
import { useSessionWorkspaceState } from '@/components/session/SessionWorkspaceState';
import { Button } from '@/components/ui/Button';

interface CombatHeaderProps {
  campaignId: string;
  isDM: boolean;
}

export function CombatHeader({ campaignId, isDM }: CombatHeaderProps) {
  const { data: initiative } = useInitiative(campaignId);
  const { currentTurnEntryId } = useSessionWorkspaceState();
  const startCombat = useStartCombat(campaignId);
  const nextTurn = useNextTurn(campaignId);
  const endCombat = useEndCombat(campaignId);

  const currentTurnEntry = currentTurnEntryId
    ? initiative?.entries.find((entry) => entry.id === currentTurnEntryId)
    : null;
  const turnLabel = initiative?.isActive ? currentTurnEntry?.name ?? 'Unknown' : 'Not active';

  return (
    <div className="border-b border-border/60 bg-card/80 px-3 py-2.5">
      <div className="mb-2.5 rounded border border-primary/25 bg-primary/5 px-2 py-1.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Round</span>
          <span className="text-xs font-semibold text-foreground">
            {initiative?.isActive ? initiative.round : '-'}
          </span>
        </div>
        <span className="block truncate text-[11px] text-muted-foreground">
          Turn: <span className="text-foreground">{turnLabel}</span>
        </span>
      </div>

      {isDM ? (
        <div className="grid grid-cols-3 gap-1">
          {!initiative?.isActive ? (
            <Button
              size="sm"
              variant="primary"
              className="col-span-3 h-7 px-2 text-[10px]"
              disabled={startCombat.isPending || !initiative?.entries?.length}
              onClick={() => startCombat.mutate()}
            >
              <Play className="mr-1 h-3 w-3" />
              Start
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="primary"
                className="h-7 px-2 text-[10px]"
                disabled={nextTurn.isPending}
                onClick={() => nextTurn.mutate()}
              >
                <SkipForward className="mr-1 h-3 w-3" />
                Next Turn
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="col-span-2 h-7 px-2 text-[10px]"
                disabled={endCombat.isPending}
                onClick={() => endCombat.mutate()}
              >
                <Square className="mr-1 h-3 w-3" />
                End
              </Button>
            </>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {initiative?.isActive ? 'Combat active' : 'Combat inactive'}
        </p>
      )}
    </div>
  );
}
