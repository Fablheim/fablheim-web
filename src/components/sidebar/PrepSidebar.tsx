import {
  Home,
  Swords,
  Skull,
  Sparkles,
  Globe,
  MapPin,
  ScrollText,
  Users,
  User,
  BookOpen,
  Settings,
  FileEdit,
  Play,
} from 'lucide-react';
import { SidebarSection } from './SidebarSection';
import { Button } from '@/components/ui/Button';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';
import type { SidebarNavItem, SidebarNavSection } from './SidebarSection';
import type { PanelId } from '@/types/workspace';

const PREP_SECTIONS: SidebarNavSection[] = [
  {
    section: 'Dashboard',
    items: [
      { label: 'Overview', icon: Home, path: '/app' },
    ],
  },
  {
    section: 'Preparation',
    items: [
      { label: 'Encounters', icon: Swords, panel: 'encounter-prep' },
      { label: 'Enemy Library', icon: Skull, path: '/app/enemies' },
      { label: 'AI Tools', icon: Sparkles, panel: 'ai-tools', requiresPaid: true },
      { label: 'World Builder', icon: Globe, panel: 'world-browser' },
      { label: 'Locations', icon: MapPin, path: '/app/world' },
      { label: 'Quests', icon: ScrollText, path: '/app/world' },
      { label: 'NPCs', icon: Users, path: '/app/world' },
    ],
  },
  {
    section: 'Campaign',
    items: [
      { label: 'Characters', icon: User, panel: 'characters' },
      { label: 'Party Overview', icon: Users, panel: 'party-overview' },
      { label: 'SRD Reference', icon: BookOpen, panel: 'quick-reference' },
      { label: 'Settings', icon: Settings, path: '/app/settings' },
    ],
  },
];

interface PrepSidebarProps {
  campaignId: string;
  onAddPanel: (panelId: PanelId) => void;
  activePanelIds: PanelId[];
  onStartSession: () => void;
  isTransitioning: boolean;
  isDM: boolean;
}

export function PrepSidebar({
  onAddPanel,
  activePanelIds,
  onStartSession,
  isTransitioning,
  isDM,
}: PrepSidebarProps) {
  const { openTab } = useTabs();

  function handleItemClick(item: SidebarNavItem) {
    if (item.panel) {
      const panelId = item.panel as PanelId;
      if (!activePanelIds.includes(panelId)) {
        onAddPanel(panelId);
      }
    } else if (item.path) {
      openTab({
        title: item.label,
        path: item.path,
        content: resolveRouteContent(item.path, item.label),
      });
    }
  }

  return (
    <>
      {/* Stage Badge */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 rounded-md bg-[hsla(220,50%,40%,0.12)] px-3 py-2">
          <FileEdit className="h-4 w-4 text-[hsl(220,50%,65%)]" />
          <span className="font-[Cinzel] text-xs font-semibold tracking-wider text-[hsl(220,50%,70%)]">
            Campaign Prep
          </span>
        </div>
      </div>

      <div className="divider-ornate mx-3" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1">
        {PREP_SECTIONS.map((section) => (
          <SidebarSection
            key={section.section}
            title={section.section}
            items={section.items}
            activePanelIds={activePanelIds as string[]}
            onItemClick={handleItemClick}
          />
        ))}
      </nav>

      {/* Footer */}
      {isDM && (
        <div className="border-t border-[hsla(38,40%,30%,0.12)] p-3">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={onStartSession}
            disabled={isTransitioning}
          >
            <Play className="h-4 w-4" />
            Start Session
          </Button>
        </div>
      )}
    </>
  );
}
