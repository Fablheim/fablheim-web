import { api } from './client';
import type { Ally, AllyHp, CreateAllyPayload, UpdateAllyPayload } from '@/types/campaign';

export const alliesApi = {
  list: async (campaignId: string): Promise<Ally[]> => {
    const { data } = await api.get<Ally[]>(`/campaigns/${campaignId}/allies`);
    return data;
  },

  create: async (campaignId: string, body: CreateAllyPayload): Promise<Ally> => {
    const { data } = await api.post<Ally>(`/campaigns/${campaignId}/allies`, body);
    return data;
  },

  update: async (campaignId: string, id: string, body: UpdateAllyPayload): Promise<Ally> => {
    const { data } = await api.patch<Ally>(`/campaigns/${campaignId}/allies/${id}`, body);
    return data;
  },

  updateHp: async (campaignId: string, id: string, hp: AllyHp): Promise<Ally> => {
    const { data } = await api.patch<Ally>(`/campaigns/${campaignId}/allies/${id}/hp`, { hp });
    return data;
  },

  remove: async (campaignId: string, id: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/allies/${id}`);
  },
};
