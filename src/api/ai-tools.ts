import { api } from './client';
import type {
  GenerateNPCRequest,
  GeneratedNPC,
  GenerateEncounterRequest,
  GeneratedEncounter,
  AskRuleRequest,
  RuleAnswer,
  RuleQuestionRecord,
  GeneratePlotHooksRequest,
  GeneratedPlotHooks,
  GenerateLocationRequest,
  GenerateTavernRequest,
  GenerateShopRequest,
  GenerateWorldNPCRequest,
} from '@/types/ai-tools';
import type { WorldEntity } from '@/types/campaign';

export const aiToolsApi = {
  // ── NPC Generation ─────────────────────────────────────
  generateNPC: async (data: GenerateNPCRequest): Promise<GeneratedNPC> => {
    const res = await api.post<GeneratedNPC>('/ai/generate-npc', data);
    return res.data;
  },

  // ── Encounter Generation ───────────────────────────────
  generateEncounter: async (data: GenerateEncounterRequest): Promise<GeneratedEncounter> => {
    const res = await api.post<GeneratedEncounter>('/ai/generate-encounter', data);
    return res.data;
  },

  // ── Rule Assistant ─────────────────────────────────────
  askRule: async (data: AskRuleRequest): Promise<RuleAnswer> => {
    const res = await api.post<RuleAnswer>('/ai/ask-rule', data);
    return res.data;
  },

  getRecentRules: async (campaignId: string): Promise<RuleQuestionRecord[]> => {
    const res = await api.get<RuleQuestionRecord[]>('/ai/rules/recent', {
      params: { campaignId },
    });
    return res.data;
  },

  // ── Plot Hooks ─────────────────────────────────────────
  generatePlotHooks: async (data: GeneratePlotHooksRequest): Promise<GeneratedPlotHooks> => {
    const res = await api.post<GeneratedPlotHooks>('/ai/world/generate-plot-hooks', data);
    return res.data;
  },

  // ── World Building ─────────────────────────────────────
  generateLocation: async (data: GenerateLocationRequest): Promise<WorldEntity> => {
    const res = await api.post<WorldEntity>('/ai/world/generate-location', data);
    return res.data;
  },

  generateTavern: async (data: GenerateTavernRequest): Promise<WorldEntity> => {
    const res = await api.post<WorldEntity>('/ai/world/generate-tavern', data);
    return res.data;
  },

  generateShop: async (data: GenerateShopRequest): Promise<WorldEntity> => {
    const res = await api.post<WorldEntity>('/ai/world/generate-shop', data);
    return res.data;
  },

  generateWorldNPC: async (data: GenerateWorldNPCRequest): Promise<WorldEntity> => {
    const res = await api.post<WorldEntity>('/ai/world/generate-npc', data);
    return res.data;
  },

  // ── Quest Generation ────────────────────────────────────
  generateQuest: async (data: {
    campaignId: string;
    questType: string;
    prompt?: string;
    difficulty?: string;
    partyLevel?: number;
    shareWithSession?: boolean;
    stream?: boolean;
  }): Promise<WorldEntity> => {
    const res = await api.post<WorldEntity>('/ai/world/generate-quest', data);
    return res.data;
  },

  // ── Lore Generation ─────────────────────────────────────
  generateLore: async (data: {
    campaignId: string;
    loreType: string;
    prompt?: string;
    name?: string;
    shareWithSession?: boolean;
    stream?: boolean;
  }): Promise<WorldEntity> => {
    const res = await api.post<WorldEntity>('/ai/world/generate-lore', data);
    return res.data;
  },
};
