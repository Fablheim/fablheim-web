import { WorldPage } from '@/pages/WorldPage';

interface WorldBrowserPanelProps {
  campaignId: string;
}

export function WorldBrowserPanel({ campaignId }: WorldBrowserPanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <WorldPage campaignId={campaignId} />
    </div>
  );
}
