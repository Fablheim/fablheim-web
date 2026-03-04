import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liveSessionApi } from '@/api/live-session';
import { getSocket } from '@/lib/socket';
import type { AddMapTokenRequest, UpdateMapTokenRequest, MapUpdatedEvent, BattleMap } from '@/types/live-session';
import type { AddAoEOverlayRequest, UpdateAoEOverlayRequest } from '@/types/combat-rules';

export function useBattleMap(campaignId: string) {
  const queryClient = useQueryClient();

  // Subscribe to map-updated socket events
  useEffect(() => {
    const socket = getSocket();

    function onMapUpdated(event: MapUpdatedEvent) {
      queryClient.setQueryData(['battle-map', campaignId], event.map);
    }

    socket.on('map-updated', onMapUpdated);
    return () => {
      socket.off('map-updated', onMapUpdated);
    };
  }, [campaignId, queryClient]);

  return useQuery({
    queryKey: ['battle-map', campaignId],
    queryFn: () => liveSessionApi.getMap(campaignId),
    enabled: !!campaignId,
  });
}

export function useAddMapToken(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddMapTokenRequest) =>
      liveSessionApi.addMapToken(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}

export function useMoveMapToken(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tokenId, x, y }: { tokenId: string; x: number; y: number }) =>
      liveSessionApi.updateMapToken(campaignId, tokenId, { x, y }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}

export function useUpdateMapToken(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tokenId, body }: { tokenId: string; body: UpdateMapTokenRequest }) =>
      liveSessionApi.updateMapToken(campaignId, tokenId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}

export function useRemoveMapToken(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) =>
      liveSessionApi.removeMapToken(campaignId, tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}

export function useUpdateMapSettings(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Partial<
        Pick<
          BattleMap,
          | 'name'
          | 'backgroundImageUrl'
          | 'gridWidth'
          | 'gridHeight'
          | 'gridSquareSizeFt'
          | 'gridOpacity'
          | 'snapToGrid'
          | 'gridOffsetX'
          | 'gridOffsetY'
        >
      >,
    ) => liveSessionApi.updateMapSettings(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}

export function useClearMap(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => liveSessionApi.clearMap(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}

export function useAddAoEOverlay(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddAoEOverlayRequest) =>
      liveSessionApi.addAoEOverlay(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}

export function useUpdateAoEOverlay(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ overlayId, body }: { overlayId: string; body: UpdateAoEOverlayRequest }) =>
      liveSessionApi.updateAoEOverlay(campaignId, overlayId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}

export function useRemoveAoEOverlay(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (overlayId: string) =>
      liveSessionApi.removeAoEOverlay(campaignId, overlayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-map', campaignId] });
    },
  });
}
