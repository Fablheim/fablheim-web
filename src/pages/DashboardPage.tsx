import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Library, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useMyCharacters } from '@/hooks/useCharacters';
import { useMyCampaignMemberships } from '@/hooks/useCampaignMembers';
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser';
import { Button } from '@/components/ui/Button';
import { AppEmptyState } from '@/components/app/AppEmptyState';
import { WelcomeTour } from '@/components/onboarding/WelcomeTour';
import { GMChecklist } from '@/components/onboarding/GMChecklist';
import { LiveSessionAlert } from '@/components/dashboard/LiveSessionAlert';
import { CampaignCardGrid } from '@/components/dashboard/CampaignCardGrid';
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

  const { data: dmCampaigns, isLoading: dmLoading, error: dmError } = useCampaigns();
  const { data: memberships, isLoading: membershipsLoading, error: membershipsError } = useMyCampaignMemberships();
  const { data: myCharacters, isLoading: charsLoading, error: charsError } = useMyCharacters();

  const playerMemberships = useMemo(() => {
    if (!memberships) return [];
    const dmIds = new Set(dmCampaigns?.map((c) => c._id) ?? []);
    return memberships.filter((m) => !dmIds.has(m.campaignId._id));
  }, [memberships, dmCampaigns]);

  const liveCampaign = useMemo(() => {
    return dmCampaigns?.find((c) => c.stage === 'live') ?? null;
  }, [dmCampaigns]);

  useEffect(() => {
    if (dmCampaigns && dmCampaigns.length > 0) completeStep('create-campaign');
    if (myCharacters && myCharacters.length > 0) completeStep('create-character');
  }, [dmCampaigns, myCharacters, completeStep]);

  if (!user) return null;

  const isLoading = dmLoading || membershipsLoading || charsLoading;
  const hasError = !!(dmError || membershipsError || charsError);
  const hasCharacters = !!(myCharacters && myCharacters.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 animate-unfurl">
      {renderHeader()}
      {showChecklist && !isLoading && (
        <GMChecklist completedSteps={completedSteps} onDismiss={dismissChecklist} />
      )}
      {renderLiveAlert()}
      {renderCampaigns()}
      {!isLoading && !hasError && renderCharacterRoster()}
      {renderTools()}
      {isFirstTime && <WelcomeTour onComplete={completeTour} />}
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Command Center
          </p>
          <h1
            className="text-2xl text-[hsl(35,24%,92%)]"
            style={{ fontFamily: "'IM Fell English', 'Cinzel', serif" }}
          >
            Command Hall
          </h1>
          <p className="mt-0.5 text-[13px] text-[hsl(30,12%,58%)]">
            Welcome back, {user!.username}.
          </p>
        </div>
        <Button
          onClick={() => navigate('/app/campaigns')}
          className="shimmer-gold self-start sm:self-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New Campaign
        </Button>
      </div>
    );
  }

  function renderLiveAlert() {
    if (!liveCampaign) return null;
    return (
      <LiveSessionAlert
        campaign={liveCampaign}
        onResume={() => navigate(`/app/campaigns/${liveCampaign._id}/session`)}
      />
    );
  }

  function renderCampaigns() {
    return (
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2
            className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Your Campaigns
          </h2>
        </div>
        <CampaignCardGrid
          dmCampaigns={dmCampaigns}
          playerMemberships={playerMemberships}
          characters={myCharacters ?? []}
          isLoading={isLoading}
          error={hasError}
          onNavigate={(path) => navigate(path)}
        />
      </section>
    );
  }

  function renderCharacterRoster() {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Characters
          </h2>
          <button
            type="button"
            onClick={() => navigate('/app/characters')}
            className="text-[11px] text-[hsl(38,82%,63%)] hover:text-[hsl(38,90%,70%)]"
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {myCharacters!.slice(0, 8).map((char) => renderCharacterCard(char))}
      </div>
    );
  }

  function renderCharacterCard(char: Character) {
    return (
      <button
        key={char._id}
        type="button"
        onClick={() => navigate(`/app/characters/${char._id}`, { state: { from: '/app' } })}
        className="group flex items-center gap-2.5 rounded-lg border border-[hsla(32,26%,26%,0.5)] bg-[hsl(24,14%,11%)] px-3 py-2.5 text-left transition-colors hover:border-[hsla(32,26%,26%,0.75)] hover:bg-[hsl(24,20%,13%)]"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[hsl(0,55%,28%)]/50 bg-[hsl(0,55%,28%)]/20 text-[11px] font-bold text-[hsl(35,24%,92%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {char.level}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">{char.name}</p>
          <p className="truncate text-[11px] text-[hsl(30,12%,58%)]">
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

  function renderTools() {
    return (
      <section>
        <h2
          className="mb-3 text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Tools
        </h2>
        <div className="flex flex-wrap gap-2">
          <ToolButton
            icon={Plus}
            label="Create Campaign"
            onClick={() => navigate('/app/campaigns')}
          />
          <ToolButton
            icon={Users}
            label="Character Roster"
            onClick={() => navigate('/app/characters')}
          />
          <ToolButton
            icon={Library}
            label="Rules Compendium"
            onClick={() => navigate('/app/rules')}
          />
          <ToolButton
            icon={BookOpen}
            label="Enemy Library"
            onClick={() => navigate('/app/enemies')}
          />
        </div>
      </section>
    );
  }
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-[hsla(32,26%,26%,0.4)] bg-[hsl(24,14%,11%)] px-3 py-2 text-[12px] text-[hsl(30,12%,58%)] transition-colors hover:border-[hsla(32,26%,26%,0.7)] hover:bg-[hsl(24,20%,13%)] hover:text-[hsl(35,24%,92%)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
