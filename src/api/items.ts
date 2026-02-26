import { api } from './client';
import type {
  Item,
  CharacterCurrency,
  CreateItemPayload,
  UpdateItemPayload,
  UpdateCurrencyPayload,
} from '@/types/item';

export const itemsApi = {
  list: async (characterId: string): Promise<Item[]> => {
    const { data } = await api.get<Item[]>('/items', {
      params: { characterId },
    });
    return data;
  },

  get: async (id: string): Promise<Item> => {
    const { data } = await api.get<Item>(`/items/${id}`);
    return data;
  },

  create: async (body: CreateItemPayload): Promise<Item> => {
    const { data } = await api.post<Item>('/items', body);
    return data;
  },

  update: async (id: string, body: UpdateItemPayload): Promise<Item> => {
    const { data } = await api.patch<Item>(`/items/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/items/${id}`);
  },

  equip: async (id: string, slot: string): Promise<Item> => {
    const { data } = await api.post<Item>(`/items/${id}/equip`, { slot });
    return data;
  },

  unequip: async (id: string): Promise<Item> => {
    const { data } = await api.post<Item>(`/items/${id}/unequip`);
    return data;
  },

  toggleAttunement: async (id: string): Promise<Item> => {
    const { data } = await api.post<Item>(`/items/${id}/toggle-attunement`);
    return data;
  },

  getCurrency: async (characterId: string): Promise<CharacterCurrency> => {
    const { data } = await api.get<CharacterCurrency>(
      `/items/currency/${characterId}`,
    );
    return data;
  },

  updateCurrency: async (
    characterId: string,
    body: UpdateCurrencyPayload,
  ): Promise<CharacterCurrency> => {
    const { data } = await api.patch<CharacterCurrency>(
      `/items/currency/${characterId}`,
      body,
    );
    return data;
  },
};
