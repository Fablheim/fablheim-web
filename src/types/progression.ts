import type { Character } from '@/types/campaign';

export interface ProgressionInfo {
  level: number;
  xp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number; // 0 to 1
  proficiencyBonus: number;
  isMaxLevel: boolean;
}

export interface AwardXPResult {
  character: Character;
  leveledUp: boolean;
  newLevel?: number;
  previousLevel?: number;
}

export interface AwardXPPayload {
  amount: number;
  reason?: string;
}

export interface PartyXPPayload {
  campaignId: string;
  totalXP: number;
  reason?: string;
}
