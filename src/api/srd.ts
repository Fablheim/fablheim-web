import { api } from './client';

export interface SRDSystemMeta {
  id: string;
  name: string;
  categories: { name: string; count: number }[];
  totalEntries: number;
}

export interface SRDSearchResult {
  title: string;
  category: string;
  snippet: string;
  score: number;
  parentTitle?: string;
}

export const srdApi = {
  getSystems: async (): Promise<{ systems: SRDSystemMeta[] }> => {
    const { data } = await api.get('/srd/public/systems');
    return data;
  },

  getSystem: async (system: string): Promise<SRDSystemMeta> => {
    const { data } = await api.get(`/srd/public/${system}`);
    return data;
  },

  getCategoryEntries: async (
    system: string,
    category: string,
  ): Promise<{ system: string; category: string; entries: string[] }> => {
    const { data } = await api.get(
      `/srd/public/${system}/categories/${encodeURIComponent(category)}`,
    );
    return data;
  },

  getEntry: async (
    system: string,
    entryPath: string,
  ): Promise<{ system: string; path: string; content: string }> => {
    const { data } = await api.get(`/srd/public/${system}/entry`, {
      params: { path: entryPath },
    });
    return data;
  },

  search: async (
    system: string,
    query: string,
    limit?: number,
  ): Promise<{
    system: string;
    query: string;
    results: SRDSearchResult[];
    count: number;
  }> => {
    const { data } = await api.get(`/srd/public/${system}/search`, {
      params: { q: query, ...(limit ? { limit } : {}) },
    });
    return data;
  },
};
