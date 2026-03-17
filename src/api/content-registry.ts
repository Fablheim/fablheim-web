import { api } from './client';
import type {
  ContentEntry,
  CreateContentEntryPayload,
  UpdateContentEntryPayload,
} from '@/types/content-entry';

export interface ContentSearchQuery {
  q?: string;
  contentType?: string;
  sourceType?: string;
  system?: string;
  campaignId?: string;
  limit?: number;
}

export const contentRegistryApi = {
  search: async (query: ContentSearchQuery): Promise<ContentEntry[]> => {
    const { data } = await api.get<ContentEntry[]>('/content', { params: query });
    return data;
  },

  findById: async (id: string): Promise<ContentEntry> => {
    const { data } = await api.get<ContentEntry>(`/content/${id}`);
    return data;
  },

  findByCampaign: async (campaignId: string, type?: string): Promise<ContentEntry[]> => {
    const params = type ? { type } : undefined;
    const { data } = await api.get<ContentEntry[]>(`/content/campaign/${campaignId}`, { params });
    return data;
  },

  create: async (campaignId: string, body: CreateContentEntryPayload): Promise<ContentEntry> => {
    const { data } = await api.post<ContentEntry>(`/content/campaign/${campaignId}`, body);
    return data;
  },

  update: async (id: string, body: UpdateContentEntryPayload): Promise<ContentEntry> => {
    const { data } = await api.patch<ContentEntry>(`/content/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/content/${id}`);
  },
};
