import type { GenerationMeta } from './ai-tools';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic MongoDB schema data
export type DynamicSchemaData = Record<string, any>;

export type CampaignSystem = 'dnd5e' | 'pathfinder2e' | 'daggerheart' | 'fate' | 'custom';
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'archived';

export const systemLabels: Record<CampaignSystem, string> = {
  'dnd5e': 'D&D 5e',
  'pathfinder2e': 'Pathfinder 2e',
  'daggerheart': 'Daggerheart',
  'fate': 'Fate',
  'custom': 'Custom',
};

export const statusLabels: Record<CampaignStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

export type CampaignStage = 'prep' | 'live' | 'recap';

// ── Campaign Arc & Tracker types ─────────────────────────

export type ArcStatus = 'upcoming' | 'active' | 'completed' | 'advancing' | 'dormant' | 'threatened' | 'resolved';
export type ArcType =
  | 'main_plot'
  | 'faction_conflict'
  | 'mystery'
  | 'villain_scheme'
  | 'character_arc'
  | 'world_event'
  | 'prophecy'
  | 'custom';
export type ArcPressure = 'quiet' | 'active' | 'escalating';

export interface ArcMilestone {
  _id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export interface ArcDevelopment {
  _id: string;
  title: string;
  description?: string;
  sessionId?: string;
  linkedEntityIds?: string[];
  createdAt?: string;
}

export interface ArcLinks {
  entityIds?: string[];
  sessionIds?: string[];
  encounterIds?: string[];
  handoutIds?: string[];
  downtimeIds?: string[];
  calendarEventIds?: string[];
}

export interface CampaignArc {
  _id: string;
  name: string;
  description?: string;
  status: ArcStatus;
  type?: ArcType;
  pressure?: ArcPressure;
  stakes?: string;
  currentState?: string;
  recentChange?: string;
  nextDevelopment?: string;
  sortOrder: number;
  milestones: ArcMilestone[];
  developments?: ArcDevelopment[];
  links?: ArcLinks;
}

export interface TrackerThreshold {
  value: number;
  label: string;
  effect?: string;
}

export interface WorldStateTracker {
  _id: string;
  name: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  thresholds: TrackerThreshold[];
  visibility: 'public' | 'dm-only';
}

// ── Calendar types ───────────────────────────────────────

export type CalendarPresetType = 'forgotten_realms' | 'greyhawk' | 'custom';
export type CalendarEventType =
  | 'session'
  | 'travel'
  | 'downtime'
  | 'deadline'
  | 'faction'
  | 'festival'
  | 'reminder';
export type CalendarEventStatus = 'upcoming' | 'ongoing' | 'completed';

export interface CalendarMonth {
  name: string;
  days: number;
}

export interface CalendarEvent {
  id: string;
  name: string;
  year: number;
  month: number;
  day: number;
  eventType?: CalendarEventType;
  status?: CalendarEventStatus;
  recurring?: boolean;
  durationDays?: number;
  entityId?: string;
  sessionId?: string;
  notes?: string;
}

export interface CampaignCalendar {
  preset: CalendarPresetType;
  months: CalendarMonth[];
  weekdays: string[];
  currentDate: { year: number; month: number; day: number };
  events: CalendarEvent[];
}

export interface CampaignRulesConfig {
  presetId?: string;
  enabledModules: string[];
  moduleConfig: Record<string, Record<string, unknown>>;
  customModules?: string[];
}

export interface CampaignFeatures {
  arcs?: boolean;
  worldStateTrackers?: boolean;
  domains?: boolean;
  factionReputation?: boolean;
  npcSecrets?: boolean;
  questBranching?: boolean;
}

export interface Campaign {
  _id: string;
  name: string;
  description: string;
  dmId: string;
  setting: string;
  system: CampaignSystem;
  status: CampaignStatus;
  stage: CampaignStage;
  activeSessionId?: string;
  lastSessionDate?: string;
  inviteCode?: string;
  inviteEnabled: boolean;
  visibility?: string;
  maxPlayers?: number;
  levelingSystem?: string;
  startingLevel?: number;
  sessionFrequency?: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  worldMap?: {
    url: string;
    key: string;
    filename: string;
    width: number;
    height: number;
  } | null;
  arcs?: CampaignArc[];
  worldStateTrackers?: WorldStateTracker[];
  features?: CampaignFeatures;
  safetyTools?: {
    lines: string[];
    veils: string[];
    xCardEnabled: boolean;
    xCardGuidance?: string;
    openDoorEnabled?: boolean;
    openDoorNotes?: string;
    checkInPrompts?: string[];
    playerNotes?: string[];
  };
  rulesConfig?: CampaignRulesConfig | null;
  calendar?: CampaignCalendar | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  setting?: string;
  system?: CampaignSystem;
  status?: CampaignStatus;
  visibility?: string;
  maxPlayers?: number;
  levelingSystem?: string;
  startingLevel?: number;
  sessionFrequency?: string;
}

export type UpdateCampaignPayload = Partial<CreateCampaignPayload>;

export interface CharacterAttack {
  id: string;
  name: string;
  attackBonus: number;
  damageBonus: number;
  damageDice: string;
  damageType: string;
  actionCost?: 'action' | 'bonus' | 'reaction' | 'free';
  range?: string;
  description?: string;
}

export interface SpellSlotLevel {
  current: number;
  max: number;
}

export interface SpellSlots {
  level1?: SpellSlotLevel;
  level2?: SpellSlotLevel;
  level3?: SpellSlotLevel;
  level4?: SpellSlotLevel;
  level5?: SpellSlotLevel;
  level6?: SpellSlotLevel;
  level7?: SpellSlotLevel;
  level8?: SpellSlotLevel;
  level9?: SpellSlotLevel;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Character {
  _id: string;
  campaignId: string;
  userId: string;
  name: string;
  race?: string;
  class?: string;
  level: number;
  xp: number;
  backstory?: string;
  stats?: Record<string, number>;
  passiveScores: {
    perception: number;
    insight: number;
    investigation: number;
  };
  systemData?: DynamicSchemaData;
  mechanicData?: DynamicSchemaData;
  portrait?: {
    url: string;
    key: string;
    filename: string;
    width: number;
    height: number;
  };
  hp: { current: number; max: number; temp: number };
  ac: number;
  speed: number;
  initiativeBonus: number;
  attacks: CharacterAttack[];
  spellSlots: SpellSlots;
  spellSlotsPf2e?: Record<string, { max: number; current: number; spellId?: string }[]>;
  casterType?: 'prepared' | 'spontaneous';
  conditions: string[];
  deathSaves: DeathSaves | null;
  exhaustionLevel: number;
  deathEvents?: Array<{
    sessionId?: string;
    date: string;
    successes: number;
    failures: number;
    outcome: 'stabilized' | 'revived' | 'died';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterPayload {
  campaignId: string;
  name: string;
  race?: string;
  class?: string;
  level?: number;
  backstory?: string;
  stats?: Record<string, number>;
  passiveScores?: {
    perception: number;
    insight: number;
    investigation: number;
  };
  systemData?: DynamicSchemaData;
  hp?: { current: number; max: number; temp: number };
  ac?: number;
  speed?: number;
  portrait?: {
    url: string;
    key: string;
    filename: string;
    width: number;
    height: number;
  };
  exhaustionLevel?: number;
}

export type UpdateCharacterPayload = Partial<Omit<CreateCharacterPayload, 'campaignId'>> & {
  mechanicData?: DynamicSchemaData;
  wealthTier?: string;
};

// ── Roll Results ─────────────────────────────────────────

export interface AttackRollResult {
  attackRoll: number;
  attackTotal: number;
  isCritical: boolean;
  isCriticalFail: boolean;
  damageRolls: number[];
  damageTotal: number;
  attackName: string;
  damageType: string;
}

export interface AbilityRollResult {
  roll: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isCriticalFail: boolean;
  ability: string;
  type: 'check' | 'save';
}

// ── World Entities (NPCs) ────────────────────────────────

export type WorldEntityType = 'location' | 'location_detail' | 'faction' | 'npc' | 'npc_minor' | 'item' | 'quest' | 'event' | 'lore' | 'trap';
export type WorldEntityVisibility = 'public' | 'dm-only';
export type LocationType =
  | 'continent' | 'region' | 'kingdom' | 'city' | 'town' | 'village'
  | 'district' | 'building' | 'landmark' | 'dungeon' | 'room' | 'wilderness' | 'other';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

// ── Faction / NPC / Quest sub-types ─────────────────────

export type FactionDisposition = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied';

export interface ReputationEvent {
  description: string;
  delta: number;
  sessionNumber?: number;
  date: string;
}

export interface FactionRelationship {
  factionEntityId: string;
  attitude: FactionDisposition;
  description?: string;
}

export interface NpcSecret {
  description: string;
  revealed: boolean;
  revealedAt?: string;
}

export interface NpcLoyalty {
  factionEntityId: string;
  strength: number;
}

export interface AttitudeEvent {
  description: string;
  sessionNumber?: number;
  date: string;
}

export interface QuestOutcome {
  id: string;
  description: string;
  chosen: boolean;
  consequences?: string;
}

export interface QuestFactionImpact {
  factionEntityId: string;
  reputationDelta: number;
  description?: string;
}

export interface WorldEntity {
  _id: string;
  campaignId: string;
  name: string;
  type: WorldEntityType;
  description?: string;
  tags: string[];
  relatedEntities: Array<{ entityId: string; relationshipType: string }>;
  visibility: WorldEntityVisibility;
  typeData: DynamicSchemaData;
  aiGenerated: boolean;
  createdBy: string;
  // Map pin (percentage coords 0–1 on campaign world map)
  mapPin?: { x: number; y: number };
  // Location hierarchy
  parentEntityId?: string | { _id: string; name: string; type: string };
  locationType?: LocationType;
  // Quest-specific
  questType?: string;
  questStatus?: string;
  objectives?: QuestObjective[];
  questGiver?: string | { _id: string; name: string };
  rewards?: string;
  prerequisiteQuests?: string[];
  nextQuests?: string[];
  branchQuests?: string[];
  outcomes?: QuestOutcome[];
  stakes?: string;
  arcId?: string;
  factionImpact?: QuestFactionImpact[];
  // Faction-specific
  disposition?: FactionDisposition;
  reputation?: number;
  reputationHistory?: ReputationEvent[];
  factionRelationships?: FactionRelationship[];
  hiddenGoals?: string;
  // NPC-specific
  npcDisposition?: FactionDisposition;
  secrets?: NpcSecret[];
  motivations?: string[];
  loyalties?: NpcLoyalty[];
  attitudeHistory?: AttitudeEvent[];
  // Discovery
  discoveredByParty?: boolean;
  discoveredAt?: string;
  createdAt: string;
  updatedAt: string;
  _meta?: GenerationMeta;
}

export interface CreateWorldEntityPayload {
  name: string;
  type: WorldEntityType;
  description?: string;
  tags?: string[];
  relatedEntities?: Array<{ entityId: string; relationshipType: string }>;
  visibility?: WorldEntityVisibility;
  typeData?: DynamicSchemaData;
  mapPin?: { x: number; y: number } | null;
  parentEntityId?: string;
  locationType?: LocationType;
  questType?: string;
  questStatus?: string;
  objectives?: Array<{ id: string; description: string }>;
  questGiver?: string;
  rewards?: string;
  prerequisiteQuests?: string[];
  nextQuests?: string[];
  motivations?: string[];
}

export type UpdateWorldEntityPayload = Partial<CreateWorldEntityPayload>;

export interface WorldTreeNode {
  _id: string;
  name: string;
  type: WorldEntityType;
  locationType?: LocationType;
  parentEntityId?: string;
  childCount: number;
  discoveredByParty?: boolean;
}

// ── Handouts ──────────────────────────────────────────────

export interface Handout {
  _id: string;
  campaignId: string;
  sessionId?: string;
  title: string;
  type: 'image' | 'text' | 'map';
  artifactKind?:
    | 'letter'
    | 'journal'
    | 'note'
    | 'contract'
    | 'coded_message'
    | 'lore_fragment'
    | 'map'
    | 'drawing'
    | 'document';
  content: string;
  imageUrl?: string;
  visibleTo: 'all' | 'dm_only' | 'selected';
  sharedWith?: string[];
  sharedAt?: string;
  linkedSessionIds?: string[];
  linkedEntityIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Chat Messages ─────────────────────────────────────────

export type ChatMessageType =
  | 'ic'
  | 'ooc'
  | 'whisper'
  | 'system'
  | 'roll'
  | 'hp_change'
  | 'initiative'
  | 'condition';

export interface ChatMessage {
  _id: string;
  campaignId: string;
  userId?: string;
  username: string;
  message: string;
  type: ChatMessageType;
  recipientId?: string;
  recipientUsername?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Combat Events ────────────────────────────────────────

export type CombatEventAction =
  | 'damage'
  | 'healing'
  | 'temp-hp'
  | 'condition-applied'
  | 'condition-removed'
  | 'condition-expired'
  | 'death-save'
  | 'turn-start'
  | 'combat-started'
  | 'combat-ended';

export interface CombatEvent {
  _id: string;
  campaignId: string;
  round: number;
  turn: number;
  actor: string;
  action: CombatEventAction;
  target?: string;
  value?: number;
  detail?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Sessions ─────────────────────────────────────────────

export interface SessionStatistics {
  diceRolls: number;
  combatRounds: number;
  damageDealt: number;
  healingDone: number;
  spellsCast: number;
  criticalHits: number;
  criticalMisses: number;
  encountersCompleted: number;
  enemiesDefeated: number;
  questsAdvanced: string[];
  npcsIntroduced: string[];
  keyMoments: string[];
}

export interface PrepChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category?: string;
}

export interface RestEvent {
  id: string;
  type: 'short' | 'long';
  timestamp: string;
  note?: string;
}

export interface SessionScene {
  id: string;
  title: string;
  description?: string;
  locationId?: string;
  npcIds?: string[];
}

export interface Session {
  _id: string;
  campaignId: string;
  sessionNumber: number;
  title?: string;
  summary?: string;
  notes?: string;
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'ready' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  durationMinutes: number;
  npcIds?: string[];
  locationIds?: string[];
  questIds?: string[];
  encounterIds?: string[];
  scenes?: SessionScene[];
  statistics: SessionStatistics;
  aiRecap?: string;
  aiRecapGeneratedAt?: string;
  aiSummary?: {
    summary: string;
    keyEvents: string[];
    unresolvedHooks: string[];
    moodPace: string;
    generatedAt: string;
  };
  prepChecklist?: PrepChecklistItem[];
  restEvents?: RestEvent[];
  weather?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  campaignId: string;
  sessionNumber: number;
  title?: string;
  summary?: string;
  notes?: string;
  scheduledDate?: string;
  status?: 'draft' | 'scheduled' | 'ready' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  durationMinutes?: number;
  npcIds?: string[];
  locationIds?: string[];
  questIds?: string[];
  encounterIds?: string[];
  scenes?: SessionScene[];
}

export interface UpdateSessionRequest {
  title?: string;
  summary?: string;
  notes?: string;
  scheduledDate?: string;
  status?: 'draft' | 'scheduled' | 'ready' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  durationMinutes?: number;
  npcIds?: string[];
  locationIds?: string[];
  questIds?: string[];
  encounterIds?: string[];
  scenes?: SessionScene[];
  aiRecap?: string;
  prepChecklist?: PrepChecklistItem[];
  restEvents?: RestEvent[];
  weather?: string;
}

// ── Domains ─────────────────────────────────────────────

export interface ResourcePool {
  name: string;
  current: number;
  max?: number;
}

export interface PopulationTier {
  name: string;
  threshold: number;
  unlocks?: string;
}

export interface UpgradeTier {
  tier: number;
  name: string;
  description?: string;
  cost: Record<string, number>;
  built: boolean;
  builtAt?: string;
}

export interface UpgradeCategory {
  _id?: string;
  name: string;
  description?: string;
  tiers: UpgradeTier[];
}

export interface DomainSpecialist {
  _id?: string;
  role: string;
  name?: string;
  npcEntityId?: string;
  recruited: boolean;
  recruitedAt?: string;
  bonus?: string;
}

export interface Domain {
  _id: string;
  campaignId: string;
  locationEntityId: string;
  name: string;
  description: string;
  population: number;
  currentTierIndex: number;
  populationTiers: PopulationTier[];
  resources: ResourcePool[];
  upgradeCategories: UpgradeCategory[];
  specialists: DomainSpecialist[];
  notes: string;
  visibility: 'public' | 'dm-only';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainPayload {
  locationEntityId: string;
  name: string;
  description?: string;
  population?: number;
  populationTiers?: PopulationTier[];
  resources?: Array<{ name: string; current?: number; max?: number }>;
  visibility?: 'public' | 'dm-only';
}

export type UpdateDomainPayload = Partial<Omit<CreateDomainPayload, 'locationEntityId'>>;

// ── Allies ──────────────────────────────────────────────

export type AllyKind =
  | 'npc'
  | 'familiar'
  | 'summon'
  | 'pet'
  | 'mount'
  | 'retainer'
  | 'custom';

export type AllySourceType = 'world_entity' | 'custom' | 'template';
export type AllyDurationType = 'permanent' | 'session' | 'timed' | 'concentration';

export interface AllyVisibility {
  summary: boolean;
  statBlock: boolean;
  currentHp: boolean;
  maxHp: boolean;
  ac: boolean;
  owner: boolean;
  duration: boolean;
  notes: boolean;
}

export interface AllyHp {
  current?: number;
  max?: number;
  temp?: number;
}

export interface AllyAbilities {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
}

export interface AllyStatBlock {
  name?: string;
  size?: string;
  creatureType?: string;
  alignment?: string;
  ac?: number;
  hp?: AllyHp;
  speed?: string;
  initiativeBonus?: number;
  cr?: number;
  proficiencyBonus?: number;
  abilities?: AllyAbilities;
  senses?: string;
  languages?: string;
  skills?: string;
  saves?: string;
  resistances?: string;
  immunities?: string;
  vulnerabilities?: string;
  traits?: string;
  actions?: string;
  bonusActions?: string;
  reactions?: string;
  notes?: string;
  rawText?: string;
}

export interface Ally {
  _id: string;
  campaignId: string;
  sourceType: AllySourceType;
  sourceId?: string;
  sourceEntity?: WorldEntity | null;
  kind: AllyKind;
  name: string;
  addedBy: string;
  ownerCharacterId?: string;
  ownerCharacter?: Pick<Character, '_id' | 'name' | 'userId' | 'class' | 'level'> | null;
  controllerUserId?: string;
  description?: string;
  role?: string;
  personality?: string;
  durationType: AllyDurationType;
  expiresAt?: string;
  dismissedAt?: string;
  visibility: AllyVisibility;
  statBlock: AllyStatBlock;
  notes?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAllyPayload {
  sourceType: AllySourceType;
  sourceId?: string;
  kind: AllyKind;
  name?: string;
  ownerCharacterId?: string;
  controllerUserId?: string;
  description?: string;
  role?: string;
  personality?: string;
  durationType?: AllyDurationType;
  expiresAt?: string;
  visibility?: Partial<AllyVisibility>;
  statBlock?: AllyStatBlock;
  notes?: string;
}

export interface UpdateAllyPayload {
  kind?: AllyKind;
  name?: string;
  ownerCharacterId?: string;
  controllerUserId?: string;
  description?: string;
  role?: string;
  personality?: string;
  durationType?: AllyDurationType;
  expiresAt?: string | null;
  dismissedAt?: string | null;
  visibility?: Partial<AllyVisibility>;
  statBlock?: AllyStatBlock;
  notes?: string;
  sortOrder?: number;
}
