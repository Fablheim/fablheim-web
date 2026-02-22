import { api } from './client';
import type { Campaign, CreateCampaignPayload, UpdateCampaignPayload } from '@/types/campaign';

export const campaignsApi = {
  list: async (): Promise<Campaign[]> => {
    const { data } = await api.get<Campaign[]>('/campaigns');
    return data;
  },

  get: async (id: string): Promise<Campaign> => {
    const { data } = await api.get<Campaign>(`/campaigns/${id}`);
    return data;
  },

  create: async (body: CreateCampaignPayload): Promise<Campaign> => {
    const { data } = await api.post<Campaign>('/campaigns', body);
    return data;
  },

  update: async (id: string, body: UpdateCampaignPayload): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/campaigns/${id}`);
  },
};
