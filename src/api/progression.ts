import { api } from './client';
import type { Character } from '@/types/campaign';
import type {
  ProgressionInfo,
  AwardXPResult,
  AwardXPPayload,
  PartyXPPayload,
} from '@/types/progression';

export const progressionApi = {
  getProgression: async (characterId: string): Promise<ProgressionInfo> => {
    const { data } = await api.get<ProgressionInfo>(`/progression/${characterId}`);
    return data;
  },

  awardXP: async (characterId: string, payload: AwardXPPayload): Promise<AwardXPResult> => {
    const { data } = await api.post<AwardXPResult>(
      `/progression/${characterId}/award-xp`,
      payload,
    );
    return data;
  },

  setXP: async (characterId: string, xp: number): Promise<Character> => {
    const { data } = await api.put<Character>(
      `/progression/${characterId}/set-xp`,
      { xp },
    );
    return data;
  },

  setLevel: async (characterId: string, level: number): Promise<Character> => {
    const { data } = await api.put<Character>(
      `/progression/${characterId}/set-level`,
      { level },
    );
    return data;
  },

  awardPartyXP: async (payload: PartyXPPayload): Promise<AwardXPResult[]> => {
    const { data } = await api.post<AwardXPResult[]>(
      '/progression/party-xp',
      payload,
    );
    return data;
  },
};
