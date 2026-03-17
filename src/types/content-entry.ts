// ── Content types & source types ─────────────────────────────────────────────

export const CONTENT_TYPES = [
  'race', 'class', 'subclass', 'background', 'feat',
  'condition', 'other',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const SOURCE_TYPES = ['srd', 'homebrew', 'campaign', 'imported'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

// ── Homebrew-relevant content types ─────────────────────────────────────────

export const HOMEBREW_CONTENT_TYPES = [
  'race', 'class', 'subclass', 'background', 'feat', 'other',
] as const;
export type HomebrewContentType = (typeof HOMEBREW_CONTENT_TYPES)[number];

// ── Sub-document interfaces ─────────────────────────────────────────────────

export interface RaceData {
  traits: Array<{ name: string; description: string }>;
  abilityBonuses: Record<string, number>;
  speed: number;
  size: string;
  languages: string[];
  proficiencies: string[];
  subraces?: string[];
}

export interface ClassData {
  hitDie: string;
  primaryAbility: string[];
  savingThrows: string[];
  skillChoices: string[];
  skillCount: number;
  armorProficiencies: string[];
  weaponProficiencies: string[];
  features: Array<{ name: string; description: string; level: number }>;
  spellcasting?: { ability: string; type: string };
  subclassLevel?: number;
}

export interface SubclassData {
  parentClassSlug: string;
  features: Array<{ name: string; description: string; level: number }>;
}

export interface BackgroundData {
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number;
  equipment: string;
  feature: { name: string; description: string };
}

export interface FeatData {
  prerequisites: string;
  benefits: Array<{ name: string; description: string }>;
  abilityIncrease?: Record<string, number>;
}

export interface SourceRef {
  kind: 'srd_file' | 'homebrew_template';
  id?: string;
  path?: string;
}

// ── Main content entry ──────────────────────────────────────────────────────

export interface ContentEntry {
  _id: string;
  slug: string;
  name: string;
  contentType: ContentType;
  sourceType: SourceType;
  system: string;
  campaignId: string | null;
  createdBy: string | null;
  summary: string;
  body: string;
  tags: string[];
  sourceRef: SourceRef | null;
  raceData: RaceData | null;
  classData: ClassData | null;
  subclassData: SubclassData | null;
  backgroundData: BackgroundData | null;
  featData: FeatData | null;
  aiContext: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloads ────────────────────────────────────────────────────────────────

export interface CreateContentEntryPayload {
  name: string;
  contentType: ContentType;
  system?: string;
  summary?: string;
  body?: string;
  tags?: string[];
  raceData?: RaceData;
  classData?: ClassData;
  subclassData?: SubclassData;
  backgroundData?: BackgroundData;
  featData?: FeatData;
  aiContext?: string;
}

export interface UpdateContentEntryPayload extends Partial<CreateContentEntryPayload> {}
