import { useState, useCallback, useEffect } from 'react';
import type { PanelLayout } from '@/types/session-layout';
import type { PanelId } from '@/types/workspace';
import { DEFAULT_SESSION_LAYOUT, SESSION_LAYOUT_PRESETS } from '@/config/layout-presets';

function storageKey(campaignId: string) {
  return `fablheim:session-layout:${campaignId}`;
}

function loadFromStorage(campaignId: string): PanelLayout | null {
  try {
    const raw = localStorage.getItem(storageKey(campaignId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(campaignId: string, layout: PanelLayout) {
  localStorage.setItem(storageKey(campaignId), JSON.stringify(layout));
}

export function useSessionLayout(campaignId: string) {
  const [layout, setLayoutState] = useState<PanelLayout>(
    () => loadFromStorage(campaignId) ?? structuredClone(DEFAULT_SESSION_LAYOUT),
  );

  // Persist on change
  useEffect(() => {
    saveToStorage(campaignId, layout);
  }, [campaignId, layout]);

  const setLayout = useCallback((next: PanelLayout) => {
    setLayoutState(next);
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = SESSION_LAYOUT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setLayoutState(structuredClone(preset.layout));
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setLayoutState(structuredClone(DEFAULT_SESSION_LAYOUT));
  }, []);

  const setMainSplit = useCallback((percent: number) => {
    setLayoutState((prev) => ({ ...prev, mainSplitPercent: percent }));
  }, []);

  const swapPanel = useCallback((slot: 'topBar' | 'leftMain' | 'rightMain' | 'bottomBar', panelId: PanelId) => {
    setLayoutState((prev) => ({
      ...prev,
      [slot]: { panelId, sizePercent: 100 },
    }));
  }, []);

  const removeSlot = useCallback((slot: 'topBar' | 'bottomBar') => {
    setLayoutState((prev) => ({ ...prev, [slot]: null }));
  }, []);

  const addSlot = useCallback((slot: 'topBar' | 'bottomBar', panelId: PanelId) => {
    setLayoutState((prev) => ({ ...prev, [slot]: { panelId, sizePercent: 100 } }));
  }, []);

  const activePanelIds: PanelId[] = [
    layout.topBar?.panelId,
    layout.leftMain.panelId,
    layout.rightMain.panelId,
    layout.bottomBar?.panelId,
  ].filter((id): id is PanelId => id != null);

  return {
    layout,
    setLayout,
    loadPreset,
    resetToDefault,
    setMainSplit,
    swapPanel,
    removeSlot,
    addSlot,
    activePanelIds,
  };
}
