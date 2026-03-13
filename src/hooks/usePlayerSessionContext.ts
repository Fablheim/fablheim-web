import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/hooks/useCampaigns';
import { useInitiative } from '@/hooks/useLiveSession';
import { useCharacters } from '@/hooks/useCharacters';
import { useSocket } from '@/hooks/useSocket';
import { useUpdateConditions } from '@/hooks/useCharacterCombat';

/**
 * Player-scoped session context: my character, my initiative entry,
 * my conditions, X-Card, and condition toggling.
 */
export function usePlayerSessionContext(campaignId: string) {
  const { user } = useAuth();
  const { data: campaign } = useCampaign(campaignId);
  const { data: initiative } = useInitiative(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { socket } = useSocket();
  const updateConditions = useUpdateConditions();

  const myCharacter = characters?.find((c) => c.userId === user?._id);
  const myEntry = myCharacter
    ? initiative?.entries.find((entry) => entry.characterId === myCharacter._id)
    : undefined;
  const myConditions = myCharacter?.conditions ?? [];
  const xCardEnabled = campaign?.safetyTools?.xCardEnabled ?? false;

  const toggleCondition = useCallback(
    (condition: string) => {
      if (!myCharacter) return;
      const next = myConditions.includes(condition)
        ? myConditions.filter((c) => c !== condition)
        : [...myConditions, condition];
      updateConditions.mutate({ id: myCharacter._id, conditions: next });
    },
    [myCharacter, myConditions, updateConditions],
  );

  const handleXCard = useCallback(() => {
    if (!socket) return;
    socket.emit('safety:x-card', { campaignId });
  }, [socket, campaignId]);

  return {
    myCharacter,
    myEntry,
    myConditions,
    toggleCondition,
    handleXCard,
    xCardEnabled,
  };
}
