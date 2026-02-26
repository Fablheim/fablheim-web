import { api } from './client';

export const stripeApi = {
  createSubscriptionCheckout: async (tier: 'hobbyist' | 'pro' | 'professional') => {
    const res = await api.post<{ sessionId: string; url: string }>(
      '/stripe/checkout/subscription',
      { tier },
    );
    return res.data;
  },

  createCreditPurchaseCheckout: async () => {
    const res = await api.post<{ sessionId: string; url: string }>(
      '/stripe/checkout/credits',
    );
    return res.data;
  },

  createPortalSession: async () => {
    const res = await api.post<{ url: string }>('/stripe/portal');
    return res.data;
  },
};
