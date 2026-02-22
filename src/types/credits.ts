export interface CreditBalance {
  subscription: number;
  purchased: number;
  total: number;
}

export interface CreditTransaction {
  _id: string;
  type: 'consumption' | 'grant' | 'expiry';
  amount: number;
  balanceAfter: number;
  featureType?: string;
  description: string;
  createdAt: string;
}

export type CreditCosts = Record<string, number>;
