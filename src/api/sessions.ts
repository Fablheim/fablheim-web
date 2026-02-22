import { api } from './client';
import type { Session, CreateSessionRequest, UpdateSessionRequest } from '@/types/campaign';

export const sessionsApi = {
  list: async (campaignId: string): Promise<Session[]> => {
    const { data } = await api.get<Session[]>('/sessions', {
      params: { campaignId },
    });
    return data;
  },

  get: async (id: string): Promise<Session> => {
    const { data } = await api.get<Session>(`/sessions/${id}`);
    return data;
  },

  create: async (body: CreateSessionRequest): Promise<Session> => {
    const { data } = await api.post<Session>('/sessions', body);
    return data;
  },

  update: async (id: string, body: UpdateSessionRequest): Promise<Session> => {
    const { data } = await api.patch<Session>(`/sessions/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },

  generateAISummary: async (campaignId: string, sessionId: string): Promise<Session> => {
    const { data } = await api.post<Session>(
      `/campaigns/${campaignId}/sessions/${sessionId}/ai/generate-summary`
    );
    return data;
  },
};
