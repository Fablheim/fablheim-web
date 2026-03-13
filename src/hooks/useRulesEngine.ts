import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesEngineApi } from '@/api/rules-engine';
import { campaignsApi } from '@/api/campaigns';

export function useRulesModules() {
  return useQuery({
    queryKey: ['rules-engine', 'modules'],
    queryFn: () => rulesEngineApi.getModules(),
    staleTime: 1000 * 60 * 60, // static data — cache for 1 hour
  });
}

export function useRulesPresets() {
  return useQuery({
    queryKey: ['rules-engine', 'presets'],
    queryFn: () => rulesEngineApi.getPresets(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useExclusivityGroups() {
  return useQuery({
    queryKey: ['rules-engine', 'exclusivity-groups'],
    queryFn: () => rulesEngineApi.getExclusivityGroups(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useCampaignRulesConfig(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'rules-config'],
    queryFn: () => campaignsApi.getRulesConfig(campaignId),
    enabled: !!campaignId,
  });
}

export function useUpdateCampaignRulesConfig(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      presetId?: string;
      enabledModules: string[];
      moduleConfig: Record<string, Record<string, unknown>>;
      customModules?: string[];
    }) => campaignsApi.updateRulesConfig(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', campaignId, 'rules-config'],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaigns', campaignId],
      });
    },
  });
}
