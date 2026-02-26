import { NotebookPage } from '@/pages/NotebookPage';

interface NotebookPanelProps {
  campaignId: string;
}

export function NotebookPanel(_props: NotebookPanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <NotebookPage />
    </div>
  );
}
