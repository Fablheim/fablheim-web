import { api } from './client';
import type { CombatEvent } from '@/types/campaign';

export const combatEventsApi = {
  list: async (
    campaignId: string,
    options?: { round?: number; limit?: number },
  ): Promise<CombatEvent[]> => {
    const params: Record<string, string> = {};
    if (options?.round != null) params.round = String(options.round);
    if (options?.limit != null) params.limit = String(options.limit);
    const { data } = await api.get<CombatEvent[]>(
      `/campaigns/${campaignId}/session/combat-events`,
      { params },
    );
    return data;
  },
};
