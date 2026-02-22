import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { charactersApi } from '@/api/characters';
import type { CreateCharacterPayload, UpdateCharacterPayload } from '@/types/campaign';

export function useCharacters(campaignId: string) {
  return useQuery({
    queryKey: ['characters', campaignId],
    queryFn: () => charactersApi.list(campaignId),
    enabled: !!campaignId,
  });
}

/** Fetch all characters owned by the current user across all campaigns */
export function useMyCharacters() {
  return useQuery({
    queryKey: ['characters', 'mine'],
    queryFn: () => charactersApi.listMine(),
  });
}


export function useCharacter(id: string) {
  return useQuery({
    queryKey: ['characters', 'detail', id],
    queryFn: () => charactersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCharacterPayload) => charactersApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.campaignId] });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; campaignId: string; data: UpdateCharacterPayload }) =>
      charactersApi.update(variables.id, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['characters', 'detail', variables.id] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; campaignId: string }) =>
      charactersApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.campaignId] });
    },
  });
}
