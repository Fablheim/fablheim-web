import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Lightweight navigation bus for cross-tab pre-selection.
 *
 * When a component (e.g., SessionBriefingPanel) wants to navigate to a
 * specific item in another tab, it calls:
 *   requestNavigation('arcs', arcId)
 *
 * The target context (e.g., StoryArcsContext) consumes the pending
 * navigation via useEffect and calls its own setSelectedId.
 *
 * Must be placed OUTSIDE all feature providers in the shell.
 */

export interface PendingNavigation {
  tab: string;
  id: string;
}

interface NavigationBusContextValue {
  pending: PendingNavigation | null;
  requestNavigation: (tab: string, id: string) => void;
  consumeNavigation: (tab: string) => string | null;
}

const NavigationBusContext = createContext<NavigationBusContextValue | null>(null);

export function NavigationBusProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingNavigation | null>(null);

  const requestNavigation = useCallback((tab: string, id: string) => {
    setPending({ tab, id });
  }, []);

  const consumeNavigation = useCallback(
    (tab: string): string | null => {
      if (!pending || pending.tab !== tab) return null;
      const id = pending.id;
      setPending(null);
      return id;
    },
    [pending],
  );

  const value = useMemo(
    () => ({ pending, requestNavigation, consumeNavigation }),
    [pending, requestNavigation, consumeNavigation],
  );

  return (
    <NavigationBusContext.Provider value={value}>
      {children}
    </NavigationBusContext.Provider>
  );
}

export function useNavigationBus() {
  const ctx = useContext(NavigationBusContext);
  if (!ctx) throw new Error('useNavigationBus must be used within NavigationBusProvider');
  return ctx;
}
