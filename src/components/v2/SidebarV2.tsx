import { useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Globe,
  Hammer,
  Activity,
  Cpu,
  User,
} from 'lucide-react';
import { SESSION_DM_TABS, SESSION_PLAYER_TABS } from '@/lib/sidebar-tabs';
import { PREP_SECTIONS, PREP_SECTION_GROUPS } from '@/lib/prep-sections';
import type { AppState } from '@/types/workspace';
import type { PrepSectionGroupId } from '@/types/workspace';
import type { LucideIcon } from 'lucide-react';

interface SidebarV2Props {
  appState: AppState;
  isDM: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isSmall: boolean;
}

/** Icons for prep groups shown in the rail. */
const PREP_GROUP_ICONS: Record<PrepSectionGroupId, LucideIcon> = {
  campaign: LayoutDashboard,
  world: Globe,
  prep: Hammer,
  tracking: Activity,
  system: Cpu,
  player: User,
};

const PREP_GROUP_DEFAULT_SECTION: Partial<Record<PrepSectionGroupId, string>> = {
  campaign: 'overview',
  world: 'world',
};

export function SidebarV2({
  appState,
  isDM,
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  isSmall,
}: SidebarV2Props) {
  const isSession = appState === 'narrative' || appState === 'combat';

  const sessionTabs = useMemo(
    () => (isDM ? SESSION_DM_TABS : SESSION_PLAYER_TABS),
    [isDM],
  );

  const prepSections = useMemo(
    () =>
      PREP_SECTIONS.filter((s) => {
        if (s.dmOnly && !isDM) return false;
        if (s.playerOnly && isDM) return false;
        return true;
      }),
    [isDM],
  );

  /** Which group does the active tab belong to? */
  const activeGroup = useMemo(() => {
    const section = prepSections.find((s) => s.id === activeTab);
    return section?.group;
  }, [prepSections, activeTab]);

  /** Prep groups that have at least one visible section. */
  const visibleGroups = useMemo(
    () =>
      PREP_SECTION_GROUPS.filter((g) =>
        prepSections.some((s) => s.group === g.id),
      ),
    [prepSections],
  );

  /** Sections in the currently active group (for prep drawer). */
  const activeGroupSections = useMemo(
    () => prepSections.filter((s) => s.group === activeGroup),
    [prepSections, activeGroup],
  );

  const activeGroupLabel = visibleGroups.find((g) => g.id === activeGroup)?.label;

  // FIX 2 (Phase 5): On small screens (< 1024px) the sidebar already opens as an absolute-
  // positioned overlay (inset-y-0 left-0 z-30) that slides over content rather than pushing it.
  // CampaignShellV2 renders a full-area backdrop that dismisses the sidebar on tap-outside.
  // This satisfies the "full-width overlay rather than pushing content" requirement — no change needed.
  //
  // FIX 4 (Phase 5): The icon rail is intentionally visible alongside the open drawer on small
  // screens because it contains the only collapse-toggle button. Hiding the rail without adding
  // an alternative close control would trap users in the open state (the backdrop tap-to-dismiss
  // in CampaignShellV2 remains the primary dismiss path on mobile). No change needed.
  const sidebarClasses = isOpen
    ? isSmall
      ? 'absolute inset-y-0 left-0 z-30 w-[320px] max-w-[86vw] translate-x-0 shadow-2xl'
      : 'w-[320px] min-w-[280px] max-w-[380px]'
    : isSmall
      ? 'absolute inset-y-0 left-0 z-30 w-[320px] max-w-[86vw] -translate-x-full'
      : 'w-[52px]';

  return (
    <aside
      className={`flex h-full border-r border-[hsla(32,26%,26%,0.75)] bg-[hsl(24,14%,9%)] transition-[width,transform] duration-200 ${sidebarClasses}`}
    >
      {renderRail()}
      {isOpen && renderDrawer()}
    </aside>
  );

  function renderRail() {
    return (
      <div className="flex w-[52px] shrink-0 flex-col items-center border-r border-[hsla(32,26%,26%,0.4)] py-2">
        <button
          type="button"
          onClick={onToggle}
          className="mb-3 flex h-7 w-7 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex flex-col items-center gap-1">
          {isSession ? renderSessionRail() : renderPrepRail()}
        </div>
      </div>
    );
  }

  function renderSessionRail() {
    return sessionTabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => {
            onTabChange(tab.id);
            if (!isOpen) onToggle();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
            isActive
              ? 'bg-[hsl(38,92%,50%)]/10 text-[hsl(38,90%,55%)]'
              : 'text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]'
          }`}
          title={tab.label}
          aria-label={tab.label}
        >
          <Icon className="h-4 w-4" />
        </button>
      );
    });
  }

  function renderPrepRail() {
    return visibleGroups.map((group) => {
      const Icon = PREP_GROUP_ICONS[group.id];
      const isActive = activeGroup === group.id;
      const preferredSectionId = PREP_GROUP_DEFAULT_SECTION[group.id];
      const firstSection =
        prepSections.find((s) => s.group === group.id && s.id === preferredSectionId) ??
        prepSections.find((s) => s.group === group.id);
      return (
        <button
          key={group.id}
          type="button"
          onClick={() => {
            if (firstSection) onTabChange(firstSection.id);
            if (!isOpen) onToggle();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
            isActive
              ? 'bg-[hsl(38,92%,50%)]/10 text-[hsl(38,90%,55%)]'
              : 'text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]'
          }`}
          title={group.label}
          aria-label={group.label}
        >
          <Icon className="h-4 w-4" />
        </button>
      );
    });
  }

  function renderDrawer() {
    return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {renderDrawerHeader()}
        {renderDrawerContent()}
      </div>
    );
  }

  function renderDrawerHeader() {
    // In session mode, show the active tab name. In prep, show the active group name.
    const label = isSession
      ? sessionTabs.find((t) => t.id === activeTab)?.label
      : activeGroupLabel;

    return (
      <div className="flex h-[42px] shrink-0 items-center border-b border-[hsla(32,26%,26%,0.4)] px-3">
        <h2
          className="text-[11px] uppercase tracking-[0.06em] text-[hsl(38,36%,72%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {label ?? 'Sidebar'}
        </h2>
      </div>
    );
  }

  function renderDrawerContent() {
    const navItems = isSession
      ? sessionTabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))
      : activeGroupSections.map((s) => ({ id: s.id, label: s.label, icon: s.icon }));

    return (
      <div className="flex flex-col gap-0.5 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] transition-colors ${
                isActive
                  ? 'bg-[hsl(38,92%,50%)]/10 text-[hsl(38,90%,55%)]'
                  : 'text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }
}
