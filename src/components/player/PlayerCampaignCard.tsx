import { Play, Users, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTabs } from '@/context/TabContext';
import { useSessions } from '@/hooks/useSessions';
import { useCharacters } from '@/hooks/useCharacters';
import { useCampaignMembers } from '@/hooks/useCampaignMembers';
import { resolveRouteContent } from '@/routes';
import { Button } from '@/components/ui/Button';
import type { Character } from '@/types/campaign';

interface PlayerCampaignCardProps {
  campaignId: string;
  campaignName: string;
  campaignDescription?: string;
  campaignStatus: string;
  role: 'player' | 'co_dm';
  onViewCharacter?: (character: Character) => void;
}

export function PlayerCampaignCard({
  campaignId,
  campaignName,
  campaignDescription,
  campaignStatus,
  role,
  onViewCharacter,
}: PlayerCampaignCardProps) {
  const { user } = useAuth();
  const { openTab } = useTabs();

  const { data: sessions } = useSessions(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: members } = useCampaignMembers(campaignId);

  const activeSession = sessions?.find((s) => s.status === 'in_progress');
  const myCharacter = characters?.find((c) => c.userId === user?._id);
  const memberCount = (members?.length ?? 0) + 1; // +1 for the DM

  function handleJoinSession() {
    const path = `/app/campaigns/${campaignId}/live`;
    openTab({
      title: `Live: ${campaignName}`,
      path,
      content: resolveRouteContent(path, 'Live Session'),
    });
  }

  const isActive = campaignStatus === 'active';
  const statusLabel = campaignStatus.charAt(0).toUpperCase() + campaignStatus.slice(1);

  return (
    <div className={`group rounded-lg border bg-card p-5 tavern-card texture-leather transition-all duration-200 hover:border-gold hover:shadow-glow hover-lift ${
      activeSession ? 'border-[hsl(150,50%,40%)] border-l-4' : 'border-border'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-[Cinzel] font-semibold text-card-foreground">{campaignName}</h3>
          {campaignDescription && (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{campaignDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider ${
            role === 'co_dm' ? 'bg-brass/20 text-brass' : 'bg-forest/15 text-[hsl(150,50%,55%)]'
          }`}>
            {role === 'co_dm' ? 'Co-DM' : 'Player'}
          </span>
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider ${
            isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* My Character */}
      {myCharacter && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onViewCharacter?.(myCharacter)}
            className="flex w-full items-center gap-3 rounded-md bg-background/40 p-3 text-left transition-colors hover:bg-background/60"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-blood/60 bg-blood/90 font-[Cinzel] text-xs font-bold text-parchment shadow-lg">
              {myCharacter.level}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[Cinzel] text-sm font-medium text-foreground">{myCharacter.name}</p>
              <p className="text-xs text-muted-foreground">
                {[myCharacter.race, myCharacter.class].filter(Boolean).join(' ') || 'Adventurer'}
              </p>
            </div>
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>

        {activeSession && (
          <Button size="sm" onClick={handleJoinSession} className="shadow-glow">
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Join Session
          </Button>
        )}
      </div>
    </div>
  );
}
