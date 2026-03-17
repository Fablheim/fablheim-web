import { api } from './client';
import type { Ability, AbilityQuery, CharacterAbility } from '@/types/ability';

export const abilitiesApi = {
  list: async (query?: AbilityQuery) => {
    const params: Record<string, string> = {};
    if (query?.system) params.system = query.system;
    if (query?.type) params.type = query.type;
    if (query?.usageContext) params.usageContext = query.usageContext;
    if (query?.visibility) params.visibility = query.visibility;
    if (query?.campaignId) params.campaignId = query.campaignId;
    if (query?.search) params.search = query.search;
    if (query?.spellLevel !== undefined) params.spellLevel = String(query.spellLevel);
    if (query?.spellSchool) params.spellSchool = query.spellSchool;
    if (query?.classes?.length) params.classes = query.classes.join(',');
    if (query?.tags?.length) params.tags = query.tags.join(',');
    if (query?.page) params.page = String(query.page);
    if (query?.limit) params.limit = String(query.limit);

    const res = await api.get<{ items: Ability[]; total: number }>(
      '/abilities',
      { params },
    );
    return res.data;
  },

  get: async (id: string) => {
    const res = await api.get<Ability>(`/abilities/${id}`);
    return res.data;
  },

  create: async (dto: Partial<Ability>) => {
    const res = await api.post<Ability>('/abilities', dto);
    return res.data;
  },

  update: async (id: string, dto: Partial<Ability>) => {
    const res = await api.patch<Ability>(`/abilities/${id}`, dto);
    return res.data;
  },

  remove: async (id: string) => {
    await api.delete(`/abilities/${id}`);
  },
};

export const characterAbilitiesApi = {
  list: async (characterId: string, query?: { type?: string; prepared?: boolean; source?: string }) => {
    const res = await api.get<CharacterAbility[]>(
      `/characters/${characterId}/abilities`,
      { params: query },
    );
    return res.data;
  },

  get: async (characterId: string, abilityId: string) => {
    const res = await api.get<CharacterAbility>(
      `/characters/${characterId}/abilities/${abilityId}`,
    );
    return res.data;
  },

  grant: async (characterId: string, dto: {
    abilityId: string;
    acquisitionType?: string;
    source?: string;
    sourceId?: string;
    notes?: string;
  }) => {
    const res = await api.post<CharacterAbility>(
      `/characters/${characterId}/abilities`,
      dto,
    );
    return res.data;
  },

  updateState: async (characterId: string, abilityId: string, dto: {
    prepared?: boolean;
    equipped?: boolean;
    known?: boolean;
    usesRemaining?: number | null;
    notes?: string;
  }) => {
    const res = await api.patch<CharacterAbility>(
      `/characters/${characterId}/abilities/${abilityId}`,
      dto,
    );
    return res.data;
  },

  revoke: async (characterId: string, abilityId: string) => {
    await api.delete(`/characters/${characterId}/abilities/${abilityId}`);
  },
};
