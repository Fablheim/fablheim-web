import { api } from './client';
import type {
  CreatureTemplate,
  CreateCreatureTemplateRequest,
  UpdateCreatureTemplateRequest,
  SpawnCreaturesRequest,
  SpawnedCreature,
} from '@/types/creature-template';

export const creatureTemplatesApi = {
  list: async (filters?: {
    category?: string;
    tags?: string[];
    scope?: string;
  }): Promise<CreatureTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.scope) params.append('scope', filters.scope);
    const qs = params.toString();
    const { data } = await api.get<CreatureTemplate[]>(
      `/creature-templates${qs ? `?${qs}` : ''}`,
    );
    return data;
  },

  get: async (id: string): Promise<CreatureTemplate> => {
    const { data } = await api.get<CreatureTemplate>(`/creature-templates/${id}`);
    return data;
  },

  create: async (
    body: CreateCreatureTemplateRequest,
  ): Promise<CreatureTemplate> => {
    const { data } = await api.post<CreatureTemplate>('/creature-templates', body);
    return data;
  },

  update: async (
    id: string,
    body: UpdateCreatureTemplateRequest,
  ): Promise<CreatureTemplate> => {
    const { data } = await api.patch<CreatureTemplate>(
      `/creature-templates/${id}`,
      body,
    );
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/creature-templates/${id}`);
  },

  spawn: async (
    id: string,
    body: SpawnCreaturesRequest,
  ): Promise<SpawnedCreature[]> => {
    const { data } = await api.post<SpawnedCreature[]>(
      `/creature-templates/${id}/spawn`,
      body,
    );
    return data;
  },
};

// Backward-compat alias
export const enemyTemplatesApi = creatureTemplatesApi;
