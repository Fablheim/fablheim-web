import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '@/api/shops';
import type {
  CreateShopPayload,
  UpdateShopPayload,
  AddShopItemPayload,
} from '@/types/shop';

export function useShops(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'shops'],
    queryFn: () => shopsApi.list(campaignId),
    enabled: !!campaignId,
  });
}

export function useCreateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateShopPayload }) =>
      shopsApi.create(campaignId, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'shops'] });
    },
  });
}

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      shopId,
      data,
    }: {
      campaignId: string;
      shopId: string;
      data: UpdateShopPayload;
    }) => shopsApi.update(campaignId, shopId, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'shops'] });
    },
  });
}

export function useDeleteShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, shopId }: { campaignId: string; shopId: string }) =>
      shopsApi.remove(campaignId, shopId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'shops'] });
    },
  });
}

export function useAddShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      shopId,
      data,
    }: {
      campaignId: string;
      shopId: string;
      data: AddShopItemPayload;
    }) => shopsApi.addItem(campaignId, shopId, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'shops'] });
    },
  });
}

export function useRemoveShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      shopId,
      itemId,
    }: {
      campaignId: string;
      shopId: string;
      itemId: string;
    }) => shopsApi.removeItem(campaignId, shopId, itemId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'shops'] });
    },
  });
}

export function useRestockShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, shopId }: { campaignId: string; shopId: string }) =>
      shopsApi.restock(campaignId, shopId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'shops'] });
    },
  });
}
