import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import DiceRoller from '@/components/session/DiceRoller';
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import { CharacterStatusPanel } from '@/components/session/CharacterStatusPanel';
import { useSessionRoom } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api/client';
import type { Campaign } from '@/types/campaign';

interface LiveSessionPageProps {
  campaignId: string;
}

export function LiveSessionPage({ campaignId }: LiveSessionPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected, connectedUsers, joined, error } = useSessionRoom(campaignId);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const isDM = !!(campaign && user && campaign.dmId === user._id);

  // Fetch campaign data
  useEffect(() => {
    let cancelled = false;

    async function fetchCampaign() {
      try {
        const res = await api.get<Campaign>(`/campaigns/${campaignId}`);
        if (!cancelled) {
          setCampaign(res.data);
          setCampaignError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCampaignError(
            err instanceof Error ? err.message : 'Failed to load campaign',
          );
        }
      } finally {
        if (!cancelled) setCampaignLoading(false);
      }
    }

    fetchCampaign();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  function handleLeaveSession() {
    navigate(`/app/campaigns/${campaignId}`);
  }

  // Loading state
  if (campaignLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-['IM_Fell_English']">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignError || !campaign) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="tavern-card texture-parchment iron-brackets rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <p className="font-medium text-destructive font-['IM_Fell_English'] text-lg">Failed to load session</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaignError ?? 'Campaign not found'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/app/campaigns')}
            className="mt-4 rounded-md border border-iron bg-accent px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/80 transition-all font-[Cinzel]"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  // Join error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="tavern-card texture-parchment iron-brackets rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <p className="font-medium text-destructive font-['IM_Fell_English'] text-lg">
            Failed to join session
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => navigate(`/app/campaigns/${campaignId}`)}
            className="mt-4 rounded-md border border-iron bg-accent px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/80 transition-all font-[Cinzel]"
          >
            Back to Campaign
          </button>
        </div>
      </div>
    );
  }

  // Connecting state
  if (!joined) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-['IM_Fell_English']">
            Joining session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-[hsla(38,50%,40%,0.2)] shadow-[0_2px_10px_hsla(38,80%,50%,0.06)] texture-wood bg-card px-4 py-3 shadow-warm">
        <div className="flex items-center gap-4">
          {/* Campaign name */}
          <h1 className="font-semibold text-foreground font-[Cinzel] text-embossed">
            {campaign.name}
          </h1>

          {/* Connection indicator */}
          <div className="flex items-center gap-2">
            <span
              className={
                connected
                  ? 'h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] pulse-warm'
                  : 'h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse'
              }
            />
            <span className="text-sm text-muted-foreground">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connected users */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <div className="flex -space-x-1">
              {connectedUsers.slice(0, 5).map((u) => (
                <div
                  key={u.userId}
                  title={`${u.username} (${u.role === 'dm' ? 'GM' : 'Player'})`}
                  className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary border border-gold/30"
                >
                  {u.username.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span>
              {connectedUsers.length} Connected
            </span>
          </div>

          {/* Leave session button */}
          <button
            type="button"
            onClick={handleLeaveSession}
            className="rounded-md border-iron bg-accent px-3 py-1.5 text-sm text-muted-foreground hover:bg-blood/15 hover:text-[hsl(0,55%,55%)] hover:border-blood/40 transition-all border font-[Cinzel] text-xs uppercase tracking-wider"
          >
            Leave Session
          </button>
        </div>
      </header>

      {/* Connected users bar (visible on larger screens) */}
      <div className="border-b border-border texture-leather bg-card/40 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {connectedUsers.map((u) => (
            <div key={u.userId} className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary border border-gold/30">
                {u.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-foreground">{u.username}</span>
              {u.role === 'dm' ? (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-[Cinzel] font-medium text-primary uppercase tracking-wider">
                  GM
                </span>
              ) : (
                <span className="rounded-full bg-iron/20 px-2 py-0.5 text-xs font-[Cinzel] text-muted-foreground uppercase tracking-wider">
                  Player
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left panel: Initiative Tracker */}
        <div className="w-full lg:w-[35%] border-b lg:border-b-0 lg:border-r border-[hsla(38,40%,30%,0.15)] overflow-y-auto p-4 texture-parchment">
          <InitiativeTracker campaignId={campaignId} isDM={isDM} />
        </div>

        {/* Right panel: Character Status + Dice Roller */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4 texture-parchment">
          <CharacterStatusPanel campaignId={campaignId} isDM={isDM} />
          <DiceRoller campaignId={campaignId} />
        </div>
      </div>
    </div>
  );
}
