import { api } from './client';

export interface ModuleSummary {
  id: string;
  name: string;
  category: string;
  description: string;
  exclusive: string | null;
  requires: string[];
  conflicts: string[];
  systems: string[];
  official: boolean;
}

export interface PresetSummary {
  id: string;
  name: string;
  modules: string[];
  locked: string[];
  recommended: string[];
}

export const rulesEngineApi = {
  getModules: async (): Promise<ModuleSummary[]> => {
    const { data } = await api.get<ModuleSummary[]>('/rules-engine/modules');
    return data;
  },

  getPresets: async (): Promise<PresetSummary[]> => {
    const { data } = await api.get<PresetSummary[]>('/rules-engine/presets');
    return data;
  },

  getExclusivityGroups: async (): Promise<Record<string, string[]>> => {
    const { data } = await api.get<Record<string, string[]>>('/rules-engine/exclusivity-groups');
    return data;
  },
};
