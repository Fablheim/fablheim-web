export interface EnemyAttack {
  name: string;
  bonus: number;
  damage: string;
  range?: string;
  description?: string;
}

export interface EnemyTrait {
  name: string;
  description: string;
}

/** System-flexible ability scores (e.g. D&D str/dex/con/int/wis/cha, Daggerheart agility/strength/finesse/instinct/presence/knowledge) */
export type EnemyAbilities = Record<string, number>;

export interface EnemyHP {
  average: number;
  formula?: string;
}

export interface EnemySpeed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

export type EnemyCategory =
  | 'humanoid' | 'beast' | 'undead' | 'dragon' | 'aberration' | 'construct'
  | 'elemental' | 'fey' | 'fiend' | 'giant' | 'monstrosity' | 'ooze' | 'plant' | 'custom';

export type EnemySize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export interface EnemyTemplate {
  _id: string;
  userId: string;
  name: string;
  category: EnemyCategory;
  cr?: string;
  size: EnemySize;
  hp: EnemyHP;
  ac: number;
  speed: EnemySpeed;
  abilities?: EnemyAbilities;
  initiativeBonus?: number;
  attacks: EnemyAttack[];
  traits: EnemyTrait[];
  tokenImage?: string;
  tokenColor: string;
  tags: string[];
  source?: string;
  notes?: string;
  system?: string;
  systemData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnemyTemplateRequest {
  name: string;
  category?: EnemyCategory;
  cr?: string;
  size?: EnemySize;
  hp: EnemyHP;
  ac: number;
  speed?: Partial<EnemySpeed>;
  abilities?: EnemyAbilities;
  initiativeBonus?: number;
  attacks?: EnemyAttack[];
  traits?: EnemyTrait[];
  tokenImage?: string;
  tokenColor?: string;
  tags?: string[];
  source?: string;
  notes?: string;
  system?: string;
  systemData?: Record<string, unknown>;
}

export type UpdateEnemyTemplateRequest = Partial<CreateEnemyTemplateRequest>;

export interface SpawnEnemiesRequest {
  quantity: number;
  namingPattern: 'numeric' | 'alpha' | 'custom';
  customNames?: string[];
}

export interface SpawnedEnemy {
  templateId: string;
  name: string;
  category: EnemyCategory;
  cr?: string;
  size: EnemySize;
  hp: number;
  ac: number;
  speed: EnemySpeed;
  abilities?: EnemyAbilities;
  initiativeBonus: number;
  attacks: EnemyAttack[];
  traits: EnemyTrait[];
  tokenImage?: string;
  tokenColor: string;
  system?: string;
  systemData?: Record<string, unknown>;
}
