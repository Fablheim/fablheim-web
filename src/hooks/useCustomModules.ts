import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customModulesApi } from '@/api/custom-modules';
import type { CreateCustomModulePayload, UpdateCustomModulePayload } from '@/types/custom-module';

export function useCustomModules(campaignId: string) {
  return useQuery({
    queryKey: ['custom-modules', campaignId],
    queryFn: () => customModulesApi.list(campaignId),
    enabled: !!campaignId,
  });
}

export function useCustomModule(campaignId: string, id: string) {
  return useQuery({
    queryKey: ['custom-modules', campaignId, id],
    queryFn: () => customModulesApi.get(campaignId, id),
    enabled: !!campaignId && !!id,
  });
}

export function useResolvedCustomBlocks(campaignId: string) {
  return useQuery({
    queryKey: ['custom-modules-resolved', campaignId],
    queryFn: () => customModulesApi.getResolved(campaignId),
    enabled: !!campaignId,
  });
}

export function useCreateCustomModule(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomModulePayload) =>
      customModulesApi.create(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-modules', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['custom-modules-resolved', campaignId] });
    },
  });
}

export function useUpdateCustomModule(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCustomModulePayload }) =>
      customModulesApi.update(campaignId, id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-modules', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['custom-modules-resolved', campaignId] });
    },
  });
}

export function useDeleteCustomModule(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customModulesApi.remove(campaignId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-modules', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['custom-modules-resolved', campaignId] });
    },
  });
}
