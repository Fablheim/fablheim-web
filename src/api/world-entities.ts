import { api } from './client';
import type {
  WorldEntity,
  CreateWorldEntityPayload,
  UpdateWorldEntityPayload,
} from '@/types/campaign';

export const worldEntitiesApi = {
  list: async (campaignId: string, type?: string): Promise<WorldEntity[]> => {
    const { data } = await api.get<WorldEntity[]>(
      `/campaigns/${campaignId}/world/entities`,
      { params: type ? { type } : undefined },
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

  // Hierarchy methods

  getChildren: async (campaignId: string, entityId: string): Promise<WorldEntity[]> => {
    const { data } = await api.get<WorldEntity[]>(
      `/campaigns/${campaignId}/world/entities/${entityId}/children`,
    );
    return data;
  },
};
