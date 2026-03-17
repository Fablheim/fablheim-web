export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'gear'
  | 'consumable'
  | 'magical'
  | 'tool'
  | 'vehicle'
  | 'treasure'
  | 'other';

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very_rare'
  | 'legendary'
  | 'artifact';

export interface ItemTemplate {
  _id: string;
  name: string;
  description: string;
  system: string;
  category: ItemCategory;
  rarity: ItemRarity;
  weight?: number;
  cost?: number;
  costUnit?: string;
  properties: string[];
  damageFormula?: string;
  damageType?: string;
  weaponRange?: string;
  armorClass?: number;
  stealthDisadvantage: boolean;
  armorType?: string;
  attunementRequired: boolean;
  charges?: number;
  chargeRecharge?: string;
  tags: string[];
  visibility: string;
  source: string;
  campaignId?: string;
  createdBy?: string;
  systemData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ItemTemplateQuery {
  system?: string;
  category?: ItemCategory;
  source?: string;
  campaignId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
