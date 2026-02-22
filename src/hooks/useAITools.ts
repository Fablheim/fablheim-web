import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import type { AxiosError } from 'axios';

function handleAIError(error: unknown) {
  const axiosError = error as AxiosError<{ error?: string; message?: string; cost?: number; balance?: number }>;
  if (axiosError.response?.status === 402) {
    const data = axiosError.response.data;
    toast.error(
      data?.message || `Not enough credits. You need ${data?.cost ?? '?'} credits but only have ${data?.balance ?? 0}.`,
    );
  } else {
    toast.error('AI generation failed. Please try again.');
  }
}

export function useGenerateNPC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateNPCRequest) => aiToolsApi.generateNPC(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
    },
    onError: handleAIError,
  });
}

export function useGenerateEncounter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateEncounterRequest) => aiToolsApi.generateEncounter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
    },
    onError: handleAIError,
  });
}

export function useAskRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AskRuleRequest) => aiToolsApi.askRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
    },
    onError: handleAIError,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GeneratePlotHooksRequest) => aiToolsApi.generatePlotHooks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
    },
    onError: handleAIError,
  });
}

export function useGenerateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateLocationRequest) => aiToolsApi.generateLocation(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
    },
    onError: handleAIError,
  });
}

export function useGenerateTavern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateTavernRequest) => aiToolsApi.generateTavern(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
    },
    onError: handleAIError,
  });
}

export function useGenerateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateShopRequest) => aiToolsApi.generateShop(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
    },
    onError: handleAIError,
  });
}

export function useGenerateWorldNPC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateWorldNPCRequest) => aiToolsApi.generateWorldNPC(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
    },
    onError: handleAIError,
  });
}
