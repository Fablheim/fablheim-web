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

export type NoteLinkEntityType = 'world_entity' | 'encounter' | 'session';

export interface NoteLink {
  entityType: NoteLinkEntityType;
  entityId: string;
  label?: string;
}

export interface PopulatedNoteLink extends NoteLink {
  name: string;
  subType?: string;
}

export interface NotebookEntry {
  _id: string;
  campaignId: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  sessionNumber?: number;
  isPinned: boolean;
  parentNoteId?: string;
  folderId?: string;
  links: NoteLink[];
  pinnedToSession?: string;
  createdBy: string;
  visibleTo?: 'dm_only' | 'all';
  sharedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotebookFolder {
  _id: string;
  campaignId: string;
  name: string;
  parentFolderId?: string;
  sortOrder: number;
  color?: string;
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
  parentNoteId?: string;
  folderId?: string;
  links?: NoteLink[];
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  category?: NoteCategory;
  tags?: string[];
  sessionNumber?: number;
  folderId?: string | null;
  links?: NoteLink[];
  isPinned?: boolean;
}

export interface NotebookListResponse {
  notes: NotebookEntry[];
  total: number;
}

export interface CreateFolderPayload {
  name: string;
  parentFolderId?: string;
  sortOrder?: number;
  color?: string;
}

export interface UpdateFolderPayload {
  name?: string;
  sortOrder?: number;
  color?: string;
}

export interface LinkSearchResult {
  entityType: NoteLinkEntityType;
  entityId: string;
  name: string;
  subType?: string;
}
