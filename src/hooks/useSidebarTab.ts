import { useCallback, useEffect, useState } from 'react';
import type { AppState } from '@/types/workspace';
import { SESSION_DM_TABS, SESSION_PLAYER_TABS } from '@/lib/sidebar-tabs';
import { PREP_SECTIONS, DEFAULT_PREP_SECTION } from '@/lib/prep-sections';

function storageKey(campaignId: string, appState: AppState) {
  return `fablheim:sidebar-tab:${campaignId}:${appState}`;
}

function defaultTab(appState: AppState, isDM: boolean): string {
  if (appState === 'prep') {
    return isDM ? DEFAULT_PREP_SECTION : 'overview';
  }
  if (isDM) return SESSION_DM_TABS[0].id;
  return SESSION_PLAYER_TABS[0].id;
}

function isValidTab(tab: string, appState: AppState, isDM: boolean): boolean {
  if (appState === 'prep') {
    return PREP_SECTIONS.some((s) => s.id === tab);
  }
  const tabs = isDM ? SESSION_DM_TABS : SESSION_PLAYER_TABS;
  return tabs.some((t) => t.id === tab);
}

export function useSidebarTab(campaignId: string, appState: AppState, isDM: boolean) {
  const [activeTab, setActiveTabState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey(campaignId, appState));
      if (saved && isValidTab(saved, appState, isDM)) return saved;
    } catch {
      // ignore
    }
    return defaultTab(appState, isDM);
  });

  // When appState changes, restore the saved tab for that state or use default
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(campaignId, appState));
      if (saved && isValidTab(saved, appState, isDM)) {
        setActiveTabState(saved);
        return;
      }
    } catch {
      // ignore
    }
    setActiveTabState(defaultTab(appState, isDM));
  }, [campaignId, appState, isDM]);

  const setActiveTab = useCallback(
    (tab: string) => {
      setActiveTabState(tab);
      try {
        localStorage.setItem(storageKey(campaignId, appState), tab);
      } catch {
        // ignore
      }
    },
    [campaignId, appState],
  );

  return { activeTab, setActiveTab };
}
