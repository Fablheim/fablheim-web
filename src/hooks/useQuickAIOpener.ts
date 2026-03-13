import { useCallback, useEffect, useState } from 'react';

export type AIFocusTool = 'npc' | 'encounter' | 'quest' | 'lore' | 'location';

/**
 * Manages Quick AI panel visibility toggle and AI tool focus opener.
 * Shared between DM sidebar and DM main content — uses the same
 * localStorage key so both stay in sync.
 */
export function useQuickAIOpener() {
  const [showQuickAI, setShowQuickAIRaw] = useState(() => {
    try {
      return localStorage.getItem('fablheim:session-v2-show-quick-ai') !== '0';
    } catch {
      return true;
    }
  });
  const [aiFocusSeed, setAiFocusSeed] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('fablheim:session-v2-show-quick-ai', showQuickAI ? '1' : '0');
    } catch {
      // Ignore localStorage failures
    }
  }, [showQuickAI]);

  const setShowQuickAI = useCallback((value: boolean) => {
    setShowQuickAIRaw(value);
  }, []);

  const openAITool = useCallback((tool: AIFocusTool) => {
    try {
      localStorage.setItem('fablheim:session-v2-ai-focus', tool);
    } catch {
      // Ignore localStorage failures
    }
    setAiFocusSeed((v) => v + 1);
  }, []);

  return {
    showQuickAI,
    setShowQuickAI,
    aiFocusSeed,
    openAITool,
  };
}
