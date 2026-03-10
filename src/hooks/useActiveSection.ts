import { useState, useCallback, useEffect } from 'react';
import type { PrepSection } from '@/types/workspace';
import { DEFAULT_PREP_SECTION, PREP_SECTIONS } from '@/lib/prep-sections';

function getStorageKey(campaignId: string) {
  return `fablheim:prep-section:${campaignId}`;
}

export function useActiveSection(campaignId: string, isDM = true) {
  const [activeSection, setActiveSection] = useState<PrepSection>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(campaignId));
      if (saved === 'characters') return 'players';
      if (saved && PREP_SECTIONS.some((s) => s.id === saved)) {
        const def = PREP_SECTIONS.find((s) => s.id === saved);
        // Don't restore a DM-only section for players or player-only for DM
        if (def?.dmOnly && !isDM) return 'overview';
        if (def?.playerOnly && isDM) return DEFAULT_PREP_SECTION;
        return saved as PrepSection;
      }
    } catch {
      // ignore
    }
    return isDM ? DEFAULT_PREP_SECTION : 'overview';
  });

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(campaignId), activeSection);
    } catch {
      // ignore
    }
  }, [activeSection, campaignId]);

  const navigate = useCallback((section: PrepSection) => {
    setActiveSection(section);
  }, []);

  return { activeSection, navigate };
}
