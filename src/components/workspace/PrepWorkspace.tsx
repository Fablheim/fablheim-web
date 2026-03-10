import type { Campaign } from '@/types/campaign';
import { useActiveSection } from '@/hooks/useActiveSection';
import { PrepSidebar } from './PrepSidebar';
import { PrepContentArea } from './PrepContentArea';

interface PrepWorkspaceProps {
  campaign: Campaign;
  isDM: boolean;
}

export function PrepWorkspace({ campaign, isDM }: PrepWorkspaceProps) {
  const { activeSection, navigate } = useActiveSection(campaign._id, isDM);

  return (
    <div className="flex h-full">
      <PrepSidebar activeSection={activeSection} onNavigate={navigate} isDM={isDM} />
      <PrepContentArea activeSection={activeSection} campaign={campaign} isDM={isDM} />
    </div>
  );
}
