// ── Layer 2 enums ────────────────────────────────────────────

export type AbilityType =
  | 'spell' | 'move' | 'stunt' | 'feature'
  | 'action' | 'trait' | 'passive';

export type UsageContext =
  | 'combat' | 'downtime' | 'exploration'
  | 'social' | 'passive';

export type OwnerType =
  | 'class' | 'ancestry' | 'character'
  | 'item' | 'campaign';

// ── Layer 3 payload interfaces ───────────────────────────────

export interface SpellPayload {
  level: number;
  school?: string | null;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string | null;
  };
  ritual: boolean;
  concentration: boolean;
  castingTime?: string | null;
  range?: string | null;
  duration?: string | null;
  higherLevels?: string | null;
  classes: string[];
}

export interface MovePayload {
  moveType?: string | null;
  cost?: string | null;
  effect?: string | null;
}

export interface StuntPayload {
  description: string;
  invokeCondition?: string | null;
}

export interface FeaturePayload {
  description: string;
  triggers: string[];
  prerequisites?: string | null;
  levelRequirement?: number | null;
}

// ── Layer 4 resource interface ───────────────────────────────

export interface ResourcePayload {
  cost?: string | null;
  uses?: number | null;
  recharge?: string | null;
  requiresRoll?: boolean;
  targeting?: string | null;
  cooldown?: string | null;
}

// ── Main interface ───────────────────────────────────────────

export interface Ability {
  _id: string;
  name: string;
  summary: string;
  description: string;
  system: string;
  tags: string[];
  source: string;
  visibility: string;
  publishState: string;
  sourceSystem?: string | null;
  derivedFrom?: string | null;
  transformedTo?: string | null;
  campaignId?: string | null;
  createdBy?: string | null;

  type: AbilityType;
  usageContext: UsageContext;
  ownerType: OwnerType;

  spellData?: SpellPayload | null;
  moveData?: MovePayload | null;
  stuntData?: StuntPayload | null;
  featureData?: FeaturePayload | null;
  resourceData?: ResourcePayload | null;

  createdAt: string;
  updatedAt: string;
}

// ── Query interface ──────────────────────────────────────────

export interface AbilityQuery {
  system?: string;
  type?: AbilityType;
  usageContext?: UsageContext;
  visibility?: string;
  campaignId?: string;
  search?: string;
  spellLevel?: number;
  spellSchool?: string;
  classes?: string[];
  tags?: string[];
  page?: number;
  limit?: number;
}

// ── CharacterAbility ─────────────────────────────────────────

export interface CharacterAbility {
  _id: string;
  characterId: string;
  abilityId: string | Ability;
  acquisitionType: 'known' | 'prepared' | 'equipped' | 'innate';
  known: boolean;
  prepared: boolean;
  equipped: boolean;
  usesRemaining?: number | null;
  source: string;
  sourceId?: string | null;
  notes: string;
  systemExtension?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}
