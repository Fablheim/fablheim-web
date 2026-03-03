import { useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Globe,
  ScrollText,
  Sparkles,
  Swords,
  Users,
  Zap,
} from 'lucide-react';
import { EncountersTab } from '@/components/session/EncountersTab';
import { SessionNotesTab } from '@/components/session/SessionNotesTab';
import { PartyOverview } from '@/components/session/PartyOverview';
import { AIToolsTab } from '@/components/session/AIToolsTab';
import { QuickReference } from '@/components/session/QuickReference';
import { WorldBrowserPanel } from '@/components/workspace/panels/WorldBrowserPanel';

type DashboardCategory =
  | 'quick-actions'
  | 'world'
  | 'encounters'
  | 'notes'
  | 'party'
  | 'ai-tools'
  | 'rules';

interface CategoryDef {
  id: DashboardCategory;
  label: string;
  icon: typeof Swords;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'quick-actions', label: 'Quick Actions', icon: Zap },
  { id: 'world', label: 'World', icon: Globe },
  { id: 'encounters', label: 'Encounters', icon: Swords },
  { id: 'notes', label: 'Notes', icon: ScrollText },
  { id: 'party', label: 'Party', icon: Users },
  { id: 'ai-tools', label: 'AI Tools', icon: Sparkles },
  { id: 'rules', label: 'Rules', icon: BookOpen },
];

interface SideDashboardProps {
  campaignId: string;
  isDM: boolean;
}

const DASHBOARD_OPEN_KEY = 'fablheim-live-dashboard-open';

export function SideDashboard({ campaignId, isDM }: SideDashboardProps) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem(DASHBOARD_OPEN_KEY);
    return saved ? saved === '1' : true;
  });
  const [activeCategory, setActiveCategory] = useState<DashboardCategory>('quick-actions');
  const titleId = `side-dashboard-title-${campaignId}`;

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_OPEN_KEY, isOpen ? '1' : '0');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen]);

  return (
    <aside
      className={`session-side-shell ${isOpen ? 'session-side-shell-open' : 'session-side-shell-closed'}`}
      aria-label="Session dashboard"
    >
      {renderRail()}
      {isOpen && renderDrawer()}
    </aside>
  );

  function renderRail() {
    return (
      <div className="session-side-rail">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="session-side-rail-toggle app-focus-ring"
          aria-label={isOpen ? 'Collapse dashboard' : 'Expand dashboard'}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4 text-[hsl(35,24%,80%)]" /> : <ChevronRight className="h-4 w-4 text-[hsl(35,24%,80%)]" />}
        </button>

        <div className="session-side-rail-categories">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setIsOpen(true);
                }}
                className={`session-side-rail-cat app-focus-ring ${active ? 'session-side-rail-cat-active' : ''}`}
                title={cat.label}
                aria-label={cat.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderDrawer() {
    return (
      <div
        role="region"
        aria-labelledby={titleId}
        className="session-side-drawer"
      >
        {renderHeader()}
        {renderCategories()}
        <div className="session-side-content">
          {renderCategoryContent()}
        </div>
      </div>
    );
  }

  function renderHeader() {
    return (
      <header className="session-side-header">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="truncate font-[Cinzel] text-sm font-semibold uppercase tracking-[0.12em] text-foreground"
            >
              Session Dashboard
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Keep encounter, world, party, and notes in easy reach
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="app-focus-ring inline-flex items-center gap-1 rounded-md border border-border/60 bg-accent/40 px-2.5 py-1.5 text-[11px] font-[Cinzel] uppercase tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Collapse dashboard"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Collapse
          </button>
        </div>
      </header>
    );
  }

  function renderCategories() {
    return (
      <nav className="session-side-nav" aria-label="Dashboard categories">
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`session-side-category app-focus-ring ${
                  isActive
                    ? 'session-side-category-active'
                    : 'session-side-category-idle'
                }`}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  function renderCategoryContent() {
    switch (activeCategory) {
      case 'quick-actions':
        return renderQuickActions();
      case 'world':
        return <WorldBrowserPanel campaignId={campaignId} />;
      case 'encounters':
        return <EncountersTab campaignId={campaignId} isDM={isDM} />;
      case 'notes':
        return <SessionNotesTab campaignId={campaignId} />;
      case 'party':
        return <PartyOverview campaignId={campaignId} />;
      case 'ai-tools':
        return <AIToolsTab campaignId={campaignId} />;
      case 'rules':
        return <QuickReference campaignId={campaignId} />;
      default:
        return null;
    }
  }

  function renderQuickActions() {
    const actions = [
      { label: 'Load Encounter', icon: Swords, disabled: !isDM },
      { label: 'Share Handout', icon: ScrollText, disabled: !isDM },
      { label: 'View Party', icon: Users, disabled: false },
    ];

    return (
      <div className="space-y-2">
        <p className="px-1 text-xs text-muted-foreground">Session quick actions</p>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              className="session-quick-action app-focus-ring"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-accent/65">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm text-foreground">{action.label}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {action.disabled ? 'GM only action' : 'Open module'}
                </span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/80" />
            </button>
          );
        })}
      </div>
    );
  }
}
