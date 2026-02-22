import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiToolsApi } from '@/api/ai-tools';
import type {
  GenerateNPCRequest,
  GenerateEncounterRequest,
  AskRuleRequest,
  GeneratePlotHooksRequest,
  GenerateLocationRequest,
  GenerateTavernRequest,
  GenerateShopRequest,
  GenerateWorldNPCRequest,
} from '@/types/ai-tools';

export function useGenerateNPC() {
  return useMutation({
    mutationFn: (data: GenerateNPCRequest) => aiToolsApi.generateNPC(data),
  });
}

export function useGenerateEncounter() {
  return useMutation({
    mutationFn: (data: GenerateEncounterRequest) => aiToolsApi.generateEncounter(data),
  });
}

export function useAskRule() {
  return useMutation({
    mutationFn: (data: AskRuleRequest) => aiToolsApi.askRule(data),
  });
}

export function useRecentRules(campaignId: string) {
  return useQuery({
    queryKey: ['ai-rules', campaignId],
    queryFn: () => aiToolsApi.getRecentRules(campaignId),
    enabled: !!campaignId,
  });
}

export function useGeneratePlotHooks() {
  return useMutation({
    mutationFn: (data: GeneratePlotHooksRequest) => aiToolsApi.generatePlotHooks(data),
  });
}

export function useGenerateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateLocationRequest) => aiToolsApi.generateLocation(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
    },
  });
}

export function useGenerateTavern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateTavernRequest) => aiToolsApi.generateTavern(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
    },
  });
}

export function useGenerateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateShopRequest) => aiToolsApi.generateShop(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
    },
  });
}

export function useGenerateWorldNPC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateWorldNPCRequest) => aiToolsApi.generateWorldNPC(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
    },
  });
}
