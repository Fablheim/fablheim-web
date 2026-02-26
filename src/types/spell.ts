export type SpellSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';

export interface Spell {
  _id: string;
  name: string;
  level: number;
  school: SpellSchool;
  castingTime: string;
  range: string;
  duration: string;
  components: string[];
  material?: string;
  description: string;
  higherLevels?: string;
  classes: string[];
  ritual: boolean;
  concentration: boolean;
  system: string;
  source: string;
}

export interface CharacterSpell {
  _id: string;
  characterId: string;
  spellId: string | Spell; // populated or not
  isPrepared: boolean;
  notes?: string;
  source: 'learned' | 'innate' | 'racial' | 'item';
}

// When populated:
export interface PopulatedCharacterSpell extends Omit<CharacterSpell, 'spellId'> {
  spellId: Spell;
}

export interface LearnSpellPayload {
  characterId: string;
  spellId: string;
  source?: string;
}

export interface SpellQuery {
  level?: number;
  school?: string;
  class?: string;
  search?: string;
  system?: string;
}
