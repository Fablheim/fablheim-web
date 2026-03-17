export type ItemType =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'gear'
  | 'consumable'
  | 'treasure'
  | 'ammunition'
  | 'tool';

export type Rarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very-rare'
  | 'legendary'
  | 'artifact';

export type EquipmentSlot =
  | 'head'
  | 'neck'
  | 'chest'
  | 'hands'
  | 'waist'
  | 'feet'
  | 'ring1'
  | 'ring2'
  | 'cloak'
  | 'mainHand'
  | 'offHand';

export type ItemScope = 'character' | 'party';

export interface Item {
  _id: string;
  scope: ItemScope;
  characterId?: string;
  campaignId: string;
  name: string;
  type: ItemType;
  description?: string;
  quantity: number;
  weight: number;
  value: number;
  rarity: Rarity;
  isEquipped: boolean;
  slot?: EquipmentSlot | '';
  isMagical: boolean;
  requiresAttunement: boolean;
  isAttuned: boolean;
  bulk?: string;
  requiresInvestment?: boolean;
  isInvested?: boolean;
  damageDice?: string;
  damageType?: string;
  weaponProperties?: string[];
  armorClass?: number;
  armorType?: string;
  stealthDisadvantage?: boolean;
  notes?: string;
  isContainer: boolean;
  parentItemId?: string;
  containerCapacity: number;
  sourceType?: string;
  sourceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterCurrency {
  characterId: string;
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface CreateItemPayload {
  scope?: ItemScope;
  characterId?: string;
  campaignId: string;
  name: string;
  type: ItemType;
  description?: string;
  quantity?: number;
  weight?: number;
  value?: number;
  rarity?: Rarity;
  isMagical?: boolean;
  requiresAttunement?: boolean;
  bulk?: string;
  requiresInvestment?: boolean;
  isInvested?: boolean;
  damageDice?: string;
  damageType?: string;
  weaponProperties?: string[];
  armorClass?: number;
  armorType?: string;
  stealthDisadvantage?: boolean;
  notes?: string;
  isContainer?: boolean;
  parentItemId?: string;
  containerCapacity?: number;
}

export type UpdateItemPayload = Partial<
  Omit<CreateItemPayload, 'characterId' | 'campaignId' | 'scope'>
>;

export type UpdateCurrencyPayload = Partial<CharacterCurrency>;

export interface SrdItemTemplate {
  _id: string;
  name: string;
  category: string;
  description: string;
  weight: number;
  cost: number;
  costUnit: string;
  rarity: string;
  attunementRequired: boolean;
  damageFormula?: string;
  damageType?: string;
  properties: string[];
  armorClass?: number;
  armorType?: string;
  stealthDisadvantage: boolean;
  source: 'srd';
}

export interface CloneSrdItemPayload {
  templateId: string;
  campaignId: string;
  characterId?: string;
  scope?: 'character' | 'party';
}
