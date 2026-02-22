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
};
