import { api } from './client';
import type { ItemTemplate, ItemTemplateQuery } from '@/types/item-template';

export const itemTemplatesApi = {
  list: async (query?: ItemTemplateQuery) => {
    const res = await api.get<{ items: ItemTemplate[]; total: number }>(
      '/item-templates',
      { params: query },
    );
    return res.data;
  },

  get: async (id: string) => {
    const res = await api.get<ItemTemplate>(`/item-templates/${id}`);
    return res.data;
  },

  create: async (dto: Partial<ItemTemplate>) => {
    const res = await api.post<ItemTemplate>('/item-templates', dto);
    return res.data;
  },

  update: async (id: string, dto: Partial<ItemTemplate>) => {
    const res = await api.patch<ItemTemplate>(`/item-templates/${id}`, dto);
    return res.data;
  },
};
