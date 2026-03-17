import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useCampaign, useUpdateSafetyTools } from '@/hooks/useCampaigns';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SafetyToolId =
  | 'overview'
  | 'lines-veils'
  | 'x-card'
  | 'open-door'
  | 'check-ins'
  | 'player-notes';

export type SafetyDraft = {
  lines: string[];
  veils: string[];
  xCardEnabled: boolean;
  xCardGuidance: string;
  openDoorEnabled: boolean;
  openDoorNotes: string;
  checkInPrompts: string[];
  playerNotes: string[];
};

// ── Context value ─────────────────────────────────────────────────────────────

interface SafetyContextValue {
  campaignId: string;

  // Data
  draft: SafetyDraft;
  isLoading: boolean;

  // Reviewed state
  reviewedAt: string | null;
  handleMarkReviewed: () => void;

  // UI state
  activeTool: SafetyToolId;
  setActiveTool: (tool: SafetyToolId) => void;

  // Mutation
  updateSafety: ReturnType<typeof useUpdateSafetyTools>;
}

const SafetyContext = createContext<SafetyContextValue | null>(null);

export function useSafetyContext() {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error('useSafetyContext must be used within SafetyProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SafetyProvider({
  campaignId,
  children,
}: {
  campaignId: string;
  children: ReactNode;
}) {
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const updateSafety = useUpdateSafetyTools();

  const storageKey = `fablheim:safety:reviewed:${campaignId}`;
  const [reviewedAt, setReviewedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey) ?? null;
    } catch {
      return null;
    }
  });

  const [activeTool, setActiveTool] = useState<SafetyToolId>('overview');

  const handleMarkReviewed = useCallback(() => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(storageKey, now);
    } catch {
      /* ignore */
    }
    setReviewedAt(now);
  }, [storageKey]);

  const draft = useMemo<SafetyDraft>(() => {
    const safetyTools = campaign?.safetyTools;
    return {
      lines: safetyTools?.lines ?? [],
      veils: safetyTools?.veils ?? [],
      xCardEnabled: safetyTools?.xCardEnabled ?? false,
      xCardGuidance: safetyTools?.xCardGuidance ?? '',
      openDoorEnabled: safetyTools?.openDoorEnabled ?? true,
      openDoorNotes: safetyTools?.openDoorNotes ?? '',
      checkInPrompts: safetyTools?.checkInPrompts ?? [],
      playerNotes: safetyTools?.playerNotes ?? [],
    };
  }, [campaign?.safetyTools]);

  const value: SafetyContextValue = {
    campaignId,
    draft,
    isLoading,
    reviewedAt,
    handleMarkReviewed,
    activeTool,
    setActiveTool,
    updateSafety,
  };

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}
