import { api } from './client';
import type { Session, SessionStatistics, CreateSessionRequest, UpdateSessionRequest } from '@/types/campaign';

export const sessionsApi = {
  list: async (campaignId: string): Promise<Session[]> => {
    const { data } = await api.get<Session[]>(
      `/campaigns/${campaignId}/sessions`,
    );
    return data;
  },

  get: async (campaignId: string, id: string): Promise<Session> => {
    const { data } = await api.get<Session>(
      `/campaigns/${campaignId}/sessions/${id}`,
    );
    return data;
  },

  create: async (body: CreateSessionRequest): Promise<Session> => {
    const { data } = await api.post<Session>(
      `/campaigns/${body.campaignId}/sessions`,
      body,
    );
    return data;
  },

  update: async (
    campaignId: string,
    id: string,
    body: UpdateSessionRequest,
  ): Promise<Session> => {
    const { data } = await api.patch<Session>(
      `/campaigns/${campaignId}/sessions/${id}`,
      body,
    );
    return data;
  },

  delete: async (campaignId: string, id: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/sessions/${id}`);
  },

  generateAISummary: async (campaignId: string, sessionId: string): Promise<Session> => {
    const { data } = await api.post<Session>(
      `/campaigns/${campaignId}/sessions/${sessionId}/ai/generate-summary`
    );
    return data;
  },

  // ── Session Lifecycle ──────────────────────────────────────

  startSession: async (campaignId: string, sessionId: string): Promise<Session> => {
    const { data } = await api.post<Session>(
      `/campaigns/${campaignId}/sessions/${sessionId}/start`,
    );
    return data;
  },

  endSession: async (
    campaignId: string,
    sessionId: string,
    generateRecap = true,
  ): Promise<Session> => {
    const { data } = await api.post<Session>(
      `/campaigns/${campaignId}/sessions/${sessionId}/end`,
      { generateRecap },
    );
    return data;
  },

  getStatistics: async (campaignId: string, sessionId: string): Promise<SessionStatistics> => {
    const { data } = await api.get<SessionStatistics>(
      `/campaigns/${campaignId}/sessions/${sessionId}/statistics`,
    );
    return data;
  },

  getRecap: async (
    campaignId: string,
    sessionId: string,
  ): Promise<{ recap: string | null; generatedAt: string | null }> => {
    const { data } = await api.get<{ recap: string | null; generatedAt: string | null }>(
      `/campaigns/${campaignId}/sessions/${sessionId}/recap`,
    );
    return data;
  },

  regenerateRecap: async (
    campaignId: string,
    sessionId: string,
  ): Promise<{ recap: string }> => {
    const { data } = await api.post<{ recap: string }>(
      `/campaigns/${campaignId}/sessions/${sessionId}/recap/regenerate`,
    );
    return data;
  },
};
