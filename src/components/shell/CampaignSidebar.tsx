import { useMemo } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { PREP_SECTIONS } from '@/lib/prep-sections';
import { SESSION_DM_TABS, SESSION_PLAYER_TABS } from '@/lib/sidebar-tabs';
import type { AppState } from '@/types/workspace';
import type { SessionTabDef } from '@/lib/sidebar-tabs';
interface CampaignSidebarProps {
  campaignId: string;
  appState: AppState;
  isDM: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode; // drawer content
}

export function CampaignSidebar({
  appState,
  isDM,
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  children,
}: CampaignSidebarProps) {
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

  return (
    <div className={`session-side-shell ${isOpen ? 'session-side-shell-open' : 'session-side-shell-closed'}`}>
      {renderRail()}
      {isOpen && renderDrawer()}
    </div>
  );

  function renderRail() {
    return (
      <div className="session-side-rail">
        <button
          type="button"
          onClick={onToggle}
          className="session-side-rail-toggle"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
        <div className="session-side-rail-categories">
          {isSession ? renderSessionRailIcons(sessionTabs) : renderPrepRailIcons()}
        </div>
      </div>
    );
  }

  function renderSessionRailIcons(tabs: SessionTabDef[]) {
    return tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`session-side-rail-cat ${isActive ? 'session-side-rail-cat-active' : ''}`}
          aria-label={tab.label}
          title={tab.label}
        >
          <Icon className="h-4 w-4" />
        </button>
      );
    });
  }

  function renderPrepRailIcons() {
    return prepSections.map((section) => {
      const Icon = section.icon;
      const isActive = activeTab === section.id;
      return (
        <button
          key={section.id}
          type="button"
          onClick={() => onTabChange(section.id)}
          className={`session-side-rail-cat ${isActive ? 'session-side-rail-cat-active' : ''}`}
          aria-label={section.label}
          title={section.label}
        >
          <Icon className="h-[15px] w-[15px]" />
        </button>
      );
    });
  }

  function renderDrawer() {
    const label = isSession
      ? (isDM ? SESSION_DM_TABS : SESSION_PLAYER_TABS).find((t) => t.id === activeTab)?.label
      : PREP_SECTIONS.find((s) => s.id === activeTab)?.label;

    return (
      <div className="session-side-drawer">
        <div className="session-side-header">
          <h2 className="font-[Cinzel] text-xs uppercase tracking-[0.06em] text-[hsl(38,36%,72%)]">
            {label ?? 'Sidebar'}
          </h2>
        </div>
        {isSession && renderSessionNav()}
        <div className="session-side-content">
          {children}
        </div>
      </div>
    );
  }

  function renderSessionNav() {
    const tabs = isDM ? SESSION_DM_TABS : SESSION_PLAYER_TABS;
    return (
      <div className="session-side-nav">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`session-side-category ${isActive ? 'session-side-category-active' : 'session-side-category-idle'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}
