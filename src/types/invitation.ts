export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface CampaignInvitation {
  _id: string;
  campaignId: string;
  email: string;
  userId?: string;
  invitedBy: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}
