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

// ── Quest hooks ─────────────────────────────────────────

export function useUpdateQuestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, entityId, status }: { campaignId: string; entityId: string; status: string }) =>
      worldEntitiesApi.updateQuestStatus(campaignId, entityId, status),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
    },
  });
}

export function useToggleObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, entityId, objectiveId }: { campaignId: string; entityId: string; objectiveId: string }) =>
      worldEntitiesApi.toggleObjective(campaignId, entityId, objectiveId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
    },
  });
}

export function useAddObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, entityId, description }: { campaignId: string; entityId: string; description: string }) =>
      worldEntitiesApi.addObjective(campaignId, entityId, description),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
    },
  });
}

export function useRemoveObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, entityId, objectiveId }: { campaignId: string; entityId: string; objectiveId: string }) =>
      worldEntitiesApi.removeObjective(campaignId, entityId, objectiveId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
    },
  });
}
