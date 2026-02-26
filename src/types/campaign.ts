export type CampaignSystem = 'dnd5e' | 'pathfinder2e' | 'daggerheart' | 'fate' | 'custom';
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'archived';

export const systemLabels: Record<CampaignSystem, string> = {
  'dnd5e': 'D&D 5e',
  'pathfinder2e': 'Pathfinder 2e',
  'daggerheart': 'Daggerheart',
  'fate': 'Fate',
  'custom': 'Custom',
};

export const statusLabels: Record<CampaignStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

export type CampaignStage = 'prep' | 'live' | 'recap';

export interface Campaign {
  _id: string;
  name: string;
  description: string;
  dmId: string;
  setting: string;
  system: CampaignSystem;
  status: CampaignStatus;
  stage: CampaignStage;
  activeSessionId?: string;
  lastSessionDate?: string;
  inviteCode?: string;
  inviteEnabled: boolean;
  visibility?: string;
  maxPlayers?: number;
  levelingSystem?: string;
  startingLevel?: number;
  sessionFrequency?: string;
  worldMap?: {
    url: string;
    key: string;
    filename: string;
    width: number;
    height: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  setting?: string;
  system?: CampaignSystem;
  status?: CampaignStatus;
  visibility?: string;
  maxPlayers?: number;
  levelingSystem?: string;
  startingLevel?: number;
  sessionFrequency?: string;
}

export type UpdateCampaignPayload = Partial<CreateCampaignPayload>;

export interface CharacterAttack {
  id: string;
  name: string;
  attackBonus: number;
  damageBonus: number;
  damageDice: string;
  damageType: string;
  range?: string;
  description?: string;
}

export interface SpellSlotLevel {
  current: number;
  max: number;
}

export interface SpellSlots {
  level1?: SpellSlotLevel;
  level2?: SpellSlotLevel;
  level3?: SpellSlotLevel;
  level4?: SpellSlotLevel;
  level5?: SpellSlotLevel;
  level6?: SpellSlotLevel;
  level7?: SpellSlotLevel;
  level8?: SpellSlotLevel;
  level9?: SpellSlotLevel;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Character {
  _id: string;
  campaignId: string;
  userId: string;
  name: string;
  race?: string;
  class?: string;
  level: number;
  xp: number;
  backstory?: string;
  stats?: Record<string, number>;
  passiveScores: {
    perception: number;
    insight: number;
    investigation: number;
  };
  systemData?: Record<string, any>;
  mechanicData?: Record<string, any>;
  portrait?: {
    url: string;
    key: string;
    filename: string;
    width: number;
    height: number;
  };
  hp: { current: number; max: number; temp: number };
  ac: number;
  speed: number;
  initiativeBonus: number;
  attacks: CharacterAttack[];
  spellSlots: SpellSlots;
  conditions: string[];
  deathSaves: DeathSaves | null;
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
  systemData?: Record<string, any>;
}

export type UpdateCharacterPayload = Partial<Omit<CreateCharacterPayload, 'campaignId'>> & {
  mechanicData?: Record<string, any>;
  portrait?: {
    url: string;
    key: string;
    filename: string;
    width: number;
    height: number;
  };
};

// ── Roll Results ─────────────────────────────────────────

export interface AttackRollResult {
  attackRoll: number;
  attackTotal: number;
  isCritical: boolean;
  isCriticalFail: boolean;
  damageRolls: number[];
  damageTotal: number;
  attackName: string;
  damageType: string;
}

export interface AbilityRollResult {
  roll: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isCriticalFail: boolean;
  ability: string;
  type: 'check' | 'save';
}

// ── World Entities (NPCs) ────────────────────────────────

export type WorldEntityType = 'location' | 'location_detail' | 'faction' | 'npc' | 'npc_minor' | 'item' | 'quest' | 'event' | 'lore';
export type WorldEntityVisibility = 'public' | 'dm-only';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

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
  // Location hierarchy
  parentEntityId?: string | { _id: string; name: string; type: string };
  // Quest-specific
  questType?: string;
  questStatus?: string;
  objectives?: QuestObjective[];
  questGiver?: string | { _id: string; name: string };
  rewards?: string;
  prerequisiteQuests?: string[];
  nextQuests?: string[];
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
  parentEntityId?: string;
  questType?: string;
  questStatus?: string;
  objectives?: Array<{ id: string; description: string }>;
  questGiver?: string;
  rewards?: string;
  prerequisiteQuests?: string[];
  nextQuests?: string[];
}

export type UpdateWorldEntityPayload = Partial<CreateWorldEntityPayload>;

// ── Handouts ──────────────────────────────────────────────

export interface Handout {
  _id: string;
  campaignId: string;
  sessionId?: string;
  title: string;
  type: 'image' | 'text' | 'map';
  content: string;
  imageUrl?: string;
  visibleTo: 'all' | 'dm_only';
  sharedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Chat Messages ─────────────────────────────────────────

export type ChatMessageType =
  | 'ic'
  | 'ooc'
  | 'whisper'
  | 'system'
  | 'roll'
  | 'hp_change'
  | 'initiative'
  | 'condition';

export interface ChatMessage {
  _id: string;
  campaignId: string;
  userId?: string;
  username: string;
  message: string;
  type: ChatMessageType;
  recipientId?: string;
  recipientUsername?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Sessions ─────────────────────────────────────────────

export interface SessionStatistics {
  diceRolls: number;
  combatRounds: number;
  damageDealt: number;
  healingDone: number;
  spellsCast: number;
  criticalHits: number;
  criticalMisses: number;
  encountersCompleted: number;
  enemiesDefeated: number;
  questsAdvanced: string[];
  npcsIntroduced: string[];
  keyMoments: string[];
}

export interface Session {
  _id: string;
  campaignId: string;
  sessionNumber: number;
  title?: string;
  summary?: string;
  notes?: string;
  scheduledDate?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  durationMinutes: number;
  statistics: SessionStatistics;
  aiRecap?: string;
  aiRecapGeneratedAt?: string;
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
