// ── Shared ────────────────────────────────────────────────

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

// ── NPC Generation ───────────────────────────────────────

export interface GenerateNPCRequest {
  campaignId: string;
  description: string;
  level?: number;
  role?: string;
  shareWithSession?: boolean;
}

export interface GeneratedNPC {
  name: string;
  role: string;
  appearance: string;
  personality: string;
  statBlock: string;
  plotHooks?: string;
  raw: string;
  usage: AIUsage;
}

// ── Encounter Generation ─────────────────────────────────

export type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'deadly';

export interface GenerateEncounterRequest {
  campaignId: string;
  partyLevel: number;
  partySize: number;
  difficulty: EncounterDifficulty;
  environment?: string;
  encounterType?: string;
  shareWithSession?: boolean;
}

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

export interface GeneratedEncounter {
  title: string;
  description: string;
  npcs: EncounterNPC[];
  totalXP: number;
  adjustedXP: number;
  difficulty: string;
  terrain?: string;
  tactics: string;
  treasure?: string;
  hooks?: string[];
  raw: string;
  usage: AIUsage;
}

// ── Rule Assistant ───────────────────────────────────────

export interface AskRuleRequest {
  campaignId: string;
  question: string;
  shareWithSession?: boolean;
}

export interface RuleAnswer {
  answer: string;
  citations: string[];
  relevantRules: string[];
  dmAdvice?: string;
  questionId: string;
  usage: AIUsage;
}

export interface RuleQuestionRecord {
  _id: string;
  campaignId: string;
  userId: string;
  username: string;
  question: string;
  answer: string;
  citations: string[];
  system: string;
  wasShared: boolean;
  createdAt: string;
}

// ── Plot Hooks ───────────────────────────────────────────

export interface GeneratePlotHooksRequest {
  campaignId: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  themes?: string[];
  shareWithSession?: boolean;
}

export interface GeneratedPlotHooks {
  hooks: string[];
  usage: AIUsage;
}

// ── World Building ───────────────────────────────────────

export type WorldNPCRole = 'quest_giver' | 'merchant' | 'information' | 'ally' | 'villain' | 'neutral';
export type LocationType = 'city' | 'town' | 'village' | 'dungeon' | 'wilderness' | 'landmark';
export type TavernTone = 'friendly' | 'rough' | 'mysterious' | 'upscale' | 'seedy';
export type ShopType = 'general' | 'blacksmith' | 'alchemist' | 'magic' | 'books' | 'exotic' | 'fence';

export interface GenerateLocationRequest {
  campaignId: string;
  locationType: LocationType;
  name?: string;
  prompt?: string;
  shareWithSession?: boolean;
}

export interface GenerateTavernRequest {
  campaignId: string;
  tone: TavernTone;
  name?: string;
  specialty?: string;
  shareWithSession?: boolean;
}

export interface GenerateShopRequest {
  campaignId: string;
  shopType: ShopType;
  name?: string;
  specialty?: string;
  shareWithSession?: boolean;
}

export interface GenerateWorldNPCRequest {
  campaignId: string;
  role: WorldNPCRole;
  importance: 'major' | 'minor';
  occupation?: string;
  prompt?: string;
  shareWithSession?: boolean;
}
