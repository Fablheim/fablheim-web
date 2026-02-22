import { createContext, useContext, useState, type ReactNode } from 'react';
import type { TabSnapshot, CreateLayoutPayload } from '@/types/layout';

export interface Tab {
  id: string;
  title: string;
  path: string;
  content: ReactNode;
  icon?: string;
  closeable?: boolean;
}

export interface NewTab {
  title: string;
  path: string;
  content: ReactNode;
  icon?: string;
  closeable?: boolean;
}

interface TabContextValue {
  // Left panel
  leftTabs: Tab[];
  activeLeftTabId: string | null;
  openLeftTab: (tab: NewTab) => void;
  closeLeftTab: (tabId: string) => void;
  setActiveLeftTab: (tabId: string) => void;

  // Right panel
  rightTabs: Tab[];
  activeRightTabId: string | null;
  openRightTab: (tab: NewTab) => void;
  closeRightTab: (tabId: string) => void;
  setActiveRightTab: (tabId: string) => void;

  // Batch close
  closeOtherLeftTabs: (tabId: string) => void;
  closeAllLeftTabs: () => void;
  closeOtherRightTabs: (tabId: string) => void;
  closeAllRightTabs: () => void;

  // Smart tab — deduplicates across panels, opens in focused panel
  openTab: (tab: NewTab) => void;

  // Panel focus
  focusedPanel: 'left' | 'right';
  setFocusedPanel: (panel: 'left' | 'right') => void;

  // Panel management
  rightPanelVisible: boolean;
  toggleRightPanel: () => void;
  hideRightPanel: () => void;
  showRightPanel: () => void;

  // Layout management
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
  layoutVersion: number;
  captureLayout: () => Omit<CreateLayoutPayload, 'name'>;
  restoreLayout: (
    data: {
      leftTabs: TabSnapshot[];
      activeLeftTabIndex: number;
      rightTabs: TabSnapshot[];
      activeRightTabIndex: number;
      rightPanelVisible: boolean;
      splitRatio: number;
    },
    resolver: (path: string, title: string) => ReactNode,
  ) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

let tabIdCounter = 0;
const generateTabId = () => `tab-${Date.now()}-${tabIdCounter++}`;

export function TabProvider({ children }: { children: ReactNode }) {
  const [leftTabs, setLeftTabs] = useState<Tab[]>([]);
  const [activeLeftTabId, setActiveLeftTabId] = useState<string | null>(null);

  const [rightTabs, setRightTabs] = useState<Tab[]>([]);
  const [activeRightTabId, setActiveRightTabId] = useState<string | null>(null);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);

  const [focusedPanel, setFocusedPanelRaw] = useState<'left' | 'right'>('left');
  const [splitRatio, setSplitRatio] = useState(50);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const setFocusedPanel = (panel: 'left' | 'right') => {
    if (panel === 'right' && !rightPanelVisible) return;
    setFocusedPanelRaw(panel);
  };

  const openLeftTab = (newTab: NewTab) => {
    // Deduplicate within left panel
    const existing = leftTabs.find((t) => t.path === newTab.path);
    if (existing) {
      setActiveLeftTabId(existing.id);
      setFocusedPanelRaw('left');
      return;
    }
    const id = generateTabId();
    const tab: Tab = { ...newTab, id, closeable: newTab.closeable !== false };
    setLeftTabs((prev) => [...prev, tab]);
    setActiveLeftTabId(id);
    setFocusedPanelRaw('left');
  };

  const closeLeftTab = (tabId: string) => {
    setLeftTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab?.closeable) return prev;

      const idx = prev.findIndex((t) => t.id === tabId);
      const next = prev.filter((t) => t.id !== tabId);

      if (activeLeftTabId === tabId && next.length > 0) {
        const newActive = next[Math.max(0, idx - 1)];
        setActiveLeftTabId(newActive.id);
      } else if (next.length === 0) {
        setActiveLeftTabId(null);
      }

