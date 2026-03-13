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
      queryClient.invalidateQueries({ queryKey: ['world-entities', variables.campaignId, 'tree'] });
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
      queryClient.invalidateQueries({ queryKey: ['allies', variables.campaignId] });
    },
  });
}

export function useWorldTree(campaignId: string) {
  return useQuery({
    queryKey: ['world-entities', campaignId, 'tree'],
    queryFn: () => worldEntitiesApi.getTree(campaignId),
    enabled: !!campaignId,
  });
}

export function useUnassignedEntities(campaignId: string, type?: string) {
  return useQuery({
    queryKey: ['world-entities', campaignId, 'unassigned', type ?? 'all'],
    queryFn: () => worldEntitiesApi.list(campaignId, type, null),
    enabled: !!campaignId,
  });
}

export function useWorldEntityChildren(campaignId: string, entityId: string) {
  return useQuery({
    queryKey: ['world-entities', campaignId, 'children', entityId],
    queryFn: () => worldEntitiesApi.getChildren(campaignId, entityId),
    enabled: !!campaignId && !!entityId,
  });
}

export function useWorldEntityReferences(campaignId: string, entityId: string) {
  return useQuery({
    queryKey: ['world-entities', campaignId, 'references', entityId],
    queryFn: () => worldEntitiesApi.getReferences(campaignId, entityId),
    enabled: !!campaignId && !!entityId,
  });
}

// ── Discovery ─────────────────────────────────────────

export function useToggleDiscovery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, entityId, discovered }: { campaignId: string; entityId: string; discovered: boolean }) =>
      worldEntitiesApi.toggleDiscovery(campaignId, entityId, discovered),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['world-entities', 'detail', v.entityId] });
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

// ── Quest Outcomes ─────────────────────────────────────────

export function useChooseOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, entityId, outcomeId }: { campaignId: string; entityId: string; outcomeId: string }) =>
      worldEntitiesApi.chooseOutcome(campaignId, entityId, outcomeId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['world-entities', 'detail', v.entityId] });
    },
  });
}

// ── Faction Reputation ─────────────────────────────────────

export function useAdjustReputation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      entityId,
      data,
    }: {
      campaignId: string;
      entityId: string;
      data: { delta: number; description: string; sessionNumber?: number };
    }) => worldEntitiesApi.adjustReputation(campaignId, entityId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['world-entities', 'detail', v.entityId] });
    },
  });
}

// ── NPC Secrets & Attitude ─────────────────────────────────

export function useRevealSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, entityId, secretId }: { campaignId: string; entityId: string; secretId: string }) =>
      worldEntitiesApi.revealSecret(campaignId, entityId, secretId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['world-entities', 'detail', v.entityId] });
    },
  });
}

export function useAddAttitudeEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      entityId,
      data,
    }: {
      campaignId: string;
      entityId: string;
      data: { description: string; sessionNumber?: number; newDisposition?: string };
    }) => worldEntitiesApi.addAttitudeEvent(campaignId, entityId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['world-entities', v.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['world-entities', 'detail', v.entityId] });
    },
  });
}
