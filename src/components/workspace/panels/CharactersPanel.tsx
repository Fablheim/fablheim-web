import { CharactersPage } from '@/pages/CharactersPage';

interface CharactersPanelProps {
  campaignId: string;
}

export function CharactersPanel(_props: CharactersPanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <CharactersPage />
    </div>
  );
}
