import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worldEntitiesApi } from '@/api/world-entities';
import type { CreateWorldEntityPayload, UpdateWorldEntityPayload } from '@/types/campaign';

export function useWorldEntities(campaignId: string, type?: string) {
  return useQuery({
    queryKey: ['world-entities', campaignId, type ?? 'all'],
    queryFn: () => worldEntitiesApi.list(campaignId, type),
    enabled: !!campaignId,
  });
}

export function useWorldNPCs(campaignId: string) {
  return useQuery({
    queryKey: ['world-entities', campaignId, 'npc'],
    queryFn: () => worldEntitiesApi.list(campaignId, 'npc'),
    enabled: !!campaignId,
  });
}

export function useWorldEntity(campaignId: string, id: string) {
  return useQuery({
    queryKey: ['world-entities', 'detail', id],
    queryFn: () => worldEntitiesApi.get(campaignId, id),
    enabled: !!campaignId && !!id,
  });
}

export function useCreateWorldEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateWorldEntityPayload }) =>
      worldEntitiesApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
    },
  });
}

export function useUpdateWorldEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      id,
      data,
    }: {
      campaignId: string;
      id: string;
      data: UpdateWorldEntityPayload;
    }) => worldEntitiesApi.update(campaignId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['world-entities', 'detail', variables.id] });
    },
  });
}

export function useDeleteWorldEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, id }: { campaignId: string; id: string }) =>
      worldEntitiesApi.delete(campaignId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId] });
    },
  });
}
