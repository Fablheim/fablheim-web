import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateInitiativeEntry } from '@/hooks/useLiveSession';
import { mergeSystemData, checkSystemDataSize } from '@/lib/system-data';
import type { InitiativeEntry } from '@/types/live-session';

interface HeroPointsTrackerProps {
  campaignId: string;
  entry: InitiativeEntry;
  canEdit: boolean;
}

const MAX_HERO_POINTS = 3;

export function HeroPointsTracker({ campaignId, entry, canEdit }: HeroPointsTrackerProps) {
  const updateEntry = useUpdateInitiativeEntry(campaignId);
  const current: number = (entry.systemData?.resources?.heroPoints as number) ?? 1;

  function setHeroPoints(value: number) {
    const clamped = Math.max(0, Math.min(MAX_HERO_POINTS, value));
    const nextSystemData = mergeSystemData(entry.systemData, {
      resources: { heroPoints: clamped },
    });
    const size = checkSystemDataSize(nextSystemData);
    if (!size.ok) {
      toast.error(size.error ?? 'systemData too large');
      return;
    }
    updateEntry.mutate({ entryId: entry.id, body: { systemData: nextSystemData } });
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hero Points</span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: MAX_HERO_POINTS }).map((_, i) => {
          const filled = i < current;
          return (
            <button
              key={i}
              type="button"
              disabled={!canEdit}
              onClick={() => setHeroPoints(filled ? i : i + 1)}
              className="disabled:cursor-default"
              title={`${filled ? 'Remove' : 'Add'} hero point`}
            >
              <Star
                className={`h-4 w-4 transition-colors ${
                  filled
                    ? 'fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]'
                    : 'text-muted-foreground/40'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
