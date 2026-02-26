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

export interface Item {
  _id: string;
  characterId: string;
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
  damageDice?: string;
  damageType?: string;
  weaponProperties?: string[];
  armorClass?: number;
  armorType?: string;
  stealthDisadvantage?: boolean;
  notes?: string;
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
  characterId: string;
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
  damageDice?: string;
  damageType?: string;
  weaponProperties?: string[];
  armorClass?: number;
  armorType?: string;
  stealthDisadvantage?: boolean;
  notes?: string;
}

export type UpdateItemPayload = Partial<
  Omit<CreateItemPayload, 'characterId' | 'campaignId'>
>;

export type UpdateCurrencyPayload = Partial<CharacterCurrency>;
