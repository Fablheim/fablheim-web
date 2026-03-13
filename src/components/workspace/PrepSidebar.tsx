import { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { PREP_SECTION_GROUPS, PREP_SECTIONS } from '@/lib/prep-sections';
import type {
  PrepSection,
  PrepSectionDef,
  PrepSectionGroupDef,
  PrepSectionGroupId,
} from '@/types/workspace';

interface PrepSidebarProps {
  activeSection: PrepSection;
  onNavigate: (section: PrepSection) => void;
  isDM: boolean;
}

const SIDEBAR_EXPANDED_KEY = 'fablheim:prep-sidebar-expanded';
const SIDEBAR_HINT_COUNT_KEY = 'fablheim:prep-sidebar-hint-count';
const SIDEBAR_GROUPS_KEY = 'fablheim:prep-sidebar-groups:v2';

const DEFAULT_OPEN_GROUPS: Record<PrepSectionGroupId, boolean> = {
  campaign: false,
  world: false,
  prep: false,
  tracking: false,
  system: false,
  player: false,
};

export function PrepSidebar({ activeSection, onNavigate, isDM }: PrepSidebarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
      if (stored != null) return stored === '1';

      const rawCount = localStorage.getItem(SIDEBAR_HINT_COUNT_KEY);
      const count = rawCount ? parseInt(rawCount, 10) : 0;
      if (count < 3) {
        localStorage.setItem(SIDEBAR_HINT_COUNT_KEY, String(count + 1));
        return true;
      }
    } catch {
      // ignore localStorage failures
    }
    return false;
  });
  const [openGroups, setOpenGroups] = useState<Record<PrepSectionGroupId, boolean>>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_GROUPS_KEY);
      if (!stored) return DEFAULT_OPEN_GROUPS;
      return { ...DEFAULT_OPEN_GROUPS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_OPEN_GROUPS;
    }
  });

  const visibleSections = useMemo(
    () =>
      PREP_SECTIONS.filter((s) => {
        if (s.dmOnly && !isDM) return false;
        if (s.playerOnly && isDM) return false;
        return true;
      }),
    [isDM],
  );
  const visibleGroups = useMemo(
    () =>
      PREP_SECTION_GROUPS.map((group) => ({
        ...group,
        sections: visibleSections.filter((section) => section.group === group.id),
      })).filter((group) => group.sections.length > 0),
    [visibleSections],
  );

  function toggleExpanded() {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_EXPANDED_KEY, next ? '1' : '0');
      } catch {
        // ignore localStorage failures
      }
      return next;
    });
  }

  function toggleGroup(groupId: PrepSectionGroupId) {
    setOpenGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(next));
      } catch {
        // ignore localStorage failures
      }
      return next;
    });
  }

  return (
    <nav
      className={`flex shrink-0 flex-col border-r border-[hsla(38,30%,25%,0.2)] bg-[hsl(24,18%,8%)] transition-[width] duration-200 ${isExpanded ? 'w-64' : 'w-16'}`}
      aria-label="Prep navigation"
      data-expanded={isExpanded ? 'true' : 'false'}
    >
      <div className="border-b border-[hsla(38,30%,25%,0.2)] px-3 pb-3 pt-4">
        {isExpanded ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="prep-sidebar-title">Prep Workspace</div>
              <p className="prep-sidebar-subtitle">
                Organize campaign material, prep sessions, and configure tools.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleExpanded}
              title="Collapse sidebar"
              className="prep-sidebar-icon-btn"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleExpanded}
            title="Expand sidebar"
            className="prep-sidebar-btn group"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-[18px] w-[18px]" />
            <span className="prep-sidebar-btn-label">Expand</span>
            <span className="prep-sidebar-tooltip">Prep Workspace</span>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {visibleGroups.map((group, index) => renderGroup(group, index > 0))}
      </div>
    </nav>
  );

  function renderGroup(group: PrepSectionGroupDef & { sections: PrepSectionDef[] }, showDivider: boolean) {
    const isOpen = openGroups[group.id] ?? true;

    if (!isExpanded) {
      return (
        <div key={group.id} className={showDivider ? 'prep-sidebar-group prep-sidebar-group-divider' : 'prep-sidebar-group'}>
          <div className="flex flex-col gap-1">
            {group.sections.map((section) => renderButton(section))}
          </div>
        </div>
      );
    }

    return (
      <section
        key={group.id}
        className={showDivider ? 'prep-sidebar-group prep-sidebar-group-divider' : 'prep-sidebar-group'}
      >
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          className="prep-sidebar-group-header"
          aria-expanded={isOpen}
        >
          <span>{group.label}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
        </button>
        {isOpen && (
          <div className="mt-1 flex flex-col gap-1">
            {group.sections.map((section) => renderButton(section))}
          </div>
        )}
      </section>
    );
  }

  function renderButton(section: PrepSectionDef) {
    const Icon = section.icon;
    const isActive = activeSection === section.id;

    return (
      <button
        key={section.id}
        type="button"
        onClick={() => onNavigate(section.id)}
        title={section.label}
        className={`prep-sidebar-btn group${isActive ? ' active' : ''}${isExpanded ? ' expanded' : ''}`}
        aria-label={section.label}
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="prep-sidebar-btn-label">{section.label}</span>
        {!isExpanded && (
          <span className="prep-sidebar-tooltip">{section.label}</span>
        )}
      </button>
    );
  }
}
