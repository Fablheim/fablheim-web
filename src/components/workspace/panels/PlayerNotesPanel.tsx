import { PlayerNotesTab } from '@/components/session/PlayerNotesTab';

export function PlayerNotesPanel({ campaignId }: { campaignId: string }) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <PlayerNotesTab campaignId={campaignId} />
    </div>
  );
}
