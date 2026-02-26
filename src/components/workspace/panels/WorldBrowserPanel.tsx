import { WorldPage } from '@/pages/WorldPage';

interface WorldBrowserPanelProps {
  campaignId: string;
}

export function WorldBrowserPanel(_props: WorldBrowserPanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <WorldPage />
    </div>
  );
}
