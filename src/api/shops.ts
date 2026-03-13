import { api } from './client';
import type {
  Shop,
  CreateShopPayload,
  UpdateShopPayload,
  AddShopItemPayload,
} from '@/types/shop';

export const shopsApi = {
  list: (campaignId: string) =>
    api.get<Shop[]>(`/campaigns/${campaignId}/shops`).then((r) => r.data),

  get: (campaignId: string, shopId: string) =>
    api.get<Shop>(`/campaigns/${campaignId}/shops/${shopId}`).then((r) => r.data),

  create: (campaignId: string, data: CreateShopPayload) =>
    api.post<Shop>(`/campaigns/${campaignId}/shops`, data).then((r) => r.data),

  update: (campaignId: string, shopId: string, data: UpdateShopPayload) =>
    api.patch<Shop>(`/campaigns/${campaignId}/shops/${shopId}`, data).then((r) => r.data),

  remove: (campaignId: string, shopId: string) =>
    api.delete(`/campaigns/${campaignId}/shops/${shopId}`).then((r) => r.data),

  addItem: (campaignId: string, shopId: string, data: AddShopItemPayload) =>
    api.post<Shop>(`/campaigns/${campaignId}/shops/${shopId}/items`, data).then((r) => r.data),

  removeItem: (campaignId: string, shopId: string, itemId: string) =>
    api.delete(`/campaigns/${campaignId}/shops/${shopId}/items/${itemId}`).then((r) => r.data),

  restock: (campaignId: string, shopId: string) =>
    api.post<Shop>(`/campaigns/${campaignId}/shops/${shopId}/restock`).then((r) => r.data),
};
