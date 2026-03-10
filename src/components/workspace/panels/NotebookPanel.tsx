import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const NotebookPage = lazy(() =>
  import('@/pages/NotebookPage').then((m) => ({ default: m.NotebookPage })),
);

interface NotebookPanelProps {
  campaignId: string;
}

export function NotebookPanel({ campaignId }: NotebookPanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<LoadingSpinner />}>
        <NotebookPage campaignId={campaignId} />
      </Suspense>
    </div>
  );
}
