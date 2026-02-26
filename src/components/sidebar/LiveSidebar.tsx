import {
  Map,
  Swords,
  MessageCircle,
  Dices,
  Image,
  Music,
  FileText,
  Upload,
  Shuffle,
  Share,
  UserPlus,
  User,
  Users,
  Square,
} from 'lucide-react';
import { SidebarSection } from './SidebarSection';
import { SessionTimer } from './SessionTimer';
import { Button } from '@/components/ui/Button';
import type { SidebarNavItem, SidebarNavSection } from './SidebarSection';
import type { PanelId } from '@/types/workspace';

const LIVE_SECTIONS: SidebarNavSection[] = [
  {
    section: 'Session Tools',
    items: [
      { label: 'Battle Map', icon: Map, panel: 'map' },
      { label: 'Initiative', icon: Swords, panel: 'initiative' },
      { label: 'Chat', icon: MessageCircle, panel: 'chat' },
      { label: 'Dice Roller', icon: Dices, panel: 'dice-roller' },
      { label: 'Handouts', icon: Image, panel: 'handouts' },
      { label: 'Music', icon: Music, panel: 'events' },
      { label: 'Session Notes', icon: FileText, panel: 'session-notes' },
    ],
  },
  {
    section: 'Party',
    items: [
      { label: 'Party Overview', icon: Users, panel: 'party-overview' },
      { label: 'Characters', icon: User, panel: 'characters' },
    ],
  },
  {
    section: 'Quick Actions',
    items: [
      { label: 'Load Encounter', icon: Upload, action: 'loadEncounter' },
      { label: 'Roll Random', icon: Shuffle, action: 'randomEncounter' },
      { label: 'Share Handout', icon: Share, action: 'shareHandout' },
      { label: 'Add NPC', icon: UserPlus, action: 'quickNPC' },
    ],
  },
];

interface LiveSidebarProps {
  campaignId: string;
  onAddPanel: (panelId: PanelId) => void;
  activePanelIds: PanelId[];
  onEndSession: () => void;
  isTransitioning: boolean;
  isDM: boolean;
  sessionStartedAt?: string;
}

export function LiveSidebar({
  onAddPanel,
  activePanelIds,
  onEndSession,
  isTransitioning,
  isDM,
  sessionStartedAt,
}: LiveSidebarProps) {
  function handleItemClick(item: SidebarNavItem) {
    if (item.panel) {
      const panelId = item.panel as PanelId;
      if (!activePanelIds.includes(panelId)) {
        onAddPanel(panelId);
      }
    } else if (item.action) {
      // Quick actions are stubs for now — they'll be wired to modals/dialogs
      console.log(`Quick action: ${item.action}`);
    }
  }

  return (
    <>
      {/* Stage Badge + Timer */}
      <div className="px-3 pt-3 pb-1 space-y-2">
        <div className="flex items-center gap-2 rounded-md bg-[hsla(0,60%,40%,0.12)] px-3 py-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[hsl(0,70%,50%)] animate-pulse" />
          <span className="font-[Cinzel] text-xs font-semibold tracking-wider text-[hsl(0,50%,70%)]">
            Session Active
          </span>
        </div>
        <SessionTimer
          startedAt={sessionStartedAt}
          className="px-1"
        />
      </div>

      <div className="divider-ornate mx-3" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1">
        {LIVE_SECTIONS.map((section) => (
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
            variant="destructive"
            size="lg"
            className="w-full gap-2"
            onClick={onEndSession}
            disabled={isTransitioning}
          >
            <Square className="h-4 w-4" />
            End Session
          </Button>
        </div>
      )}
    </>
  );
}
