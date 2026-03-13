import { api } from './client';
import type {
  WorldEntity,
  WorldTreeNode,
  CreateWorldEntityPayload,
  UpdateWorldEntityPayload,
} from '@/types/campaign';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
}

export const worldEntitiesApi = {
  list: async (
    campaignId: string,
    type?: string,
    parentEntityId?: string | null,
  ): Promise<WorldEntity[]> => {
    const params: Record<string, string | undefined> = {};
    if (type) params.type = type;
    if (parentEntityId === null) params.parentEntityId = 'null';
    else if (parentEntityId) params.parentEntityId = parentEntityId;
    const { data } = await api.get<PaginatedResult<WorldEntity>>(
      `/campaigns/${campaignId}/world/entities`,
      { params: Object.keys(params).length ? params : undefined },
    );
    return data.data;
  },

  listPaginated: async (
    campaignId: string,
    opts?: { type?: string; parentEntityId?: string | null; limit?: number; skip?: number },
  ): Promise<PaginatedResult<WorldEntity>> => {
    const { data } = await api.get<PaginatedResult<WorldEntity>>(
      `/campaigns/${campaignId}/world/entities`,
      {
        params: {
          type: opts?.type,
          parentEntityId: opts?.parentEntityId === null ? 'null' : opts?.parentEntityId,
          limit: opts?.limit,
          skip: opts?.skip,
        },
      },
    );
    return data;
  },

  get: async (campaignId: string, id: string): Promise<WorldEntity> => {
    const { data } = await api.get<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${id}`,
    );
    return data;
  },

  create: async (campaignId: string, body: CreateWorldEntityPayload): Promise<WorldEntity> => {
    const { data } = await api.post<WorldEntity>(
      `/campaigns/${campaignId}/world/entities`,
      body,
    );
    return data;
  },

  update: async (
    campaignId: string,
    id: string,
    body: UpdateWorldEntityPayload,
  ): Promise<WorldEntity> => {
    const { data } = await api.patch<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${id}`,
      body,
    );
    return data;
  },

  delete: async (campaignId: string, id: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/world/entities/${id}`);
  },

  // Quest methods

  updateQuestStatus: async (campaignId: string, entityId: string, status: string): Promise<WorldEntity> => {
    const { data } = await api.patch<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${entityId}/quest-status`,
      { status },
    );
    return data;
  },

  toggleObjective: async (campaignId: string, entityId: string, objectiveId: string): Promise<WorldEntity> => {
    const { data } = await api.patch<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${entityId}/objectives/${objectiveId}`,
    );
    return data;
  },

  addObjective: async (campaignId: string, entityId: string, description: string): Promise<WorldEntity> => {
    const { data } = await api.post<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${entityId}/objectives`,
      { description },
    );
    return data;
  },

  removeObjective: async (campaignId: string, entityId: string, objectiveId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/world/entities/${entityId}/objectives/${objectiveId}`);
  },

  // References (reverse lookup)

  getReferences: async (campaignId: string, entityId: string): Promise<WorldEntity[]> => {
    const { data } = await api.get<WorldEntity[]>(
      `/campaigns/${campaignId}/world/entities/${entityId}/references`,
    );
    return data;
  },

  // Hierarchy methods

  getChildren: async (campaignId: string, entityId: string): Promise<WorldEntity[]> => {
    const { data } = await api.get<WorldEntity[]>(
      `/campaigns/${campaignId}/world/entities/${entityId}/children`,
    );
    return data;
  },

  getTree: async (campaignId: string): Promise<WorldTreeNode[]> => {
    const { data } = await api.get<WorldTreeNode[]>(
      `/campaigns/${campaignId}/world/entities/tree`,
    );
    return data;
  },

  // ── Discovery ──────────────────────────────────────────

  toggleDiscovery: async (campaignId: string, entityId: string, discovered: boolean): Promise<WorldEntity> => {
    const { data } = await api.patch<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${entityId}/discover`,
      { discovered },
    );
    return data;
  },

  // ── Quest Outcomes ───────────────────────────────────────

  chooseOutcome: async (campaignId: string, entityId: string, outcomeId: string): Promise<WorldEntity> => {
    const { data } = await api.patch<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${entityId}/outcomes/${outcomeId}/choose`,
    );
    return data;
  },

  // ── Faction Reputation ──────────────────────────────────

  adjustReputation: async (
    campaignId: string,
    entityId: string,
    body: { delta: number; description: string; sessionNumber?: number },
  ): Promise<WorldEntity> => {
    const { data } = await api.post<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${entityId}/reputation`,
      body,
    );
    return data;
  },

  // ── NPC Secrets & Attitude ──────────────────────────────

  revealSecret: async (campaignId: string, entityId: string, secretId: string): Promise<WorldEntity> => {
    const { data } = await api.patch<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${entityId}/secrets/${secretId}/reveal`,
    );
    return data;
  },

  addAttitudeEvent: async (
    campaignId: string,
    entityId: string,
    body: { description: string; sessionNumber?: number; newDisposition?: string },
  ): Promise<WorldEntity> => {
    const { data } = await api.post<WorldEntity>(
      `/campaigns/${campaignId}/world/entities/${entityId}/attitude`,
      body,
    );
    return data;
  },
};
