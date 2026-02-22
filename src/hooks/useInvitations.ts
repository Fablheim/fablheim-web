import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '@/api/invitations';

export function usePendingInvitations(campaignId: string) {
  return useQuery({
    queryKey: ['invitations', campaignId],
    queryFn: () => invitationsApi.getPendingInvitations(campaignId),
    enabled: !!campaignId,
  });
}

export function useGenerateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => invitationsApi.generateInviteCode(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => invitationsApi.regenerateInviteCode(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useToggleInvites() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, enabled }: { campaignId: string; enabled: boolean }) =>
      invitationsApi.toggleInvites(campaignId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useSendEmailInvites() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, emails }: { campaignId: string; emails: string[] }) =>
      invitationsApi.sendEmailInvites(campaignId, emails),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', variables.campaignId] });
    },
  });
}

export function useJoinViaCode() {
  return useMutation({
    mutationFn: (inviteCode: string) => invitationsApi.joinViaCode(inviteCode),
  });
}

export function useAcceptEmailInvite() {
  return useMutation({
    mutationFn: (token: string) => invitationsApi.acceptEmailInvite(token),
  });
}
