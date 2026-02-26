import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '@/api/items';
import type {
  CreateItemPayload,
  UpdateItemPayload,
  UpdateCurrencyPayload,
} from '@/types/item';

export function useItems(characterId?: string) {
  return useQuery({
    queryKey: ['items', characterId],
    queryFn: () => itemsApi.list(characterId!),
    enabled: !!characterId,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemPayload) => itemsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['items', variables.characterId],
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: string;
      characterId: string;
      data: UpdateItemPayload;
    }) => itemsApi.update(variables.id, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['items', variables.characterId],
      });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; characterId: string }) =>
      itemsApi.delete(variables.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['items', variables.characterId],
      });
    },
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: string;
      characterId: string;
      slot: string;
    }) => itemsApi.equip(variables.id, variables.slot),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['items', variables.characterId],
      });
    },
  });
}

export function useUnequipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; characterId: string }) =>
      itemsApi.unequip(variables.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['items', variables.characterId],
      });
    },
  });
}

export function useToggleAttunement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; characterId: string }) =>
      itemsApi.toggleAttunement(variables.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['items', variables.characterId],
      });
    },
  });
}

export function useCurrency(characterId?: string) {
  return useQuery({
    queryKey: ['currency', characterId],
    queryFn: () => itemsApi.getCurrency(characterId!),
    enabled: !!characterId,
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      characterId: string;
      data: UpdateCurrencyPayload;
    }) => itemsApi.updateCurrency(variables.characterId, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['currency', variables.characterId],
      });
    },
  });
}
