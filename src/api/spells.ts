import { api } from './client';
import type {
  Spell,
  PopulatedCharacterSpell,
  LearnSpellPayload,
  SpellQuery,
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
};
