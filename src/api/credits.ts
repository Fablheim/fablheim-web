import { api } from './client';
import type { CreditBalance, CreditTransaction, CreditCosts } from '@/types/credits';

export const creditsApi = {
  getBalance: async (): Promise<CreditBalance> => {
    const res = await api.get<CreditBalance>('/ai/credits/balance');
    return res.data;
  },

  getHistory: async (limit = 20, offset = 0): Promise<CreditTransaction[]> => {
    const res = await api.get<CreditTransaction[]>('/ai/credits/history', {
      params: { limit, offset },
    });
    return res.data;
  },

  getCosts: async (): Promise<CreditCosts> => {
    const res = await api.get<CreditCosts>('/ai/credits/costs');
    return res.data;
  },
};
