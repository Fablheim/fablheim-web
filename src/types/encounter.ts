import type { MapToken } from './live-session';

// ── Encounter NPC ────────────────────────────────────────────

export interface EncounterNPC {
  name: string;
  count: number;
  cr: number;
  hp: number;
  ac: number;
  initiativeBonus: number;
  statBlock: string;
  tactics?: string;
}

// ── Encounter ────────────────────────────────────────────────

export type EncounterStatus = 'draft' | 'ready' | 'used';
export type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'deadly';

export interface Encounter {
  _id: string;
  campaignId: string;
  name: string;
  description: string;
  difficulty: EncounterDifficulty;
  estimatedXP: number;

  // Map config
  gridWidth: number;
  gridHeight: number;
  gridSquareSizeFt: number;
  backgroundImageUrl?: string;
  tokens: MapToken[];

  // AI-generated content
  npcs: EncounterNPC[];
  tactics?: string;
  terrain?: string;
  treasure?: string;
  hooks: string[];

  // Organization
  notes: string;
  tags: string[];
  status: EncounterStatus;

  createdAt: string;
  updatedAt: string;
}

// ── Requests ─────────────────────────────────────────────────

export interface CreateEncounterRequest {
  name: string;
  description?: string;
  difficulty?: EncounterDifficulty;
  estimatedXP?: number;
  gridWidth?: number;
  gridHeight?: number;
  gridSquareSizeFt?: number;
  backgroundImageUrl?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateEncounterRequest {
  name?: string;
  description?: string;
  difficulty?: EncounterDifficulty;
  estimatedXP?: number;
  gridWidth?: number;
  gridHeight?: number;
  gridSquareSizeFt?: number;
  backgroundImageUrl?: string;
  notes?: string;
  tags?: string[];
  status?: EncounterStatus;
  tactics?: string;
  terrain?: string;
  treasure?: string;
  hooks?: string[];
  npcs?: EncounterNPC[];
}

export interface AddEncounterTokenRequest {
  name: string;
  type: 'pc' | 'npc' | 'monster' | 'other';
  x: number;
  y: number;
  size?: number;
  color?: string;
  isHidden?: boolean;
}

export interface UpdateEncounterTokenRequest {
  name?: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  isHidden?: boolean;
}

export interface SaveAIEncounterRequest {
  name: string;
  description?: string;
  difficulty?: EncounterDifficulty;
  estimatedXP?: number;
  npcs?: EncounterNPC[];
  tactics?: string;
  terrain?: string;
  treasure?: string;
  hooks?: string[];
}

export interface LoadEncounterRequest {
  addToInitiative?: boolean;
  clearExistingMap?: boolean;
}

export interface LoadEncounterResult {
  map: Record<string, unknown>;
  initiative?: Record<string, unknown>;
}
