import { api } from './client';
import type {
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  Session,
  CampaignArc,
  WorldStateTracker,
} from '@/types/campaign';

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
    await api.delete(`/campaigns/${id}/permanent`, { data: { confirm: true } });
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

  // ── Arcs ─────────────────────────────────────────────────

  getArcs: async (id: string): Promise<CampaignArc[]> => {
    const { data } = await api.get<CampaignArc[]>(`/campaigns/${id}/arcs`);
    return data;
  },

  addArc: async (
    id: string,
    body: { name: string; description?: string; status?: string; sortOrder?: number; milestones?: Array<{ description: string; completed?: boolean }> },
  ): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/arcs`, body);
    return data;
  },

  updateArc: async (
    id: string,
    arcId: string,
    body: { name?: string; description?: string; status?: string; sortOrder?: number },
  ): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/arcs/${arcId}`, body);
    return data;
  },

  removeArc: async (id: string, arcId: string): Promise<void> => {
    await api.delete(`/campaigns/${id}/arcs/${arcId}`);
  },

  addArcMilestone: async (
    id: string,
    arcId: string,
    body: { description: string; completed?: boolean },
  ): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/arcs/${arcId}/milestones`, body);
    return data;
  },

  toggleArcMilestone: async (id: string, arcId: string, milestoneId: string): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/arcs/${arcId}/milestones/${milestoneId}`);
    return data;
  },

  // ── Trackers ─────────────────────────────────────────────

  getTrackers: async (id: string): Promise<WorldStateTracker[]> => {
    const { data } = await api.get<WorldStateTracker[]>(`/campaigns/${id}/trackers`);
    return data;
  },

  addTracker: async (
    id: string,
    body: { name: string; description?: string; value?: number; min?: number; max?: number; thresholds?: Array<{ value: number; label: string; effect?: string }>; visibility?: string },
  ): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/trackers`, body);
    return data;
  },

  updateTracker: async (
    id: string,
    trackerId: string,
    body: { name?: string; description?: string; value?: number; min?: number; max?: number; thresholds?: Array<{ value: number; label: string; effect?: string }>; visibility?: string },
  ): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/trackers/${trackerId}`, body);
    return data;
  },

  adjustTracker: async (id: string, trackerId: string, delta: number): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/trackers/${trackerId}/adjust`, { delta });
    return data;
  },

  removeTracker: async (id: string, trackerId: string): Promise<void> => {
    await api.delete(`/campaigns/${id}/trackers/${trackerId}`);
  },
};
