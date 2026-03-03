import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PREP_SECTIONS } from '@/lib/prep-sections';
import type { PrepSection, PrepSectionDef } from '@/types/workspace';

interface PrepSidebarProps {
  activeSection: PrepSection;
  onNavigate: (section: PrepSection) => void;
}

const SIDEBAR_EXPANDED_KEY = 'fablheim:prep-sidebar-expanded';
const SIDEBAR_HINT_COUNT_KEY = 'fablheim:prep-sidebar-hint-count';

export function PrepSidebar({ activeSection, onNavigate }: PrepSidebarProps) {
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

  return (
    <nav
      className={`flex shrink-0 flex-col border-r border-[hsla(38,30%,25%,0.2)] bg-[hsl(24,18%,8%)] transition-[width] duration-200 ${isExpanded ? 'w-44' : 'w-14'}`}
      aria-label="Prep navigation"
      data-expanded={isExpanded ? 'true' : 'false'}
    >
      <div className="flex flex-col gap-1 p-2 pt-3">
        <button
          type="button"
          onClick={toggleExpanded}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className={`prep-sidebar-btn group ${isExpanded ? 'expanded' : ''}`}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft className="h-[18px] w-[18px]" /> : <ChevronRight className="h-[18px] w-[18px]" />}
          <span className="prep-sidebar-btn-label">{isExpanded ? 'Collapse' : 'Expand'}</span>
          {!isExpanded && (
            <span className="prep-sidebar-tooltip">Expand</span>
          )}
        </button>
        {PREP_SECTIONS.map((section) => renderButton(section))}
      </div>
    </nav>
  );

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
