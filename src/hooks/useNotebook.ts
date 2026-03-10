import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notebookApi } from '@/api/notebook';
import type {
  CreateNotePayload,
  UpdateNotePayload,
  NoteCategory,
  CreateFolderPayload,
  UpdateFolderPayload,
} from '@/types/notebook';

// -- Notes --

export function useNotebook(
  campaignId: string,
  params?: {
    category?: NoteCategory;
    tag?: string;
    folderId?: string;
    page?: number;
    limit?: number;
  },
) {
  return useQuery({
    queryKey: ['notebook', campaignId, params],
    queryFn: () => notebookApi.list(campaignId, params),
    enabled: !!campaignId,
  });
}

export function useNoteWithLinks(campaignId: string, noteId: string) {
  return useQuery({
    queryKey: ['notebook', campaignId, noteId, 'links'],
    queryFn: () => notebookApi.getWithLinks(campaignId, noteId),
    enabled: !!campaignId && !!noteId,
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

// -- Sharing --

export function useSharedNotes(campaignId: string) {
  return useQuery({
    queryKey: ['notebook', campaignId, 'shared'],
    queryFn: () => notebookApi.listShared(campaignId),
    enabled: !!campaignId,
  });
}

export function useShareNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, noteId }: { campaignId: string; noteId: string }) =>
      notebookApi.shareNote(campaignId, noteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', data.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['notebook', data.campaignId, 'shared'] });
    },
  });
}

export function useUnshareNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, noteId }: { campaignId: string; noteId: string }) =>
      notebookApi.unshareNote(campaignId, noteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', data.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['notebook', data.campaignId, 'shared'] });
    },
  });
}

// -- Session Pins --

export function usePinnedNotes(campaignId: string, sessionId: string) {
  return useQuery({
    queryKey: ['notebook', campaignId, 'pinned', sessionId],
    queryFn: () => notebookApi.listPinnedToSession(campaignId, sessionId),
    enabled: !!campaignId && !!sessionId,
  });
}

export function usePinToSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      noteId,
      sessionId,
    }: {
      campaignId: string;
      noteId: string;
      sessionId: string;
    }) => notebookApi.pinToSession(campaignId, noteId, sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', data.campaignId] });
    },
  });
}

export function useUnpinFromSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      noteId,
    }: {
      campaignId: string;
      noteId: string;
    }) => notebookApi.unpinFromSession(campaignId, noteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', variables.campaignId] });
    },
  });
}

// -- Link Search --

export function useLinkSearch(
  campaignId: string,
  query: string,
  entityType?: string,
) {
  return useQuery({
    queryKey: ['notebook', campaignId, 'linkSearch', query, entityType],
    queryFn: () => notebookApi.searchLinks(campaignId, query, entityType),
    enabled: !!campaignId && query.length >= 2,
  });
}

// -- Folders --

export function useNotebookFolders(campaignId: string) {
  return useQuery({
    queryKey: ['notebook', campaignId, 'folders'],
    queryFn: () => notebookApi.listFolders(campaignId),
    enabled: !!campaignId,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      payload,
    }: {
      campaignId: string;
      payload: CreateFolderPayload;
    }) => notebookApi.createFolder(campaignId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['notebook', data.campaignId, 'folders'],
      });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      folderId,
      payload,
    }: {
      campaignId: string;
      folderId: string;
      payload: UpdateFolderPayload;
    }) => notebookApi.updateFolder(campaignId, folderId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['notebook', data.campaignId, 'folders'],
      });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      folderId,
    }: {
      campaignId: string;
      folderId: string;
    }) => notebookApi.deleteFolder(campaignId, folderId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['notebook', variables.campaignId, 'folders'],
      });
      // Also invalidate notes since some may have moved to root
      queryClient.invalidateQueries({
        queryKey: ['notebook', variables.campaignId],
      });
    },
  });
}
