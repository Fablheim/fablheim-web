import { api } from './client';
import type {
  Encounter,
  CreateEncounterRequest,
  UpdateEncounterRequest,
  AddEncounterTokenRequest,
  UpdateEncounterTokenRequest,
  SaveAIEncounterRequest,
  LoadEncounterRequest,
  LoadEncounterResult,
} from '@/types/encounter';

export const encountersApi = {
  // ── CRUD ──────────────────────────────────────────────────

  list: async (campaignId: string): Promise<Encounter[]> => {
    const { data } = await api.get<Encounter[]>(
      `/campaigns/${campaignId}/encounters`,
    );
    return data;
  },

  get: async (campaignId: string, encounterId: string): Promise<Encounter> => {
    const { data } = await api.get<Encounter>(
      `/campaigns/${campaignId}/encounters/${encounterId}`,
    );
    return data;
  },

  create: async (
    campaignId: string,
    body: CreateEncounterRequest,
  ): Promise<Encounter> => {
    const { data } = await api.post<Encounter>(
      `/campaigns/${campaignId}/encounters`,
      body,
    );
    return data;
  },

  update: async (
    campaignId: string,
    encounterId: string,
    body: UpdateEncounterRequest,
  ): Promise<Encounter> => {
    const { data } = await api.patch<Encounter>(
      `/campaigns/${campaignId}/encounters/${encounterId}`,
      body,
    );
    return data;
  },

  remove: async (campaignId: string, encounterId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/encounters/${encounterId}`);
  },

  // ── Tokens ────────────────────────────────────────────────

  addToken: async (
    campaignId: string,
    encounterId: string,
    body: AddEncounterTokenRequest,
  ): Promise<Encounter> => {
    const { data } = await api.post<Encounter>(
      `/campaigns/${campaignId}/encounters/${encounterId}/tokens`,
      body,
    );
    return data;
  },

  updateToken: async (
    campaignId: string,
    encounterId: string,
    tokenId: string,
    body: UpdateEncounterTokenRequest,
  ): Promise<Encounter> => {
    const { data } = await api.patch<Encounter>(
      `/campaigns/${campaignId}/encounters/${encounterId}/tokens/${tokenId}`,
      body,
    );
    return data;
  },

  removeToken: async (
    campaignId: string,
    encounterId: string,
    tokenId: string,
  ): Promise<Encounter> => {
    const { data } = await api.delete<Encounter>(
      `/campaigns/${campaignId}/encounters/${encounterId}/tokens/${tokenId}`,
    );
    return data;
  },

  // ── AI + Load ─────────────────────────────────────────────

  saveFromAI: async (
    campaignId: string,
    body: SaveAIEncounterRequest,
  ): Promise<Encounter> => {
    const { data } = await api.post<Encounter>(
      `/campaigns/${campaignId}/encounters/from-ai`,
      body,
    );
    return data;
  },

  load: async (
    campaignId: string,
    encounterId: string,
    body: LoadEncounterRequest,
  ): Promise<LoadEncounterResult> => {
    const { data } = await api.post<LoadEncounterResult>(
      `/campaigns/${campaignId}/encounters/${encounterId}/load`,
      body,
    );
    return data;
  },
};
