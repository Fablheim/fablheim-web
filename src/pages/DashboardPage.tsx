import { Crown, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useMyCharacters } from '@/hooks/useCharacters';
import { useMyCampaignMemberships } from '@/hooks/useCampaignMembers';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { PlayerCampaignCard } from '@/components/player/PlayerCampaignCard';
import type { Character } from '@/types/campaign';

export function DashboardPage() {
  const { user } = useAuth();
  const { openTab } = useTabs();

  const { data: dmCampaigns, isLoading: dmLoading } = useCampaigns();
  const { data: memberships, isLoading: membershipsLoading } = useMyCampaignMemberships();
  const { data: myCharacters, isLoading: charsLoading } = useMyCharacters();

  if (!user) return null;

  const isLoading = dmLoading || membershipsLoading || charsLoading;
  const hasDMCampaigns = dmCampaigns && dmCampaigns.length > 0;
  const hasPlayerCampaigns = memberships && memberships.length > 0;
  const hasAnyCampaigns = hasDMCampaigns || hasPlayerCampaigns;
  const hasCharacters = myCharacters && myCharacters.length > 0;

  function handleViewCharacter(char: Character) {
    const path = `/app/characters/${char._id}`;
    openTab({ title: char.name, path, content: resolveRouteContent(path, char.name) });
  }

  function handleNavigate(path: string, title: string) {
    openTab({ title, path, content: resolveRouteContent(path, title) });
  }

  return (
    <PageContainer title="Dashboard" subtitle={`Welcome back, ${user.displayName}`}>
      <div className="space-y-8 animate-unfurl">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* No campaigns at all */}
        {!isLoading && !hasAnyCampaigns && (
          <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
            <div className="mx-auto max-w-sm">
              <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
                Your Adventure Awaits
              </h3>
              <p className="mb-6 text-muted-foreground">
                Create a campaign to begin your journey, or ask your Game Master for an invite code
              </p>
              <Button onClick={() => handleNavigate('/app/campaigns', 'Campaigns')} className="shadow-glow">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </div>
        )}

        {!isLoading && hasAnyCampaigns && (
          <>
            {/* ── My Characters ────────────────────────────── */}
            {hasCharacters && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-[Cinzel] text-sm uppercase tracking-wider text-muted-foreground">
                    My Characters
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/app/characters', 'Characters')}
                    className="font-[Cinzel] text-[10px] uppercase tracking-wider text-brass transition-colors hover:text-primary"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {myCharacters!.map((char) => {
                    const classRace = [char.race, char.class].filter(Boolean).join(' ') || 'Adventurer';
                    return (
                      <button
                        key={char._id}
                        type="button"
                        onClick={() => handleViewCharacter(char)}
                        className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left tavern-card texture-leather transition-all duration-200 hover:border-gold hover:shadow-glow hover-lift"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-blood/60 bg-blood/90 font-[Cinzel] text-xs font-bold text-parchment shadow-lg">
                          {char.level}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-[Cinzel] font-semibold text-card-foreground">{char.name}</p>
                          <p className="text-xs text-muted-foreground">{classRace}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Adventuring In (Player Campaigns) ──────── */}
            {hasPlayerCampaigns && (
              <section>
                <h2 className="mb-4 font-[Cinzel] text-sm uppercase tracking-wider text-muted-foreground">
                  Adventuring In
                </h2>
                <div className="space-y-3">
                  {memberships!.map((m) => (
                    <PlayerCampaignCard
                      key={m._id}
                      campaignId={m.campaignId._id}
                      campaignName={m.campaignId.name}
                      campaignDescription={m.campaignId.description}
                      campaignStatus={m.campaignId.status}
                      role={m.role}
                      onViewCharacter={handleViewCharacter}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Game Mastering (DM Campaigns) ──────────── */}
            {hasDMCampaigns && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-[Cinzel] text-sm uppercase tracking-wider text-muted-foreground">
                    Game Mastering
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/app/campaigns', 'Campaigns')}
                    className="font-[Cinzel] text-[10px] uppercase tracking-wider text-brass transition-colors hover:text-primary"
                  >
                    Manage
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {dmCampaigns!.map((campaign) => (
                    <button
                      key={campaign._id}
                      type="button"
                      onClick={() => handleNavigate(`/app/campaigns/${campaign._id}`, campaign.name)}
                      className="group rounded-lg border border-border bg-card p-4 text-left tavern-card texture-parchment transition-all duration-200 hover:border-gold hover:shadow-glow hover-lift"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-[Cinzel] font-semibold text-card-foreground">{campaign.name}</h3>
                          {campaign.description && (
                            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{campaign.description}</p>
                          )}
                        </div>
                        <Crown className="ml-2 h-4 w-4 shrink-0 text-brass" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-primary">
                          {campaign.status}
                        </span>
                        {campaign.setting && (
                          <span className="text-xs text-muted-foreground">{campaign.setting}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ── Account ────────────────────────────────── */}
            <section>
              <h2 className="mb-4 font-[Cinzel] text-sm uppercase tracking-wider text-muted-foreground">
                Account
              </h2>
              <div className="rounded-lg border border-border bg-card p-5 tavern-card texture-parchment">
                <div className="flex items-center gap-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="h-12 w-12 rounded-full border-2 border-gold object-cover shadow-glow"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold bg-primary/15 text-lg font-bold text-primary shadow-glow">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{user.displayName}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                      {user.subscriptionTier}
                    </p>
                    {user.aiUsage.enabled && (
                      <p className="text-xs text-muted-foreground">
                        {user.aiUsage.callsThisMonth} AI calls
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

    </PageContainer>
  );
}