      return next;
    });
  };

  const openRightTab = (newTab: NewTab) => {
    // Deduplicate within right panel
    const existing = rightTabs.find((t) => t.path === newTab.path);
    if (existing) {
      setActiveRightTabId(existing.id);
      setRightPanelVisible(true);
      setFocusedPanelRaw('right');
      return;
    }
    const id = generateTabId();
    const tab: Tab = { ...newTab, id, closeable: newTab.closeable !== false };
    setRightTabs((prev) => [...prev, tab]);
    setActiveRightTabId(id);
    setRightPanelVisible(true);
    setFocusedPanelRaw('right');
  };

  // Smart open: check both panels for existing tab, otherwise open in focused panel
  const openTab = (newTab: NewTab) => {
    const inLeft = leftTabs.find((t) => t.path === newTab.path);
    if (inLeft) {
      setActiveLeftTabId(inLeft.id);
      setFocusedPanelRaw('left');
      return;
    }
    const inRight = rightTabs.find((t) => t.path === newTab.path);
    if (inRight) {
      setActiveRightTabId(inRight.id);
      setFocusedPanelRaw('right');
      return;
    }
    if (focusedPanel === 'right' && rightPanelVisible) {
      openRightTab(newTab);
    } else {
      openLeftTab(newTab);
    }
  };

  const closeRightTab = (tabId: string) => {
    setRightTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab?.closeable) return prev;

      const idx = prev.findIndex((t) => t.id === tabId);
      const next = prev.filter((t) => t.id !== tabId);

      if (activeRightTabId === tabId && next.length > 0) {
        const newActive = next[Math.max(0, idx - 1)];
        setActiveRightTabId(newActive.id);
      } else if (next.length === 0) {
        setActiveRightTabId(null);
        setRightPanelVisible(false);
      }

      return next;
    });
  };

  const closeOtherLeftTabs = (tabId: string) => {
    setLeftTabs((prev) => {
      const keep = prev.filter((t) => t.id === tabId || !t.closeable);
      if (!keep.find((t) => t.id === activeLeftTabId)) {
        setActiveLeftTabId(tabId);
      }
      return keep;
    });
  };

  const closeAllLeftTabs = () => {
    setLeftTabs((prev) => {
      const keep = prev.filter((t) => !t.closeable);
      setActiveLeftTabId(keep[0]?.id ?? null);
      return keep;
    });
  };

  const closeOtherRightTabs = (tabId: string) => {
    setRightTabs((prev) => {
      const keep = prev.filter((t) => t.id === tabId || !t.closeable);
      if (!keep.find((t) => t.id === activeRightTabId)) {
        setActiveRightTabId(tabId);
      }
      if (keep.length === 0) {
        setActiveRightTabId(null);
        setRightPanelVisible(false);
      }
      return keep;
    });
  };

  const closeAllRightTabs = () => {
    setRightTabs((prev) => {
      const keep = prev.filter((t) => !t.closeable);
      setActiveRightTabId(keep[0]?.id ?? null);
      if (keep.length === 0) setRightPanelVisible(false);
      return keep;
    });
  };

  const captureLayout = (): Omit<CreateLayoutPayload, 'name'> => {
    const leftSnapshots: TabSnapshot[] = leftTabs.map((t) => ({
      title: t.title,
      path: t.path,
      ...(t.icon ? { icon: t.icon } : {}),
    }));
    const rightSnapshots: TabSnapshot[] = rightTabs.map((t) => ({
      title: t.title,
      path: t.path,
      ...(t.icon ? { icon: t.icon } : {}),
    }));

    const activeLeftIndex = leftTabs.findIndex((t) => t.id === activeLeftTabId);
    const activeRightIndex = rightTabs.findIndex((t) => t.id === activeRightTabId);

    return {
      leftTabs: leftSnapshots,
      activeLeftTabIndex: Math.max(0, activeLeftIndex),
      rightTabs: rightSnapshots,
      activeRightTabIndex: Math.max(0, activeRightIndex),
      rightPanelVisible,
      splitRatio,
    };
  };

  const restoreLayout = (
    data: {
      leftTabs: TabSnapshot[];
      activeLeftTabIndex: number;
      rightTabs: TabSnapshot[];
      activeRightTabIndex: number;
      rightPanelVisible: boolean;
      splitRatio: number;
    },
    resolver: (path: string, title: string) => ReactNode,
  ) => {
    const newLeftTabs: Tab[] = data.leftTabs.map((s) => ({
      id: generateTabId(),
      title: s.title,
      path: s.path,
      content: resolver(s.path, s.title),
      icon: s.icon,
      closeable: true,
    }));
    setLeftTabs(newLeftTabs);
    setActiveLeftTabId(newLeftTabs[data.activeLeftTabIndex]?.id ?? null);

    const newRightTabs: Tab[] = data.rightTabs.map((s) => ({
      id: generateTabId(),
      title: s.title,
      path: s.path,
      content: resolver(s.path, s.title),
      icon: s.icon,
      closeable: true,
    }));
    setRightTabs(newRightTabs);
    setActiveRightTabId(newRightTabs[data.activeRightTabIndex]?.id ?? null);

    setRightPanelVisible(data.rightPanelVisible);
    setSplitRatio(data.splitRatio);
    setLayoutVersion((v) => v + 1);
  };

  return (
    <TabContext
      value={{
        leftTabs,
        activeLeftTabId,
        openLeftTab,
        closeLeftTab,
        setActiveLeftTab: setActiveLeftTabId,
        rightTabs,
        activeRightTabId,
        openRightTab,
        closeRightTab,
        setActiveRightTab: setActiveRightTabId,
        closeOtherLeftTabs,
        closeAllLeftTabs,
        closeOtherRightTabs,
        closeAllRightTabs,
        openTab,
        focusedPanel,
        setFocusedPanel,
        rightPanelVisible,
        toggleRightPanel: () => setRightPanelVisible((p) => !p),
        hideRightPanel: () => setRightPanelVisible(false),
        showRightPanel: () => setRightPanelVisible(true),
        splitRatio,
        setSplitRatio,
        layoutVersion,
        captureLayout,
        restoreLayout,
      }}
    >
      {children}
    </TabContext>
  );
}

export function useTabs() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTabs must be used within TabProvider');
  return ctx;
}
