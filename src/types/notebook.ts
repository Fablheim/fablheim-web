export type NoteCategory =
  | 'session_notes'
  | 'plot_threads'
  | 'world_lore'
  | 'npc_notes'
  | 'player_tracking'
  | 'general';

export const categoryLabels: Record<NoteCategory, string> = {
  session_notes: 'Session Notes',
  plot_threads: 'Plot Threads',
  world_lore: 'World Lore',
  npc_notes: 'NPC Notes',
  player_tracking: 'Player Tracking',
  general: 'General',
};

export interface NotebookEntry {
  _id: string;
  campaignId: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  sessionNumber?: number;
  isPinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  campaignId: string;
  title: string;
  content?: string;
  category?: NoteCategory;
  tags?: string[];
  sessionNumber?: number;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  category?: NoteCategory;
  tags?: string[];
  sessionNumber?: number;
}

export interface NotebookListResponse {
  notes: NotebookEntry[];
  total: number;
}
