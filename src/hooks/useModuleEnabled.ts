import { useMemo } from 'react';
import { useCampaign } from '@/hooks/useCampaigns';
import { useCombatRules } from '@/hooks/useLiveSession';
import { useResolvedCustomBlocks } from '@/hooks/useCustomModules';
import type { Campaign } from '@/types/campaign';

/**
 * Returns the set of enabled module IDs for a campaign.
 * The backend always populates rulesConfig.enabledModules (derived from
 * the legacy system field when not explicitly set), so no frontend
 * fallback mapping is needed.
 */
function getEnabledModules(campaign: Campaign | undefined): Set<string> {
  if (!campaign) return new Set();
  return new Set(campaign.rulesConfig?.enabledModules ?? []);
}

/** Returns whether a specific module is enabled for the given campaign. */
export function useModuleEnabled(
  campaign: Campaign | undefined,
  moduleId: string,
): boolean {
  return useMemo(
    () => getEnabledModules(campaign).has(moduleId),
    [campaign?.rulesConfig, moduleId],
  );
}

/** Returns the full set of enabled module IDs for the given campaign. */
export function useEnabledModules(
  campaign: Campaign | undefined,
): Set<string> {
  return useMemo(
    () => getEnabledModules(campaign),
    [campaign?.rulesConfig],
  );
}

/**
 * Convenience hook for components that only have campaignId (not the full
 * Campaign object). Uses the cached campaign query from TanStack Query.
 */
export function useCampaignModuleEnabled(
  campaignId: string,
  moduleId: string,
): boolean {
  const { data: campaign } = useCampaign(campaignId);
  return useMemo(
    () => getEnabledModules(campaign).has(moduleId),
    [campaign?.rulesConfig, moduleId],
  );
}

/** Returns the full set of enabled module IDs for a campaign, by ID. */
export function useCampaignEnabledModules(
  campaignId: string,
): Set<string> {
  const { data: campaign } = useCampaign(campaignId);
  return useMemo(
    () => getEnabledModules(campaign),
    [campaign?.rulesConfig],
  );
}

/**
 * Returns the module config value for a specific module, or undefined
 * if not configured.
 */
export function useModuleConfig<T = Record<string, unknown>>(
  campaign: Campaign | undefined,
  moduleId: string,
): T | undefined {
  return useMemo(() => {
    if (!campaign?.rulesConfig?.moduleConfig) return undefined;
    return campaign.rulesConfig.moduleConfig[moduleId] as T | undefined;
  }, [campaign?.rulesConfig, moduleId]);
}

/**
 * Returns "Exchange" when exchange-fate module is enabled, "Round" otherwise.
 * Used to relabel combat rounds for Fate campaigns.
 */
export function useRoundLabel(campaignId: string): string {
  const hasExchangeModule = useCampaignModuleEnabled(campaignId, 'exchange-fate');
  return hasExchangeModule ? 'Exchange' : 'Round';
}

/**
 * Returns the list of available conditions for a campaign based on
 * its enabled condition modules. Falls back to the conditions provided
 * by the CombatRulesProfile (which is derived from modules on the backend).
 */
export function useAvailableConditions(
  campaignId: string,
): { key: string; label: string; description: string; hasValue?: boolean }[] {
  const { data: rules } = useCombatRules(campaignId);
  const { data: customBlocks } = useResolvedCustomBlocks(campaignId);
  return useMemo(() => {
    const base = rules?.conditions ?? [];
    const custom = (customBlocks?.conditions ?? []).map((c) => ({
      key: c.key,
      label: c.label,
      description: c.description,
      hasValue: c.hasValue,
    }));
    return [...base, ...custom];
  }, [rules?.conditions, customBlocks?.conditions]);
}
