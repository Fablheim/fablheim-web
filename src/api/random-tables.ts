import { api } from './client';
import type {
  RandomTable,
  RollResult,
  CreateRandomTablePayload,
  UpdateRandomTablePayload,
} from '@/types/random-table';

export const randomTablesApi = {
  list: async (campaignId: string): Promise<RandomTable[]> => {
    const { data } = await api.get<RandomTable[]>(
      `/campaigns/${campaignId}/tables`,
    );
    return data;
  },

  roll: async (campaignId: string, tableId: string): Promise<RollResult> => {
    const { data } = await api.post<RollResult>(
      `/campaigns/${campaignId}/tables/${tableId}/roll`,
    );
    return data;
  },

  create: async (
    campaignId: string,
    body: CreateRandomTablePayload,
  ): Promise<RandomTable> => {
    const { data } = await api.post<RandomTable>(
      `/campaigns/${campaignId}/tables`,
      body,
    );
    return data;
  },

  update: async (
    campaignId: string,
    tableId: string,
    body: UpdateRandomTablePayload,
  ): Promise<RandomTable> => {
    const { data } = await api.patch<RandomTable>(
      `/campaigns/${campaignId}/tables/${tableId}`,
      body,
    );
    return data;
  },

  remove: async (campaignId: string, tableId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/tables/${tableId}`);
  },
};
