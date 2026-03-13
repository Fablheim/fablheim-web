import { api } from './client';

export interface ReversibleAction {
  id: string;
  type: string;
  campaignId: string;
  timestamp: string;
  description: string;
}

export const initiativeUndoApi = {
  undo: async (campaignId: string): Promise<{ undone: ReversibleAction }> => {
    const { data } = await api.post(`/campaigns/${campaignId}/session/initiative/undo`);
    return data;
  },

  peek: async (campaignId: string): Promise<{ action: ReversibleAction | null }> => {
    const { data } = await api.get(`/campaigns/${campaignId}/session/initiative/undo-peek`);
    return data;
  },
};
