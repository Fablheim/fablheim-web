// ── Custom Module Types ──────────────────────────────────────

export interface CustomResourceDef {
  key: string;
  label: string;
  max: number;
  rechargeOn?: 'short-rest' | 'long-rest' | 'manual';
  display?: 'dots' | 'number' | 'bar';
  color?: string;
}

export interface CustomConditionDef {
  key: string;
  label: string;
  description: string;
  hasValue?: boolean;
}

export interface CustomCharacterFieldDef {
  key: string;
  label: string;
  type: 'number' | 'text' | 'toggle' | 'select' | 'string-array';
  defaultValue?: unknown;
  group?: string;
  min?: number;
  max?: number;
  options?: string[];
}

export interface CustomRollTypeDef {
  key: string;
  label: string;
  dice: string;
  modifier?: string;
  description?: string;
}

export interface HouseRuleDef {
  key: string;
  title: string;
  description: string;
  category?: string;
}

export interface CustomModule {
  _id: string;
  name: string;
  description: string;
  campaignId: string;
  createdBy: string;
  resources: CustomResourceDef[];
  conditions: CustomConditionDef[];
  characterFields: CustomCharacterFieldDef[];
  rollTypes: CustomRollTypeDef[];
  houseRules: HouseRuleDef[];
  aiContext: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomModulePayload {
  name: string;
  description?: string;
  resources?: CustomResourceDef[];
  conditions?: CustomConditionDef[];
  characterFields?: CustomCharacterFieldDef[];
  rollTypes?: CustomRollTypeDef[];
  houseRules?: HouseRuleDef[];
}

export type UpdateCustomModulePayload = CreateCustomModulePayload;

export interface ResolvedCustomBlocks {
  conditions: Array<CustomConditionDef & { moduleId: string }>;
  resources: Array<CustomResourceDef & { moduleId: string }>;
  rollTypes: Array<CustomRollTypeDef & { moduleId: string }>;
  houseRules: Array<HouseRuleDef & { moduleId: string; moduleName: string }>;
  characterFields: Array<{ key: string; label: string; type: string; defaultValue?: unknown; group?: string; moduleId: string }>;
}
