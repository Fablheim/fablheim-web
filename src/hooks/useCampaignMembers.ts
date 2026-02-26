import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignMembersApi } from '@/api/campaign-members';
import { useCampaigns } from '@/hooks/useCampaigns';

export function useMyCampaignMemberships() {
  return useQuery({
    queryKey: ['campaign-memberships'],
    queryFn: () => campaignMembersApi.listMyCampaigns(),
  });
}

export function useCampaignMembers(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-members', campaignId],
    queryFn: () => campaignMembersApi.listByCampaign(campaignId),
    enabled: !!campaignId,
  });
}

export function useLeaveCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) =>
      campaignMembersApi.leaveCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-memberships'] });
    },
  });
}

// ── Unified campaign list for selectors ──────────────────

export interface AccessibleCampaign {
  _id: string;
  name: string;
  description: string;
  status: string;
  role: 'dm' | 'player' | 'co_dm';
  setting?: string;
  system?: string;
  dmId?: string;
}

/**
 * Returns all campaigns the user can access — both DM-owned and
 * player/co-dm memberships — with a `role` field for permission checks.
 */
export function useAccessibleCampaigns() {
  const { data: dmCampaigns, isLoading: dmLoading } = useCampaigns();
  const { data: memberships, isLoading: memLoading } = useMyCampaignMemberships();

  const campaigns = useMemo<AccessibleCampaign[]>(() => {
    const result: AccessibleCampaign[] = [];

    if (dmCampaigns) {
      for (const c of dmCampaigns) {
        result.push({
          _id: c._id,
          name: c.name,
          description: c.description,
          status: c.status,
          role: 'dm',
          setting: c.setting,
          system: c.system,
          dmId: c.dmId,
        });
      }
    }

    if (memberships) {
      const dmIds = new Set(result.map((c) => c._id));
      for (const m of memberships) {
        if (!dmIds.has(m.campaignId._id)) {
          result.push({
            _id: m.campaignId._id,
            name: m.campaignId.name,
            description: m.campaignId.description,
            status: m.campaignId.status,
            role: m.role,
          });
        }
      }
    }

    return result;
  }, [dmCampaigns, memberships]);

  return {
    data: campaigns.length > 0 ? campaigns : undefined,
    isLoading: dmLoading || memLoading,
  };
}
