import { api } from './client';
import type { Handout } from '@/types/campaign';

export const handoutsApi = {
  list: async (campaignId: string, role?: string): Promise<Handout[]> => {
    const { data } = await api.get<Handout[]>(
      `/campaigns/${campaignId}/session/handouts`,
      { params: role ? { role } : undefined },
    );
    return data;
  },

  create: async (
    campaignId: string,
    body: { title: string; type: string; content?: string; imageUrl?: string; visibleTo?: string },
  ): Promise<Handout> => {
    const { data } = await api.post<Handout>(
      `/campaigns/${campaignId}/session/handouts`,
      body,
    );
    return data;
  },

  share: async (campaignId: string, handoutId: string): Promise<Handout> => {
    const { data } = await api.post<Handout>(
      `/campaigns/${campaignId}/session/handouts/${handoutId}/share`,
    );
    return data;
  },

  unshare: async (campaignId: string, handoutId: string): Promise<Handout> => {
    const { data } = await api.post<Handout>(
      `/campaigns/${campaignId}/session/handouts/${handoutId}/unshare`,
    );
    return data;
  },

  update: async (
    campaignId: string,
    handoutId: string,
    body: { title?: string; content?: string; imageUrl?: string },
  ): Promise<Handout> => {
    const { data } = await api.patch<Handout>(
      `/campaigns/${campaignId}/session/handouts/${handoutId}`,
      body,
    );
    return data;
  },

  delete: async (campaignId: string, handoutId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/session/handouts/${handoutId}`);
  },
};
