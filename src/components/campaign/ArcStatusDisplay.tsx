import { CheckCircle2, Circle, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useArcs, useToggleArcMilestone } from '@/hooks/useCampaigns';
import type { ArcStatus } from '@/types/campaign';

const ARC_STATUS_CONFIG: Record<ArcStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'Upcoming', color: 'text-muted-foreground', bg: 'bg-muted' },
  active: { label: 'Active', color: 'text-gold', bg: 'bg-gold/15' },
  completed: { label: 'Completed', color: 'text-[hsl(150,50%,55%)]', bg: 'bg-forest/15' },
};

interface ArcStatusDisplayProps {
  campaignId: string;
  isDM: boolean;
}

export function ArcStatusDisplay({ campaignId, isDM }: ArcStatusDisplayProps) {
  const { data: arcs, isLoading } = useArcs(campaignId);
  const toggleMilestone = useToggleArcMilestone();

  if (isLoading || !arcs || arcs.length === 0) return null;

  // Show active arcs first, then upcoming, then completed
  const sorted = arcs.slice().sort((a, b) => {
    const order: Record<string, number> = { active: 0, upcoming: 1, completed: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  function handleToggleMilestone(arcId: string, milestoneId: string) {
    toggleMilestone.mutate(
      { campaignId, arcId, milestoneId },
      { onError: () => toast.error('Failed to toggle milestone') },
    );
  }

  return (
    <div className="mkt-card mkt-card-mounted rounded-xl border border-border p-4 iron-brackets">
      <p className="mkt-chip mb-3 inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
        Story Arcs
      </p>
      <div className="space-y-3">
        {sorted.map((arc) => {
          const config = ARC_STATUS_CONFIG[arc.status];
          const completedCount = arc.milestones.filter((m) => m.completed).length;
          const totalCount = arc.milestones.length;

          return (
            <div key={arc._id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Flag className={`h-3.5 w-3.5 ${config.color}`} />
                <span className="font-[Cinzel] text-sm text-foreground">{arc.name}</span>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-[Cinzel] ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                {totalCount > 0 && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {completedCount}/{totalCount}
                  </span>
                )}
              </div>

              {arc.description && (
                <p className="pl-5.5 text-xs text-muted-foreground font-['IM_Fell_English'] italic">
                  {arc.description}
                </p>
              )}

              {/* Milestone progress bar */}
              {totalCount > 0 && (
                <div className="pl-5.5">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${arc.status === 'completed' ? 'bg-[hsl(150,50%,55%)]' : 'bg-gold'}`}
                      style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Milestones list (DM can toggle) */}
              {arc.milestones.length > 0 && (
                <div className="pl-5.5 space-y-0.5">
                  {arc.milestones.map((ms) => (
                    <div key={ms._id} className="flex items-center gap-1.5">
                      {isDM ? (
                        <button
                          onClick={() => handleToggleMilestone(arc._id, ms._id)}
                          className="flex items-center gap-1.5 text-xs hover:text-brass transition-colors"
                          disabled={toggleMilestone.isPending}
                        >
                          {ms.completed ? (
                            <CheckCircle2 className="h-3 w-3 text-[hsl(150,50%,55%)]" />
                          ) : (
                            <Circle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={ms.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}>
                            {ms.description}
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs">
                          {ms.completed ? (
                            <CheckCircle2 className="h-3 w-3 text-[hsl(150,50%,55%)]" />
                          ) : (
                            <Circle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={ms.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}>
                            {ms.description}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
