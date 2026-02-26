export interface StatDefinition {
  key: string;
  label: string;
  abbreviation: string;
  defaultValue: number;
  min?: number;
  max?: number;
}

export interface IdentityFields {
  ancestry: { label: string; placeholder: string } | null;
  class: { label: string; placeholder: string } | null;
  level: { min: number; max: number } | null;
}

export interface CombatConfig {
  hp: boolean;
  ac: boolean | { label: string };
  speed: boolean;
  initiative: boolean;
  spellSlots: boolean;
  deathSaves: boolean;
  attacks: boolean;
}

export interface PassiveScoreDefinition {
  key: string;
  label: string;
  abbreviation: string;
}

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'number' | 'text' | 'textarea' | 'boolean' | 'string-array';
  defaultValue?: unknown;
  group: string;
}

export interface SystemDefinition {
  id: string;
  name: string;
  description: string;
  identity: IdentityFields;
  stats: StatDefinition[];
  statModifierFormula: string | null;
  combat: CombatConfig;
  passiveScores: PassiveScoreDefinition[];
  customFields: CustomFieldDefinition[];
}

export interface SystemSummary {
  id: string;
  name: string;
  description: string;
}
