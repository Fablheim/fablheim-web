export type CampaignSystem = 'dnd5e' | 'pathfinder2e' | 'daggerheart' | 'call-of-cthulhu' | 'fate' | 'custom';
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'archived';

export const systemLabels: Record<CampaignSystem, string> = {
  'dnd5e': 'D&D 5e',
  'pathfinder2e': 'Pathfinder 2e',
  'daggerheart': 'Daggerheart',
  'call-of-cthulhu': 'Call of Cthulhu',
  'fate': 'Fate',
  'custom': 'Custom',
};

export const statusLabels: Record<CampaignStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

export interface Campaign {
  _id: string;
  name: string;
  description: string;
  dmId: string;
  setting: string;
  system: CampaignSystem;
  status: CampaignStatus;
  inviteCode?: string;
  inviteEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  setting?: string;
  system?: CampaignSystem;
  status?: CampaignStatus;
}

export type UpdateCampaignPayload = Partial<CreateCampaignPayload>;

export interface Character {
  _id: string;
  campaignId: string;
  userId: string;
  name: string;
  race?: string;
  class?: string;
  level: number;
  backstory?: string;
  stats?: Record<string, number>;
  passiveScores: {
    perception: number;
    insight: number;
    investigation: number;
  };
  mechanicData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterPayload {
  campaignId: string;
  name: string;
  race?: string;
  class?: string;
  level?: number;
  backstory?: string;
  stats?: Record<string, number>;
  passiveScores?: {
    perception: number;
    insight: number;
    investigation: number;
  };
}

export type UpdateCharacterPayload = Partial<Omit<CreateCharacterPayload, 'campaignId'>> & {
  mechanicData?: Record<string, any>;
};

// ── World Entities (NPCs) ────────────────────────────────

export type WorldEntityType = 'location' | 'location_detail' | 'faction' | 'npc' | 'npc_minor' | 'item' | 'quest' | 'event' | 'lore';
export type WorldEntityVisibility = 'public' | 'dm-only';

export interface WorldEntity {
  _id: string;
  campaignId: string;
  name: string;
  type: WorldEntityType;
  description?: string;
  tags: string[];
  relatedEntities: Array<{ entityId: string; relationshipType: string }>;
  visibility: WorldEntityVisibility;
  typeData: Record<string, any>;
  aiGenerated: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorldEntityPayload {
  name: string;
  type: WorldEntityType;
  description?: string;
  tags?: string[];
  relatedEntities?: Array<{ entityId: string; relationshipType: string }>;
  visibility?: WorldEntityVisibility;
  typeData?: Record<string, any>;
}

export type UpdateWorldEntityPayload = Partial<CreateWorldEntityPayload>;

// ── Sessions ─────────────────────────────────────────────

export interface Session {
  _id: string;
  campaignId: string;
  sessionNumber: number;
  title?: string;
  summary?: string;
  notes?: string;
  scheduledDate?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  campaignId: string;
  sessionNumber: number;
  title?: string;
  summary?: string;
  notes?: string;
  scheduledDate?: string;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface UpdateSessionRequest {
  title?: string;
  summary?: string;
  notes?: string;
  scheduledDate?: string;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}
