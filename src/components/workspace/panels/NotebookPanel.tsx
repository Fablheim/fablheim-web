import { NotebookPage } from '@/pages/NotebookPage';

interface NotebookPanelProps {
  campaignId: string;
}

export function NotebookPanel({ campaignId }: NotebookPanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <NotebookPage campaignId={campaignId} />
    </div>
  );
}
