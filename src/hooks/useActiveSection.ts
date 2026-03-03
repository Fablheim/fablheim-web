import { useState, useCallback, useEffect } from 'react';
import type { PrepSection } from '@/types/workspace';
import { DEFAULT_PREP_SECTION, PREP_SECTIONS } from '@/lib/prep-sections';

function getStorageKey(campaignId: string) {
  return `fablheim:prep-section:${campaignId}`;
}

export function useActiveSection(campaignId: string) {
  const [activeSection, setActiveSection] = useState<PrepSection>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(campaignId));
      if (saved === 'characters') return 'players';
      if (saved && PREP_SECTIONS.some((s) => s.id === saved)) {
        return saved as PrepSection;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PREP_SECTION;
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
