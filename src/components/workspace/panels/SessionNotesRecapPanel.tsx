import { SessionNotesTab } from '@/components/session/SessionNotesTab';

interface SessionNotesRecapPanelProps {
  campaignId: string;
  sessionId?: string;
}

export function SessionNotesRecapPanel({ campaignId, sessionId }: SessionNotesRecapPanelProps) {
  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No session selected</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <SessionNotesTab campaignId={campaignId} />
    </div>
  );
}
