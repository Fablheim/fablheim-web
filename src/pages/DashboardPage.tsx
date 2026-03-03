import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Plus, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useMyCharacters } from '@/hooks/useCharacters';
import { useMyCampaignMemberships } from '@/hooks/useCampaignMembers';
import { useCreditBalance } from '@/hooks/useCredits';
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser';
import { Button } from '@/components/ui/Button';
import { AppEmptyState } from '@/components/app/AppEmptyState';
import { WelcomeTour } from '@/components/onboarding/WelcomeTour';
import { GMChecklist } from '@/components/onboarding/GMChecklist';
import { LiveSessionAlert } from '@/components/dashboard/LiveSessionAlert';
import { CampaignCardGrid } from '@/components/dashboard/CampaignCardGrid';
import { QuickAccessBar } from '@/components/dashboard/QuickAccessBar';
import type { Character } from '@/types/campaign';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isFirstTime,
    showChecklist,
    completedSteps,
    completeTour,
    dismissChecklist,
    completeStep,
  } = useFirstTimeUser();

  // ── Data fetching ────────────────────────────────────────
  const { data: dmCampaigns, isLoading: dmLoading, error: dmError } = useCampaigns();
  const { data: memberships, isLoading: membershipsLoading, error: membershipsError } = useMyCampaignMemberships();
  const { data: myCharacters, isLoading: charsLoading, error: charsError } = useMyCharacters();
  const { data: creditBalance } = useCreditBalance();

  // ── Player memberships (excluding DM-owned) ──────────────
  const playerMemberships = useMemo(() => {
    if (!memberships) return [];
    const dmIds = new Set(dmCampaigns?.map((c) => c._id) ?? []);
    return memberships.filter((m) => !dmIds.has(m.campaignId._id));
  }, [memberships, dmCampaigns]);

  // ── Live campaign detection ──────────────────────────────
  const liveCampaign = useMemo(() => {
    return dmCampaigns?.find((c) => c.stage === 'live') ?? null;
  }, [dmCampaigns]);

  // ── Onboarding step tracking ─────────────────────────────
  useEffect(() => {
    if (dmCampaigns && dmCampaigns.length > 0) completeStep('create-campaign');
    if (myCharacters && myCharacters.length > 0) completeStep('create-character');
  }, [dmCampaigns, myCharacters, completeStep]);

  if (!user) return null;

  const isLoading = dmLoading || membershipsLoading || charsLoading;
  const hasError = !!(dmError || membershipsError || charsError);
  const isPaidUser = user.subscriptionTier !== 'free';
  const hasCharacters = !!(myCharacters && myCharacters.length > 0);

  function getSessionPath(campaignId: string): string {
    return `/app/campaigns/${campaignId}/session`;
  }

  return (
    <div className="mkt-section mkt-hero-stage mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 animate-unfurl">
      {renderGreeting()}
      {showChecklist && !isLoading && (
        <GMChecklist completedSteps={completedSteps} onDismiss={dismissChecklist} />
      )}
      {renderCreditsWarning()}
      {renderLiveAlert()}
      {renderQuickAccess()}
      <CampaignCardGrid
        dmCampaigns={dmCampaigns}
        playerMemberships={playerMemberships}
        characters={myCharacters ?? []}
        isLoading={isLoading}
        error={hasError}
        onNavigate={(path) => navigate(path)}
      />
      {!isLoading && !hasError && renderCharacterRoster()}
      {isFirstTime && <WelcomeTour onComplete={completeTour} />}
    </div>
  );

  // ── Render helpers ───────────────────────────────────────

  function renderGreeting() {
    return (
      <div className="mkt-card mkt-card-mounted border-medieval rounded-xl px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mkt-chip mb-2 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Command Center
          </p>
          <h1 className="font-[Cinzel] text-3xl font-semibold text-[color:var(--mkt-text)]">
            Command Hall
          </h1>
          <p className="text-base text-[color:var(--mkt-muted)]">
            Welcome back, {user!.username}.
          </p>
        </div>
        <Button onClick={() => navigate('/app/campaigns')} className="shimmer-gold">
          <Plus className="mr-1.5 h-4 w-4" />
          New Campaign
        </Button>
      </div>
      </div>
    );
  }

  function renderCreditsWarning() {
    if (!creditBalance || !isPaidUser || creditBalance.total >= 10) return null;
    return (
      <div className="mkt-card rounded-lg border border-brass/35 px-3 py-2.5 text-sm text-brass">
        <div className="flex items-center gap-3">
          <Coins className="h-4 w-4 shrink-0" />
          <span className="font-medium">Only {creditBalance.total} credits remaining</span>
          <span className="hidden text-xs text-muted-foreground md:inline">AI tools may pause when credits reach zero.</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/credits')}
          className="app-focus-ring ml-auto inline-flex items-center rounded-md border border-brass/40 bg-brass/12 px-3 py-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider hover:bg-brass/20 hover:text-primary"
        >
          Top up
        </button>
      </div>
    );
  }

  function renderLiveAlert() {
    if (!liveCampaign) return null;
    return (
      <LiveSessionAlert
        campaign={liveCampaign}
        onResume={() => navigate(getSessionPath(liveCampaign._id))}
      />
    );
  }

  function renderQuickAccess() {
    if (isLoading || hasError) return null;
    const recentCampaigns = dmCampaigns?.slice(0, 3) ?? [];
    return (
      <QuickAccessBar
        recentCampaigns={recentCampaigns}
        onNavigate={(path) => navigate(path)}
      />
    );
  }

  function renderCharacterRoster() {
    return (
      <section className="mkt-card rounded-xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[Cinzel] text-sm font-semibold uppercase tracking-widest text-[color:var(--mkt-muted)]">
            Your Characters
          </h2>
          <button
            type="button"
            onClick={() => navigate('/app/characters')}
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Open roster
          </button>
        </div>
        {hasCharacters ? renderCharacterGrid() : renderCharacterEmpty()}
      </section>
    );
  }

  function renderCharacterGrid() {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {myCharacters!.slice(0, 8).map((char) => renderCharacterCard(char))}
      </div>
    );
  }

  function renderCharacterCard(char: Character) {
    return (
      <button
        key={char._id}
        type="button"
        onClick={() => navigate(`/app/characters/${char._id}`)}
        className="mkt-card mkt-card-mounted flex items-center gap-3 rounded-md px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--mkt-accent)]/45"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blood/60 bg-blood/80 font-[Cinzel] text-xs font-bold text-parchment">
          {char.level}
        </div>
        <div className="min-w-0">
          <p className="truncate font-[Cinzel] text-sm font-semibold text-foreground">{char.name}</p>
          <p className="truncate text-xs text-[color:var(--mkt-muted)]">
            {[char.race, char.class].filter(Boolean).join(' ') || 'Adventurer'}
          </p>
        </div>
      </button>
    );
  }

  function renderCharacterEmpty() {
    return (
      <AppEmptyState
        icon={Users}
        title="No characters yet"
        reason="Create character sheets so your party is ready for session night."
        className="p-6"
        primaryAction={
          <Button size="sm" onClick={() => navigate('/app/characters')}>
            Create Character
          </Button>
        }
      />
    );
  }
}
