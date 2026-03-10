import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const WorldPage = lazy(() =>
  import('@/pages/WorldPage').then((m) => ({ default: m.WorldPage })),
);

interface WorldBrowserPanelProps {
  campaignId: string;
}

export function WorldBrowserPanel({ campaignId }: WorldBrowserPanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<LoadingSpinner />}>
        <WorldPage campaignId={campaignId} />
      </Suspense>
    </div>
  );
}
