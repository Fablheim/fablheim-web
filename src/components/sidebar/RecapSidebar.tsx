import {
  BarChart3,
  Sparkles,
  FileText,
  TrendingUp,
  Gem,
  Calendar,
  Bell,
  Save,
  Share2,
  ClipboardCheck,
  ArrowLeft,
} from 'lucide-react';
import { SidebarSection } from './SidebarSection';
import { Button } from '@/components/ui/Button';
import type { SidebarNavItem, SidebarNavSection } from './SidebarSection';
import type { PanelId } from '@/types/workspace';
import type { Session } from '@/types/campaign';

const RECAP_SECTIONS: SidebarNavSection[] = [
  {
    section: 'Review',
    items: [
      { label: 'Statistics', icon: BarChart3, panel: 'session-statistics' },
      { label: 'AI Summary', icon: Sparkles, panel: 'session-recap', requiresPaid: true },
      { label: 'Session Notes', icon: FileText, panel: 'session-notes-recap' },
    ],
  },
  {
    section: 'Wrap-Up',
    items: [
      { label: 'Next Session', icon: Calendar, panel: 'next-session' },
      { label: 'Award XP', icon: TrendingUp, action: 'awardXP' },
      { label: 'Distribute Loot', icon: Gem, action: 'distributeLoot' },
      { label: 'Send Reminders', icon: Bell, action: 'sendReminders' },
    ],
  },
  {
    section: 'Export',
    items: [
      { label: 'Save Summary', icon: Save, action: 'saveSummary' },
      { label: 'Share with Party', icon: Share2, action: 'shareWithParty' },
    ],
  },
];

function formatDuration(minutes?: number): string {
  if (!minutes) return '--';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

interface RecapSidebarProps {
  campaignId: string;
  onAddPanel: (panelId: PanelId) => void;
  activePanelIds: PanelId[];
  onReturnToPrep: () => void;
  isTransitioning: boolean;
  isDM: boolean;
  activeSession?: Session;
}

export function RecapSidebar({
  onAddPanel,
  activePanelIds,
  onReturnToPrep,
  isTransitioning,
  isDM,
  activeSession,
}: RecapSidebarProps) {
  function handleItemClick(item: SidebarNavItem) {
    if (item.panel) {
      const panelId = item.panel as PanelId;
      if (!activePanelIds.includes(panelId)) {
        onAddPanel(panelId);
      }
    } else if (item.action) {
      console.log(`Recap action: ${item.action}`);
    }
  }

  return (
    <>
      {/* Stage Badge + Session Info */}
      <div className="px-3 pt-3 pb-1 space-y-1">
        <div className="flex items-center gap-2 rounded-md bg-[hsla(142,50%,35%,0.12)] px-3 py-2">
          <ClipboardCheck className="h-4 w-4 text-[hsl(142,50%,60%)]" />
          <span className="font-[Cinzel] text-xs font-semibold tracking-wider text-[hsl(142,50%,65%)]">
            Session Recap
          </span>
        </div>
        {activeSession && (
          <div className="px-1 space-y-0.5">
            <p className="text-xs text-muted-foreground">
              Session #{activeSession.sessionNumber}
            </p>
            <p className="font-mono text-xs text-muted-foreground/70">
              Duration: {formatDuration(activeSession.durationMinutes)}
            </p>
          </div>
        )}
      </div>

      <div className="divider-ornate mx-3" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1">
        {RECAP_SECTIONS.map((section) => (
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
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={onReturnToPrep}
            disabled={isTransitioning}
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Prep
          </Button>
        </div>
      )}
    </>
  );
}
