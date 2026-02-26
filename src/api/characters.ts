import { api } from './client';
import type {
  Character,
  CharacterAttack,
  CreateCharacterPayload,
  UpdateCharacterPayload,
  AttackRollResult,
  AbilityRollResult,
} from '@/types/campaign';

export const charactersApi = {
  list: async (campaignId: string): Promise<Character[]> => {
    const { data } = await api.get<Character[]>('/characters', {
      params: { campaignId },
    });
    return data;
  },

  /** Get all characters owned by the current user across all campaigns */
  listMine: async (): Promise<Character[]> => {
    const { data } = await api.get<Character[]>('/characters');
    return data;
  },

  get: async (id: string): Promise<Character> => {
    const { data } = await api.get<Character>(`/characters/${id}`);
    return data;
  },

  create: async (body: CreateCharacterPayload): Promise<Character> => {
    const { data } = await api.post<Character>('/characters', body);
    return data;
  },

  update: async (id: string, body: UpdateCharacterPayload): Promise<Character> => {
    const { data } = await api.patch<Character>(`/characters/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/characters/${id}`);
  },

  // ── Combat Endpoints ──────────────────────────────────────

  takeDamage: async (id: string, amount: number, type?: string): Promise<Character> => {
    const { data } = await api.post<Character>(`/characters/${id}/damage`, { amount, type });
    return data;
  },

  heal: async (id: string, amount: number): Promise<Character> => {
    const { data } = await api.post<Character>(`/characters/${id}/heal`, { amount });
    return data;
  },

  addTempHP: async (id: string, amount: number): Promise<Character> => {
    const { data } = await api.post<Character>(`/characters/${id}/temp-hp`, { amount });
    return data;
  },

  updateHP: async (id: string, hp: { current: number; max: number; temp: number }): Promise<Character> => {
    const { data } = await api.patch<Character>(`/characters/${id}/hp`, hp);
    return data;
  },

  updateAttacks: async (id: string, attacks: CharacterAttack[]): Promise<Character> => {
    const { data } = await api.patch<Character>(`/characters/${id}/attacks`, { attacks });
    return data;
  },

  consumeSpellSlot: async (id: string, level: number): Promise<Character> => {
    const { data } = await api.post<Character>(`/characters/${id}/consume-spell-slot`, { level });
    return data;
  },

  restoreSpellSlot: async (id: string, level: number): Promise<Character> => {
    const { data } = await api.post<Character>(`/characters/${id}/restore-spell-slot`, { level });
    return data;
  },

  updateConditions: async (id: string, conditions: string[]): Promise<Character> => {
    const { data } = await api.patch<Character>(`/characters/${id}/conditions`, { conditions });
    return data;
  },

  rollDeathSave: async (id: string, result: 'success' | 'failure'): Promise<Character> => {
    const { data } = await api.post<Character>(`/characters/${id}/death-save`, { result });
    return data;
  },

  // ── Roll Endpoints ──────────────────────────────────────

  rollAttack: async (id: string, attackId: string, campaignId?: string): Promise<AttackRollResult> => {
    const { data } = await api.post<AttackRollResult>(`/characters/${id}/roll-attack`, { attackId, campaignId });
    return data;
  },

  rollAbility: async (
    id: string,
    ability: string,
    type: 'check' | 'save' = 'check',
    campaignId?: string,
  ): Promise<AbilityRollResult> => {
    const { data } = await api.post<AbilityRollResult>(`/characters/${id}/roll-ability`, { ability, type, campaignId });
    return data;
  },
};
