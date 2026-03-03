import { CharactersPage } from '@/pages/CharactersPage';

interface CharactersPanelProps {
  campaignId: string;
}

export function CharactersPanel({ campaignId }: CharactersPanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <CharactersPage campaignId={campaignId} mode="players-only" />
    </div>
  );
}
