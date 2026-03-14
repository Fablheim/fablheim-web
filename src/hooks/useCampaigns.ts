import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/api/campaigns';
import type { CreateCampaignPayload, UpdateCampaignPayload, CalendarPresetType } from '@/types/campaign';

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list(),
  });
}

export function useArchivedCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'archived'],
    queryFn: () => campaignsApi.listArchived(),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => campaignsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignPayload) => campaignsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignPayload }) =>
      campaignsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'archived'] });
    },
  });
}

export function useRestoreCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'archived'] });
    },
  });
}

export function useDeleteCampaignPermanently() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.deletePermanently(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'archived'] });
    },
  });
}

// ── Safety Tools ─────────────────────────────────────────

export function useUpdateSafetyTools() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: {
        lines?: string[];
        veils?: string[];
        xCardEnabled?: boolean;
        xCardGuidance?: string;
        openDoorEnabled?: boolean;
        openDoorNotes?: string;
        checkInPrompts?: string[];
        playerNotes?: string[];
      };
    }) => campaignsApi.updateSafetyTools(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

// ── Arcs ─────────────────────────────────────────────────

export function useArcs(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'arcs'],
    queryFn: () => campaignsApi.getArcs(campaignId),
    enabled: !!campaignId,
  });
}

export function useAddArc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: Parameters<typeof campaignsApi.addArc>[1] }) =>
      campaignsApi.addArc(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'arcs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useUpdateArc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, arcId, data }: { campaignId: string; arcId: string; data: Parameters<typeof campaignsApi.updateArc>[2] }) =>
      campaignsApi.updateArc(campaignId, arcId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'arcs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useRemoveArc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, arcId }: { campaignId: string; arcId: string }) =>
      campaignsApi.removeArc(campaignId, arcId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'arcs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useAddArcMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, arcId, data }: { campaignId: string; arcId: string; data: { description: string; completed?: boolean } }) =>
      campaignsApi.addArcMilestone(campaignId, arcId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'arcs'] });
    },
  });
}

export function useAddArcDevelopment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      arcId,
      data,
    }: {
      campaignId: string;
      arcId: string;
      data: {
        title: string;
        description?: string;
        sessionId?: string;
        linkedEntityIds?: string[];
      };
    }) => campaignsApi.addArcDevelopment(campaignId, arcId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'arcs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useToggleArcMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, arcId, milestoneId }: { campaignId: string; arcId: string; milestoneId: string }) =>
      campaignsApi.toggleArcMilestone(campaignId, arcId, milestoneId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'arcs'] });
    },
  });
}

// ── Trackers ─────────────────────────────────────────────

export function useTrackers(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'trackers'],
    queryFn: () => campaignsApi.getTrackers(campaignId),
    enabled: !!campaignId,
  });
}

export function useAddTracker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: Parameters<typeof campaignsApi.addTracker>[1] }) =>
      campaignsApi.addTracker(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'trackers'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useUpdateTracker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, trackerId, data }: { campaignId: string; trackerId: string; data: Parameters<typeof campaignsApi.updateTracker>[2] }) =>
      campaignsApi.updateTracker(campaignId, trackerId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'trackers'] });
    },
  });
}

export function useAdjustTracker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, trackerId, delta }: { campaignId: string; trackerId: string; delta: number }) =>
      campaignsApi.adjustTracker(campaignId, trackerId, delta),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'trackers'] });
    },
  });
}

export function useRemoveTracker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, trackerId }: { campaignId: string; trackerId: string }) =>
      campaignsApi.removeTracker(campaignId, trackerId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'trackers'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

// ── Calendar ─────────────────────────────────────────────

export function useInitCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, preset }: { campaignId: string; preset: CalendarPresetType }) =>
      campaignsApi.initCalendar(campaignId, preset),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useAdvanceDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, days }: { campaignId: string; days: number }) =>
      campaignsApi.advanceDate(campaignId, days),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useSetDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, date }: { campaignId: string; date: { year: number; month: number; day: number } }) =>
      campaignsApi.setDate(campaignId, date),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useAddCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: Parameters<typeof campaignsApi.addCalendarEvent>[1] }) =>
      campaignsApi.addCalendarEvent(campaignId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useRemoveCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, eventId }: { campaignId: string; eventId: string }) =>
      campaignsApi.removeCalendarEvent(campaignId, eventId),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      eventId,
      data,
    }: {
      campaignId: string;
      eventId: string;
      data: Parameters<typeof campaignsApi.updateCalendarEvent>[2];
    }) => campaignsApi.updateCalendarEvent(campaignId, eventId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId] });
    },
  });
}
