import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, ScrollText, ShieldX, Swords, Users, X } from 'lucide-react';
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import { PartyOverview } from '@/components/session/PartyOverview';
import { QuickReference } from '@/components/session/QuickReference';
import { SessionNotesTab } from '@/components/session/SessionNotesTab';

type DrawerTab = 'initiative' | 'party' | 'rules' | 'notes';

interface SessionToolsDrawerProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  isDM: boolean;
  selectedTokenEntryId: string | null;
}

const TABS: { id: DrawerTab; label: string; icon: typeof Swords }[] = [
  { id: 'initiative', label: 'Initiative', icon: Swords },
  { id: 'party', label: 'Party', icon: Users },
  { id: 'rules', label: 'Rules', icon: BookOpenText },
  { id: 'notes', label: 'Notes', icon: ScrollText },
];

export function SessionToolsDrawer({
  open,
  onClose,
  campaignId,
  isDM,
  selectedTokenEntryId,
}: SessionToolsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('initiative');
  const panelRef = useRef<HTMLDivElement>(null);

  const titleId = useMemo(() => `session-tools-title-${campaignId}`, [campaignId]);

  useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
    focusables?.[0]?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (!open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';
      previousActive?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close tools drawer"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full max-w-[90vw] flex-col border-l border-[hsla(38,44%,40%,0.35)] bg-[color-mix(in_hsl,var(--mkt-surface-1)_88%,black_12%)] shadow-[0_16px_40px_hsla(24,36%,3%,0.55)]"
      >
        <header className="shrink-0 border-b border-[hsla(38,44%,40%,0.25)] px-4 py-3 texture-wood">
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="font-[Cinzel] text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Session Tools
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close session tools"
              className="app-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-iron bg-accent/65 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-3 grid grid-cols-2 gap-2" aria-label="Session tool tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`app-focus-ring inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-[11px] font-[Cinzel] uppercase tracking-wide ${
                    active
                      ? 'border-primary/50 bg-primary/15 text-primary'
                      : 'border-border bg-accent/35 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        <div className="session-sidebar-panel flex-1 overflow-y-auto p-3 texture-parchment">
          {activeTab === 'initiative' && (
            <div className="session-sidebar-card">
              <InitiativeTracker campaignId={campaignId} isDM={isDM} selectedEntryId={selectedTokenEntryId} />
            </div>
          )}

          {activeTab === 'party' && (
            <div className="session-sidebar-card">
              <PartyOverview campaignId={campaignId} />
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="session-sidebar-card">
              <QuickReference campaignId={campaignId} />
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="session-sidebar-card rounded-lg border border-border bg-card/50 p-2">
              <SessionNotesTab campaignId={campaignId} />
            </div>
          )}

          <div className="session-sidebar-card mt-2 rounded-lg border border-border/55 bg-accent/20 p-3 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <ShieldX className="h-3.5 w-3.5" />
              <span>Live tools stay available while you keep the main workspace visible.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
