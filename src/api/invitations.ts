import { api } from './client';
import type { Campaign } from '@/types/campaign';
import type { CampaignInvitation } from '@/types/invitation';

export const invitationsApi = {
  // DM actions
  generateInviteCode: (campaignId: string) =>
    api.post<{ inviteCode: string }>(`/campaigns/${campaignId}/invite-code`).then((r) => r.data),

  regenerateInviteCode: (campaignId: string) =>
    api.post<{ inviteCode: string }>(`/campaigns/${campaignId}/invite-code/regenerate`).then((r) => r.data),

  toggleInvites: (campaignId: string, enabled: boolean) =>
    api.patch<Campaign>(`/campaigns/${campaignId}/invites`, { enabled }).then((r) => r.data),

  sendEmailInvites: (campaignId: string, emails: string[]) =>
    api.post<{ invitations: CampaignInvitation[]; count: number }>(
      `/campaigns/${campaignId}/invite/email`,
      { emails },
    ).then((r) => r.data),

  getPendingInvitations: (campaignId: string) =>
    api.get<CampaignInvitation[]>(`/campaigns/${campaignId}/invitations`).then((r) => r.data),

  // Player actions
  joinViaCode: (inviteCode: string) =>
    api.post<{ campaign: Campaign }>(`/join/code/${inviteCode}`).then((r) => r.data),

  acceptEmailInvite: (token: string) =>
    api.post<{ campaign: Campaign }>(`/join/email/${token}`).then((r) => r.data),
};
