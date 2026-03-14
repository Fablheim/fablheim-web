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
  tags: string[];
  defaultConfig: Record<string, unknown>;
  configSchema: Array<{
    key: string;
    label: string;
    type: 'number' | 'text' | 'toggle' | 'select' | 'string-array';
    default: unknown;
    description?: string;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    condition?: string;
  }>;
  hooks: Record<string, string>;
  components: Record<string, string>;
  characterFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'toggle' | 'select' | 'string-array';
    defaultValue: unknown;
    group?: string;
    min?: number;
    max?: number;
    options?: string[];
  }>;
  initiativeFields: Record<string, { type: string; default?: unknown; description?: string }>;
  campaignFields: Record<string, { type: string; default?: unknown; description?: string }>;
  sessionFields: Record<string, { type: string; default?: unknown; description?: string }>;
}

export interface PresetSummary {
  id: string;
  name: string;
  modules: string[];
  config: Record<string, Record<string, unknown>>;
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
