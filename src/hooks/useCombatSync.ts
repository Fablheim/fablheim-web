import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import { useCharacters } from '@/hooks/useCharacters';

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
 * Shows toast notifications for players when their character is updated externally.
 * Mount once per live session (e.g. in SessionRunnerPage).
 */
export function useCombatSync(
  campaignId: string,
  updateStateVersion?: (version: number) => void,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: characters } = useCharacters(campaignId);

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

      // Notify player when their character's HP changes via initiative sync
      const myCharacter = characters?.find((c) => c.userId === user?._id);
      if (myCharacter && myCharacter._id === event.characterId) {
        toast.info(
          `${event.characterName}: ${event.newHP.current}/${event.newHP.max} HP`,
          { duration: 3000 },
        );
      }
    }

    socket.on('hp:changed', onHPChanged);
    return () => {
      socket.off('hp:changed', onHPChanged);
    };
  }, [campaignId, queryClient, updateStateVersion, user?._id, characters]);
}
