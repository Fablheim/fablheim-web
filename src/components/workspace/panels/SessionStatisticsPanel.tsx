import { Loader2 } from 'lucide-react';
import { useSession } from '@/hooks/useSessions';
import { SessionStatistics } from '@/components/session/SessionStatistics';

interface SessionStatisticsPanelProps {
  campaignId: string;
  sessionId?: string;
}

export function SessionStatisticsPanel({ campaignId, sessionId }: SessionStatisticsPanelProps) {
  const { data: session, isLoading } = useSession(campaignId, sessionId ?? '');

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No session selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Session not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <SessionStatistics statistics={session.statistics} />
    </div>
  );
}
