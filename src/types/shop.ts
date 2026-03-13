export type ShopCategory =
  | 'general'
  | 'weapons'
  | 'armor'
  | 'magic'
  | 'potions'
  | 'tavern'
  | 'temple'
  | 'blacksmith'
  | 'other';

export type RestockFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  maxQuantity: number;
  basePrice: number;
  rarity: string;
  category: string;
}

export interface RestockSchedule {
  frequency: RestockFrequency;
  lastRestockedDate: string;
  notes: string;
}

export interface Shop {
  _id: string;
  campaignId: string;
  name: string;
  description: string;
  shopType: ShopCategory;
  entityId: string;
  region: string;
  priceModifier: number;
  inventory: ShopItem[];
  restock: RestockSchedule;
  shopGold: number;
  shopkeeperName: string;
  isClosed: boolean;
}

export interface CreateShopPayload {
  name: string;
  description?: string;
  shopType?: ShopCategory;
  entityId?: string;
  region?: string;
  priceModifier?: number;
  shopGold?: number;
  shopkeeperName?: string;
}

export interface UpdateShopPayload {
  name?: string;
  description?: string;
  shopType?: ShopCategory;
  region?: string;
  priceModifier?: number;
  shopGold?: number;
  shopkeeperName?: string;
  isClosed?: boolean;
  restock?: Partial<RestockSchedule>;
}

export interface AddShopItemPayload {
  name: string;
  description?: string;
  quantity?: number;
  maxQuantity?: number;
  basePrice?: number;
  rarity?: string;
  category?: string;
}
