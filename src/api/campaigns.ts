import { api } from './client';
import type {
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  Session,
  CampaignArc,
  WorldStateTracker,
  CalendarPresetType,
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

  // ── Safety Tools ─────────────────────────────────────────

  updateSafetyTools: async (
    id: string,
    body: {
      lines?: string[];
      veils?: string[];
      xCardEnabled?: boolean;
      xCardGuidance?: string;
      openDoorEnabled?: boolean;
      openDoorNotes?: string;
      checkInPrompts?: string[];
      playerNotes?: string[];
    },
  ): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/safety-tools`, body);
    return data;
  },

  // ── Rules Config ─────────────────────────────────────────

  getRulesConfig: async (id: string) => {
    const { data } = await api.get<{
      rulesConfig: import('@/types/campaign').CampaignRulesConfig;
      resolvedModules: Array<{ id: string; name: string; category: string }>;
      preset: { id: string; name: string } | null;
    }>(`/campaigns/${id}/rules-config`);
    return data;
  },

  updateRulesConfig: async (
    id: string,
    body: {
      presetId?: string;
      enabledModules: string[];
      moduleConfig: Record<string, Record<string, unknown>>;
      customModules?: string[];
    },
  ) => {
    const { data } = await api.patch(`/campaigns/${id}/rules-config`, body);
    return data;
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
    body: {
      name: string;
      description?: string;
      status?: string;
      type?: string;
      pressure?: string;
      stakes?: string;
      currentState?: string;
      recentChange?: string;
      nextDevelopment?: string;
      sortOrder?: number;
      milestones?: Array<{ description: string; completed?: boolean }>;
      links?: {
        entityIds?: string[];
        sessionIds?: string[];
        encounterIds?: string[];
        handoutIds?: string[];
        downtimeIds?: string[];
        calendarEventIds?: string[];
        trackerIds?: string[];
      };
    },
  ): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/arcs`, body);
    return data;
  },

  updateArc: async (
    id: string,
    arcId: string,
    body: {
      name?: string;
      description?: string;
      status?: string;
      type?: string;
      pressure?: string;
      stakes?: string;
      currentState?: string;
      recentChange?: string;
      nextDevelopment?: string;
      sortOrder?: number;
      links?: {
        entityIds?: string[];
        sessionIds?: string[];
        encounterIds?: string[];
        handoutIds?: string[];
        downtimeIds?: string[];
        calendarEventIds?: string[];
        trackerIds?: string[];
      };
    },
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

  addArcDevelopment: async (
    id: string,
    arcId: string,
    body: {
      title: string;
      description?: string;
      sessionId?: string;
      linkedEntityIds?: string[];
    },
  ): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/arcs/${arcId}/developments`, body);
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

  adjustTracker: async (
    id: string,
    trackerId: string,
    delta: number,
    options?: { reason?: string; sessionNumber?: number },
  ): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/trackers/${trackerId}/adjust`, {
      delta,
      ...(options?.reason !== undefined && { reason: options.reason }),
      ...(options?.sessionNumber !== undefined && { sessionNumber: options.sessionNumber }),
    });
    return data;
  },

  removeTracker: async (id: string, trackerId: string): Promise<void> => {
    await api.delete(`/campaigns/${id}/trackers/${trackerId}`);
  },

  // ── Calendar ──────────────────────────────────────────────

  initCalendar: async (id: string, preset: CalendarPresetType): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/calendar/init`, { preset });
    return data;
  },

  advanceDate: async (id: string, days: number): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/calendar/advance`, { days });
    return data;
  },

  setDate: async (id: string, date: { year: number; month: number; day: number }): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/calendar/date`, date);
    return data;
  },

  addCalendarEvent: async (
    id: string,
    body: {
      name: string;
      year: number;
      month: number;
      day: number;
      eventType?: 'session' | 'travel' | 'downtime' | 'deadline' | 'faction' | 'festival' | 'reminder';
      status?: 'upcoming' | 'ongoing' | 'completed';
      recurring?: boolean;
      durationDays?: number;
      entityId?: string;
      sessionId?: string;
      notes?: string;
    },
  ): Promise<Campaign> => {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/calendar/events`, body);
    return data;
  },

  updateCalendarEvent: async (
    id: string,
    eventId: string,
    body: {
      name?: string;
      year?: number;
      month?: number;
      day?: number;
      eventType?: 'session' | 'travel' | 'downtime' | 'deadline' | 'faction' | 'festival' | 'reminder';
      status?: 'upcoming' | 'ongoing' | 'completed';
      recurring?: boolean;
      durationDays?: number;
      entityId?: string;
      sessionId?: string;
      notes?: string;
    },
  ): Promise<Campaign> => {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}/calendar/events/${eventId}`, body);
    return data;
  },

  removeCalendarEvent: async (id: string, eventId: string): Promise<void> => {
    await api.delete(`/campaigns/${id}/calendar/events/${eventId}`);
  },
};
