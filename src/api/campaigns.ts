import { api } from './client';
import type { Campaign, CreateCampaignPayload, UpdateCampaignPayload, Session } from '@/types/campaign';

export const campaignsApi = {
  list: async (): Promise<Campaign[]> => {
    const { data } = await api.get<Campaign[]>('/campaigns');
    return data;
  },

  listArchived: async (): Promise<Campaign[]> => {
    const { data } = await api.get<Campaign[]>('/campaigns', {
      params: { archived: 'true' },
    });
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

  delete: async (id: string): Promise<Campaign> => {
    const { data } = await api.delete<Campaign>(`/campaigns/${id}`);
    return data;
  },

  restore: async (id: string): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/restore`);
    return data;
  },

  deletePermanently: async (id: string): Promise<void> => {
    await api.delete(`/campaigns/${id}/permanent`);
  },

  // ── Stage Transitions ──────────────────────────────────────

  startSession: async (
    id: string,
    encounterId?: string,
  ): Promise<{ campaign: Campaign; session: Session }> => {
    const { data } = await api.post<{ campaign: Campaign; session: Session }>(
      `/campaigns/${id}/start-session`,
      encounterId ? { encounterId } : {},
    );
    return data;
  },

  endSession: async (
    id: string,
    keyMoments?: string[],
  ): Promise<{ campaign: Campaign; session: Session }> => {
    const { data } = await api.post<{ campaign: Campaign; session: Session }>(
      `/campaigns/${id}/end-session`,
      keyMoments?.length ? { keyMoments } : {},
    );
    return data;
  },

  returnToPrep: async (id: string): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/return-to-prep`);
    return data;
  },
};
