import { useCallback } from 'react';
import { Moon, Sun, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUpdateSession } from '@/hooks/useSessions';
import type { Session, RestEvent } from '@/types/campaign';

interface RestTrackerProps {
  session: Session;
  campaignId: string;
}

function generateId() {
  return `rest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RestTracker({ session, campaignId }: RestTrackerProps) {
  const updateSession = useUpdateSession();
  const events = session.restEvents ?? [];
  const shortCount = events.filter((e) => e.type === 'short').length;
  const longCount = events.filter((e) => e.type === 'long').length;

  const addRest = useCallback(
    (type: 'short' | 'long') => {
      const newEvent: RestEvent = {
        id: generateId(),
        type,
        timestamp: new Date().toISOString(),
      };
      updateSession.mutate({
        campaignId,
        id: session._id,
        data: { restEvents: [...events, newEvent] },
      });
    },
    [updateSession, campaignId, session._id, events],
  );

  const removeRest = useCallback(
    (id: string) => {
      updateSession.mutate({
        campaignId,
        id: session._id,
        data: { restEvents: events.filter((e) => e.id !== id) },
      });
    },
    [updateSession, campaignId, session._id, events],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coffee className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-[Cinzel] text-xs font-semibold uppercase tracking-wider text-foreground">
            Rests
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sun className="h-3 w-3" /> {shortCount}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Moon className="h-3 w-3" /> {longCount}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => addRest('short')}
          disabled={updateSession.isPending}
        >
          <Sun className="mr-1 h-3 w-3" />
          Short Rest
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => addRest('long')}
          disabled={updateSession.isPending}
        >
          <Moon className="mr-1 h-3 w-3" />
          Long Rest
        </Button>
      </div>

      {events.length > 0 && (
        <div className="space-y-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="group flex items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-muted/30"
            >
              {event.type === 'short' ? (
                <Sun className="h-3 w-3 shrink-0 text-amber-400" />
              ) : (
                <Moon className="h-3 w-3 shrink-0 text-blue-400" />
              )}
              <span className="flex-1 text-xs text-foreground">
                {event.type === 'short' ? 'Short Rest' : 'Long Rest'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                type="button"
                onClick={() => removeRest(event.id)}
                className="text-[10px] text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
