import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notebookApi } from '@/api/notebook';
import type { CreateNotePayload, UpdateNotePayload, NoteCategory } from '@/types/notebook';

export function useNotebook(
  campaignId: string,
  params?: { category?: NoteCategory; tag?: string; page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['notebook', campaignId, params],
    queryFn: () => notebookApi.list(campaignId, params),
    enabled: !!campaignId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNotePayload) => notebookApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', data.campaignId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      noteId,
      payload,
    }: {
      campaignId: string;
      noteId: string;
      payload: UpdateNotePayload;
    }) => notebookApi.update(campaignId, noteId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', variables.campaignId] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, noteId }: { campaignId: string; noteId: string }) =>
      notebookApi.delete(campaignId, noteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', variables.campaignId] });
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, noteId }: { campaignId: string; noteId: string }) =>
      notebookApi.togglePin(campaignId, noteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', data.campaignId] });
    },
  });
}
