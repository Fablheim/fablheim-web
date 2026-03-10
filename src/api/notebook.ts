import { api } from './client';
import type {
  NotebookEntry,
  NotebookListResponse,
  CreateNotePayload,
  UpdateNotePayload,
  NoteCategory,
  NotebookFolder,
  CreateFolderPayload,
  UpdateFolderPayload,
  PopulatedNoteLink,
  LinkSearchResult,
} from '@/types/notebook';

export const notebookApi = {
  list: async (
    campaignId: string,
    params?: {
      category?: NoteCategory;
      tag?: string;
      folderId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<NotebookListResponse> => {
    const { data } = await api.get<NotebookListResponse>(
      `/campaigns/${campaignId}/notebook`,
      { params },
    );
    return data;
  },

  get: async (campaignId: string, noteId: string): Promise<NotebookEntry> => {
    const { data } = await api.get<NotebookEntry>(
      `/campaigns/${campaignId}/notebook/${noteId}`,
    );
    return data;
  },

  getWithLinks: async (
    campaignId: string,
    noteId: string,
  ): Promise<{ note: NotebookEntry; populatedLinks: PopulatedNoteLink[] }> => {
    const { data } = await api.get<{
      note: NotebookEntry;
      populatedLinks: PopulatedNoteLink[];
    }>(`/campaigns/${campaignId}/notebook/${noteId}/links`);
    return data;
  },

  create: async (payload: CreateNotePayload): Promise<NotebookEntry> => {
    const { campaignId, ...body } = payload;
    const { data } = await api.post<NotebookEntry>(
      `/campaigns/${campaignId}/notebook`,
      body,
    );
    return data;
  },

  update: async (
    campaignId: string,
    noteId: string,
    payload: UpdateNotePayload,
  ): Promise<NotebookEntry> => {
    const { data } = await api.patch<NotebookEntry>(
      `/campaigns/${campaignId}/notebook/${noteId}`,
      payload,
    );
    return data;
  },

  delete: async (campaignId: string, noteId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/notebook/${noteId}`);
  },

  togglePin: async (campaignId: string, noteId: string): Promise<NotebookEntry> => {
    const { data } = await api.patch<NotebookEntry>(
      `/campaigns/${campaignId}/notebook/${noteId}/pin`,
    );
    return data;
  },

  // -- Session Pins --

  pinToSession: async (
    campaignId: string,
    noteId: string,
    sessionId: string,
  ): Promise<NotebookEntry> => {
    const { data } = await api.post<NotebookEntry>(
      `/campaigns/${campaignId}/notebook/${noteId}/pin-to-session`,
      { sessionId },
    );
    return data;
  },

  unpinFromSession: async (
    campaignId: string,
    noteId: string,
  ): Promise<void> => {
    await api.delete(
      `/campaigns/${campaignId}/notebook/${noteId}/pin-to-session`,
    );
  },

  listPinnedToSession: async (
    campaignId: string,
    sessionId: string,
  ): Promise<NotebookEntry[]> => {
    const { data } = await api.get<NotebookEntry[]>(
      `/campaigns/${campaignId}/notebook/pinned`,
      { params: { sessionId } },
    );
    return data;
  },

  // -- Link Search --

  searchLinks: async (
    campaignId: string,
    query: string,
    entityType?: string,
  ): Promise<LinkSearchResult[]> => {
    const { data } = await api.get<LinkSearchResult[]>(
      `/campaigns/${campaignId}/notebook/search/links`,
      { params: { q: query, entityType } },
    );
    return data;
  },

  // -- Sharing --

  listShared: async (campaignId: string): Promise<NotebookEntry[]> => {
    const { data } = await api.get<NotebookEntry[]>(
      `/campaigns/${campaignId}/notebook/shared`,
    );
    return data;
  },

  shareNote: async (campaignId: string, noteId: string): Promise<NotebookEntry> => {
    const { data } = await api.patch<NotebookEntry>(
      `/campaigns/${campaignId}/notebook/${noteId}/share`,
    );
    return data;
  },

  unshareNote: async (campaignId: string, noteId: string): Promise<NotebookEntry> => {
    const { data } = await api.patch<NotebookEntry>(
      `/campaigns/${campaignId}/notebook/${noteId}/unshare`,
    );
    return data;
  },

  // -- Folders --

  listFolders: async (campaignId: string): Promise<NotebookFolder[]> => {
    const { data } = await api.get<NotebookFolder[]>(
      `/campaigns/${campaignId}/notebook/folders`,
    );
    return data;
  },

  createFolder: async (
    campaignId: string,
    payload: CreateFolderPayload,
  ): Promise<NotebookFolder> => {
    const { data } = await api.post<NotebookFolder>(
      `/campaigns/${campaignId}/notebook/folders`,
      payload,
    );
    return data;
  },

  updateFolder: async (
    campaignId: string,
    folderId: string,
    payload: UpdateFolderPayload,
  ): Promise<NotebookFolder> => {
    const { data } = await api.patch<NotebookFolder>(
      `/campaigns/${campaignId}/notebook/folders/${folderId}`,
      payload,
    );
    return data;
  },

  deleteFolder: async (campaignId: string, folderId: string): Promise<void> => {
    await api.delete(
      `/campaigns/${campaignId}/notebook/folders/${folderId}`,
    );
  },
};
