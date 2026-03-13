import { api } from './client';

export interface TreasuryBalances {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface LedgerEntry {
  id: string;
  amount: number;
  currency: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
  type: 'deposit' | 'withdrawal' | 'transfer';
  description: string;
  characterId?: string;
  characterName?: string;
  sessionId?: string;
  timestamp: string;
}

export interface PartyTreasury {
  _id: string;
  campaignId: string;
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
  ledger: LedgerEntry[];
}

export interface LedgerResponse {
  entries: LedgerEntry[];
  total: number;
  balances: TreasuryBalances;
}

export interface TreasuryTransactionPayload {
  amount: number;
  currency: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
  type: 'deposit' | 'withdrawal';
  description: string;
  characterId?: string;
  characterName?: string;
  sessionId?: string;
}

export const treasuryApi = {
  get: (campaignId: string) =>
    api.get<PartyTreasury>(`/campaigns/${campaignId}/treasury`).then((r) => r.data),

  addTransaction: (campaignId: string, data: TreasuryTransactionPayload) =>
    api.post<PartyTreasury>(`/campaigns/${campaignId}/treasury/transaction`, data).then((r) => r.data),

  getLedger: (campaignId: string, limit = 50, offset = 0) =>
    api.get<LedgerResponse>(`/campaigns/${campaignId}/treasury/ledger`, {
      params: { limit, offset },
    }).then((r) => r.data),
};
