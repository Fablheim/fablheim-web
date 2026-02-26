import { api } from './client';
import type {
  EnemyTemplate,
  CreateEnemyTemplateRequest,
  UpdateEnemyTemplateRequest,
  SpawnEnemiesRequest,
  SpawnedEnemy,
} from '@/types/enemy-template';

export const enemyTemplatesApi = {
  list: async (filters?: {
    category?: string;
    tags?: string[];
    scope?: string;
  }): Promise<EnemyTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.scope) params.append('scope', filters.scope);
    const qs = params.toString();
    const { data } = await api.get<EnemyTemplate[]>(
      `/enemy-templates${qs ? `?${qs}` : ''}`,
    );
    return data;
  },

  get: async (id: string): Promise<EnemyTemplate> => {
    const { data } = await api.get<EnemyTemplate>(`/enemy-templates/${id}`);
    return data;
  },

  create: async (
    body: CreateEnemyTemplateRequest,
  ): Promise<EnemyTemplate> => {
    const { data } = await api.post<EnemyTemplate>('/enemy-templates', body);
    return data;
  },

  update: async (
    id: string,
    body: UpdateEnemyTemplateRequest,
  ): Promise<EnemyTemplate> => {
    const { data } = await api.patch<EnemyTemplate>(
      `/enemy-templates/${id}`,
      body,
    );
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/enemy-templates/${id}`);
  },

  spawn: async (
    id: string,
    body: SpawnEnemiesRequest,
  ): Promise<SpawnedEnemy[]> => {
    const { data } = await api.post<SpawnedEnemy[]>(
      `/enemy-templates/${id}/spawn`,
      body,
    );
    return data;
  },
};
