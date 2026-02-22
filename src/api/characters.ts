import { api } from './client';
import type {
  Character,
  CreateCharacterPayload,
  UpdateCharacterPayload,
} from '@/types/campaign';

export const charactersApi = {
  list: async (campaignId: string): Promise<Character[]> => {
    const { data } = await api.get<Character[]>('/characters', {
      params: { campaignId },
    });
    return data;
  },

  /** Get all characters owned by the current user across all campaigns */
  listMine: async (): Promise<Character[]> => {
    const { data } = await api.get<Character[]>('/characters');
    return data;
  },

  get: async (id: string): Promise<Character> => {
    const { data } = await api.get<Character>(`/characters/${id}`);
    return data;
  },

  create: async (body: CreateCharacterPayload): Promise<Character> => {
    const { data } = await api.post<Character>('/characters', body);
    return data;
  },

  update: async (id: string, body: UpdateCharacterPayload): Promise<Character> => {
    const { data } = await api.patch<Character>(`/characters/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/characters/${id}`);
  },
};
