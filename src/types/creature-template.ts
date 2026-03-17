export interface CreatureAttack {
  name: string;
  bonus: number;
  damage: string;
  actionCost?: 'action' | 'bonus' | 'reaction' | 'free';
  range?: string;
  description?: string;
}

export interface CreatureTrait {
  name: string;
  description: string;
}

/** System-flexible ability scores (e.g. D&D str/dex/con/int/wis/cha, Daggerheart agility/strength/finesse/instinct/presence/knowledge) */
export type CreatureAbilities = Record<string, number>;

export interface CreatureHP {
  average: number;
  formula?: string;
}

export interface CreatureSpeed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

export type CreatureCategory =
  | 'humanoid' | 'beast' | 'undead' | 'dragon' | 'aberration' | 'construct'
  | 'elemental' | 'fey' | 'fiend' | 'giant' | 'monstrosity' | 'ooze' | 'plant' | 'custom';

export type CreatureSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export interface CreatureTemplate {
  _id: string;
  userId?: string;
  name: string;
  category: CreatureCategory;
  cr?: string;
  size: CreatureSize;
  hp: CreatureHP;
  ac: number;
  speed: CreatureSpeed;
  abilities?: CreatureAbilities;
  initiativeBonus?: number;
  attacks: CreatureAttack[];
  traits: CreatureTrait[];
  tokenImage?: string;
  tokenColor: string;
  tags: string[];
  source?: string;
  notes?: string;
  system?: string;
  systemData?: Record<string, unknown>;
  isGlobal?: boolean;
  srdSource?: string;
  visibility?: string;
  publishState?: string;
  lootHooks?: Array<{
    itemTemplateId?: string;
    itemName: string;
    quantity: number;
    dropChance: number;
    notes: string;
  }>;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreatureTemplateRequest {
  name: string;
  category?: CreatureCategory;
  cr?: string;
  size?: CreatureSize;
  hp: CreatureHP;
  ac: number;
  speed?: Partial<CreatureSpeed>;
  abilities?: CreatureAbilities;
  initiativeBonus?: number;
  attacks?: CreatureAttack[];
  traits?: CreatureTrait[];
  tokenImage?: string;
  tokenColor?: string;
  tags?: string[];
  source?: string;
  notes?: string;
  system?: string;
  systemData?: Record<string, unknown>;
}

export type UpdateCreatureTemplateRequest = Partial<CreateCreatureTemplateRequest>;

export interface SpawnCreaturesRequest {
  quantity: number;
  namingPattern: 'numeric' | 'alpha' | 'custom';
  customNames?: string[];
}

export interface SpawnedCreature {
  templateId: string;
  name: string;
  category: CreatureCategory;
  cr?: string;
  size: CreatureSize;
  hp: number;
  ac: number;
  speed: CreatureSpeed;
  abilities?: CreatureAbilities;
  initiativeBonus: number;
  attacks: CreatureAttack[];
  traits: CreatureTrait[];
  tokenImage?: string;
  tokenColor: string;
  system?: string;
  systemData?: Record<string, unknown>;
}

// ── Backward-compat aliases ─────────────────────────────────
// Many frontend files still reference the old names. Re-export
// under the old names so we can update imports file-by-file
// without breaking the build. These can be removed later.
export type EnemyAttack = CreatureAttack;
export type EnemyTrait = CreatureTrait;
export type EnemyAbilities = CreatureAbilities;
export type EnemyHP = CreatureHP;
export type EnemySpeed = CreatureSpeed;
export type EnemyCategory = CreatureCategory;
export type EnemySize = CreatureSize;
export type EnemyTemplate = CreatureTemplate;
export type CreateEnemyTemplateRequest = CreateCreatureTemplateRequest;
export type UpdateEnemyTemplateRequest = UpdateCreatureTemplateRequest;
export type SpawnEnemiesRequest = SpawnCreaturesRequest;
export type SpawnedEnemy = SpawnedCreature;
