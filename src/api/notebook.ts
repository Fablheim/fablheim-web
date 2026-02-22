import { api } from './client';
import type {
  NotebookEntry,
  NotebookListResponse,
  CreateNotePayload,
  UpdateNotePayload,
  NoteCategory,
} from '@/types/notebook';

export const notebookApi = {
  list: async (
    campaignId: string,
    params?: { category?: NoteCategory; tag?: string; page?: number; limit?: number },
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
};
