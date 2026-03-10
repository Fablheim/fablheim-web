import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTrackers, useAdjustTracker } from '@/hooks/useCampaigns';

interface WorldStateTrackersDisplayProps {
  campaignId: string;
  isDM: boolean;
}

export function WorldStateTrackersDisplay({ campaignId, isDM }: WorldStateTrackersDisplayProps) {
  const { data: trackers, isLoading } = useTrackers(campaignId);
  const adjustTracker = useAdjustTracker();

  if (isLoading || !trackers || trackers.length === 0) return null;

  function handleAdjust(trackerId: string, delta: number) {
    adjustTracker.mutate(
      { campaignId, trackerId, delta },
      { onError: () => toast.error('Failed to adjust tracker') },
    );
  }

  return (
    <div className="mkt-card mkt-card-mounted rounded-xl border border-border p-4 iron-brackets">
      <p className="mkt-chip mb-3 inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
        World State
      </p>
      <div className="space-y-3">
        {trackers.map((tracker) => {
          const range = tracker.max - tracker.min;
          const pct = range > 0 ? ((tracker.value - tracker.min) / range) * 100 : 0;

          // Find active threshold
          const activeThreshold = tracker.thresholds
            ?.slice()
            .sort((a, b) => b.value - a.value)
            .find((t) => tracker.value >= t.value);

          return (
            <div key={tracker._id}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-[Cinzel] text-xs text-foreground">{tracker.name}</span>
                <div className="flex items-center gap-1.5">
                  {isDM && (
                    <button
                      onClick={() => handleAdjust(tracker._id, -1)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      disabled={adjustTracker.isPending}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  )}
                  <span className="font-[Cinzel] text-xs text-muted-foreground">
                    {tracker.value}/{tracker.max}
                  </span>
                  {isDM && (
                    <button
                      onClick={() => handleAdjust(tracker._id, 1)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      disabled={adjustTracker.isPending}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-brass transition-all"
                  style={{ width: `${Math.max(1, Math.min(100, pct))}%` }}
                />
                {/* Threshold markers */}
                {tracker.thresholds?.map((t) => {
                  const tPct = range > 0 ? ((t.value - tracker.min) / range) * 100 : 0;
                  return (
                    <div
                      key={t.value}
                      className="absolute inset-y-0 w-px bg-foreground/30"
                      style={{ left: `${tPct}%` }}
                      title={`${t.label} (${t.value})`}
                    />
                  );
                })}
              </div>
              {activeThreshold && (
                <p className="mt-0.5 text-[10px] text-gold italic font-['IM_Fell_English']">
                  {activeThreshold.label}
                  {activeThreshold.effect && ` — ${activeThreshold.effect}`}
                </p>
              )}
              {tracker.visibility === 'dm-only' && (
                <span className="text-[9px] text-arcane font-[Cinzel] uppercase">GM Only</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
