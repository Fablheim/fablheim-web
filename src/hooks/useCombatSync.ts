import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';

interface HPChangedEvent {
  characterId: string;
  characterName: string;
  newHP: { current: number; max: number; temp: number };
  deathSaves: { successes: number; failures: number } | null;
  stateVersion?: number;
}

/**
 * Listens for hp:changed socket events and invalidates character query caches.
 * Also extracts stateVersion from events for desync detection.
 * Mount once per live session (e.g. in SessionRunnerPage).
 */
export function useCombatSync(
  campaignId: string,
  updateStateVersion?: (version: number) => void,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    function onHPChanged(event: HPChangedEvent) {
      if (event.stateVersion !== undefined && updateStateVersion) {
        updateStateVersion(event.stateVersion);
      }
      queryClient.invalidateQueries({ queryKey: ['characters', campaignId] });
      queryClient.invalidateQueries({
        queryKey: ['characters', 'detail', event.characterId],
      });
    }

    socket.on('hp:changed', onHPChanged);
    return () => {
      socket.off('hp:changed', onHPChanged);
    };
  }, [campaignId, queryClient, updateStateVersion]);
}
