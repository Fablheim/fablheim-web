import { api } from './client';
import type { Layout, CreateLayoutPayload, UpdateLayoutPayload } from '@/types/layout';

export const layoutsApi = {
  create: (payload: CreateLayoutPayload) =>
    api.post<Layout>('/layouts', payload).then((r) => r.data),

  getAll: (campaignId?: string) =>
    api.get<Layout[]>('/layouts', {
      params: campaignId ? { campaignId } : undefined,
    }).then((r) => r.data),

  getDefault: () =>
    api.get<Layout | null>('/layouts/default').then((r) => r.data),

  get: (id: string) =>
    api.get<Layout>(`/layouts/${id}`).then((r) => r.data),

  update: (id: string, payload: UpdateLayoutPayload) =>
    api.patch<Layout>(`/layouts/${id}`, payload).then((r) => r.data),

  load: (id: string) =>
    api.post<Layout>(`/layouts/${id}/load`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/layouts/${id}`),
};
