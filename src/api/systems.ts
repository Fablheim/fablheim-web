import { api } from './client';
import type { SystemDefinition, SystemSummary } from '@/types/system';

export const systemsApi = {
  list: async (): Promise<SystemSummary[]> => {
    const { data } = await api.get<SystemSummary[]>('/systems');
    return data;
  },

  get: async (id: string): Promise<SystemDefinition> => {
    const { data } = await api.get<SystemDefinition>(`/systems/${id}`);
    return data;
  },
};
