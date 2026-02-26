import { Calendar, Lightbulb } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';

interface NextSessionPanelProps {
  campaignId: string;
}

export function NextSessionPanel({ campaignId }: NextSessionPanelProps) {
  const { data: sessions } = useSessions(campaignId);

  const lastCompleted = sessions
    ?.filter((s) => s.status === 'completed')
    .sort((a, b) => b.sessionNumber - a.sessionNumber)[0];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="rounded-md border border-iron/30 bg-accent/20 p-4 texture-parchment">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="font-['IM_Fell_English'] text-sm font-semibold text-foreground">
            Plan Next Session
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {lastCompleted
            ? `Last session (#${lastCompleted.sessionNumber}) completed${lastCompleted.completedAt ? ` on ${new Date(lastCompleted.completedAt).toLocaleDateString()}` : ''}.`
            : 'No completed sessions yet.'}
        </p>
      </div>

      {lastCompleted?.aiSummary && (
        <div className="rounded-md border border-iron/30 bg-accent/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h4 className="font-['IM_Fell_English'] text-sm font-semibold text-foreground">
              Unresolved Hooks
            </h4>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Review unresolved hooks from the last session to plan what comes next.
          </p>
        </div>
      )}
    </div>
  );
}
