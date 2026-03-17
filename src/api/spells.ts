import { api } from './client';
import type {
  Spell,
  PopulatedCharacterSpell,
  LearnSpellPayload,
  SpellQuery,
  CreateSpellPayload,
} from '@/types/spell';

export const spellsApi = {
  // ── Reference Spells ────────────────────────────────────────

  list: async (query?: SpellQuery): Promise<Spell[]> => {
    const { data } = await api.get<Spell[]>('/spells', { params: query });
    return data;
  },

  get: async (id: string): Promise<Spell> => {
    const { data } = await api.get<Spell>(`/spells/${id}`);
    return data;
  },

  // ── Character Spells ────────────────────────────────────────

  getCharacterSpells: async (characterId: string): Promise<PopulatedCharacterSpell[]> => {
    const { data } = await api.get<PopulatedCharacterSpell[]>(
      `/spells/character/${characterId}`,
    );
    return data;
  },

  learnSpell: async (payload: LearnSpellPayload): Promise<PopulatedCharacterSpell> => {
    const { data } = await api.post<PopulatedCharacterSpell>('/spells/learn', payload);
    return data;
  },

  forgetSpell: async (characterSpellId: string): Promise<void> => {
    await api.delete(`/spells/character-spell/${characterSpellId}`);
  },

  prepareSpell: async (
    characterSpellId: string,
    isPrepared: boolean,
  ): Promise<PopulatedCharacterSpell> => {
    const { data } = await api.patch<PopulatedCharacterSpell>(
      `/spells/character-spell/${characterSpellId}/prepare`,
      { isPrepared },
    );
    return data;
  },

  updateNotes: async (
    characterSpellId: string,
    notes: string,
  ): Promise<PopulatedCharacterSpell> => {
    const { data } = await api.patch<PopulatedCharacterSpell>(
      `/spells/character-spell/${characterSpellId}/notes`,
      { notes },
    );
    return data;
  },

  // ── Campaign Homebrew Spells ─────────────────────────────────

  createCampaignSpell: async (
    campaignId: string,
    payload: CreateSpellPayload,
  ): Promise<Spell> => {
    const { data } = await api.post<Spell>(
      `/spells/campaign/${campaignId}`,
      payload,
    );
    return data;
  },

  updateCampaignSpell: async (
    spellId: string,
    payload: Partial<CreateSpellPayload>,
  ): Promise<Spell> => {
    const { data } = await api.patch<Spell>(
      `/spells/campaign/${spellId}`,
      payload,
    );
    return data;
  },

  deleteCampaignSpell: async (spellId: string): Promise<void> => {
    await api.delete(`/spells/campaign/${spellId}`);
  },
};
