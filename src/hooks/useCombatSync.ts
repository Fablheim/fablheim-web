import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';

interface HPChangedEvent {
  characterId: string;
  characterName: string;
  newHP: { current: number; max: number; temp: number };
  deathSaves: { successes: number; failures: number } | null;
}

/**
 * Listens for hp:changed socket events and invalidates character query caches.
 * Mount once per live session (e.g. in SessionRunnerPage).
 */
export function useCombatSync(campaignId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    function onHPChanged(event: HPChangedEvent) {
      queryClient.invalidateQueries({ queryKey: ['characters', campaignId] });
      queryClient.invalidateQueries({
        queryKey: ['characters', 'detail', event.characterId],
      });
    }

    socket.on('hp:changed', onHPChanged);
    return () => {
      socket.off('hp:changed', onHPChanged);
    };
  }, [campaignId, queryClient]);
}
