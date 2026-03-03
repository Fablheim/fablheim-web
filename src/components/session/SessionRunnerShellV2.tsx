import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/hooks/useCampaigns';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useInitiative } from '@/hooks/useLiveSession';
import { useCampaignStage } from '@/hooks/useCampaignStage';
import { useBattleMap } from '@/hooks/useBattleMap';
import { useSessionRoom } from '@/hooks/useSocket';
import { useCombatSync } from '@/hooks/useCombatSync';
import { Button } from '@/components/ui/Button';
import { MapTab } from '@/components/session/MapTab';
import { ChatPanel } from '@/components/session/ChatPanel';
import InitiativeBanner from '@/components/session/InitiativeBanner';
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import DMMainContent from '@/components/session/DMMainContent';
import DMSidebarV2 from '@/components/session/DMSidebarV2';
import PlayerSidebarV2 from '@/components/session/PlayerSidebarV2';
import DiceRollerToast from '@/components/session/DiceRollerToast';

function parseSessionParams(pathname: string): { campaignId: string } {
  const match = pathname.match(/\/campaigns\/([^/]+)\/session/);
  if (match) return { campaignId: match[1] };
  return { campaignId: '' };
}

export default function SessionRunnerShellV2() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { campaignId } = parseSessionParams(location.pathname);
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaign(campaignId);
  const { data: accessibleCampaigns } = useAccessibleCampaigns();
  const { connected, connectedUsers, desynced, dismissDesync } = useSessionRoom(campaignId);
  const { data: initiative } = useInitiative(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);
  useCombatSync(campaignId);

  const selectedCampaign = accessibleCampaigns?.find((c) => c._id === campaignId);
  const isDM = !!(campaign && user && campaign.dmId === user._id) || selectedCampaign?.role === 'co_dm';
  const isCombatActive = !!initiative?.isActive;
  const hasTacticalMap = !!battleMap?.backgroundImageUrl;

  const [leftOpen, setLeftOpen] = useState(() =>
    localStorage.getItem('fablheim:session-v2-left-open') !== '0',
  );
  const [rightOpen, setRightOpen] = useState(() =>
    localStorage.getItem('fablheim:session-v2-right-open') !== '0',
  );
  const [desyncDismissed, setDesyncDismissed] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionEndedCountdown, setSessionEndedCountdown] = useState<number | null>(null);
  const prevStageRef = useRef(campaign?.stage);

  const { endSession } = useCampaignStage(campaignId);

  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-left-open', leftOpen ? '1' : '0');
  }, [leftOpen]);

  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-right-open', rightOpen ? '1' : '0');
  }, [rightOpen]);

  // Reset desync dismissed when a new desync occurs
  useEffect(() => {
    if (desynced) setDesyncDismissed(false);
  }, [desynced]);

  // Detect when session ends (stage transitions from live → non-live)
  useEffect(() => {
    const prev = prevStageRef.current;
    prevStageRef.current = campaign?.stage;
    if (prev === 'live' && campaign?.stage && campaign.stage !== 'live') {
      setSessionEndedCountdown(10);
    }
  }, [campaign?.stage]);

  // Countdown timer
  useEffect(() => {
    if (sessionEndedCountdown === null || sessionEndedCountdown <= 0) return;
    const timer = setTimeout(() => {
      setSessionEndedCountdown((v) => (v !== null ? v - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [sessionEndedCountdown]);

  // Auto-redirect when countdown reaches 0
  useEffect(() => {
    if (sessionEndedCountdown === 0) {
      navigate(`/app/campaigns/${campaignId}`);
    }
  }, [sessionEndedCountdown, campaignId, navigate]);

  const campaignName = useMemo(() => campaign?.name ?? 'Live Session', [campaign?.name]);

  async function handleEndSession() {
    try {
      await endSession.mutateAsync(undefined);
      toast.success('Session ended');
      navigate(`/app/campaigns/${campaignId}`);
    } catch {
      toast.error('Failed to end session');
    }
  }

  if (!campaignId) return null;

  // Loading state
  if (campaignLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="font-['IM_Fell_English'] text-sm italic text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignError || !campaign) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md px-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 font-[Cinzel] text-xl font-semibold text-foreground">Unable to Load Session</h2>
          <p className="mb-4 font-['IM_Fell_English'] text-sm italic text-muted-foreground">
            Campaign not found or you don't have permission to access it.
          </p>
          <Button variant="outline" onClick={() => navigate('/app/campaigns')}>
            Return to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  // Session not active (player trying to join before DM starts)
  if (!isDM && campaign.stage !== 'live') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="px-4 text-center">
          <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-[Cinzel] text-xl font-semibold text-foreground">Session Not Active</h2>
          <p className="mb-4 font-['IM_Fell_English'] text-sm italic text-muted-foreground">
            The DM hasn't started the session yet. Check back soon!
          </p>
          <Button variant="outline" onClick={() => navigate(`/app/campaigns/${campaignId}`)}>
            Back to Campaign
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="session-top-bar flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-[hsla(38,50%,40%,0.22)] px-4">
        <div className="session-top-brand flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-[Cinzel] uppercase tracking-[0.12em] text-muted-foreground">Live Session</p>
            <h1 className="truncate font-[Cinzel] text-base font-semibold text-foreground text-embossed">
              {campaignName}
            </h1>
          </div>
          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5" title={connected ? 'Connected' : 'Reconnecting...'}>
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            {!connected && (
              <span className="text-[10px] text-yellow-500">Reconnecting...</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTacticalMap && (
            <>
              <Button variant="outline" onClick={() => setLeftOpen((prev) => !prev)}>
                {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Tools</span>
              </Button>
              <Button variant="outline" onClick={() => setRightOpen((prev) => !prev)}>
                {rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Chat</span>
              </Button>
            </>
          )}
          {isDM ? (
            <Button variant="destructive" size="sm" onClick={() => setShowEndConfirm(true)}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              End Session
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate(`/app/campaigns/${campaignId}`)}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Leave
            </Button>
          )}
        </div>
      </header>

      {/* Desync warning banner */}
      {desynced && !desyncDismissed && (
        <div className="flex shrink-0 items-center justify-between border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="font-[Cinzel] text-xs font-medium text-foreground">Session out of sync</span>
            <span className="text-[10px] text-muted-foreground">Your view may not match other participants.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Reload
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                dismissDesync();
                setDesyncDismissed(true);
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {isCombatActive && (
        <InitiativeBanner campaignId={campaignId} isDM={!!isDM} />
      )}

      {hasTacticalMap ? (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {leftOpen && (
            <aside className="h-full w-[280px] flex-shrink-0 border-r border-border/70 bg-card/70">
              {isDM ? (
                <DMSidebarV2 campaignId={campaignId} isDM={!!isDM} />
              ) : (
                <PlayerSidebarV2 campaignId={campaignId} />
              )}
            </aside>
          )}

          <main className="relative min-h-0 flex-1 overflow-hidden">
            <MapTab campaignId={campaignId} isDM={!!isDM} />
          </main>

          {rightOpen && (
            <aside className="h-full w-[320px] flex-shrink-0 border-l border-border/70 bg-card/70">
              <ChatPanel campaignId={campaignId} connectedUsers={connectedUsers || []} />
            </aside>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="min-h-0 flex-1 overflow-hidden">
            {isDM ? (
              <DMMainContent campaignId={campaignId} isDM={!!isDM} />
            ) : (
              <div className="flex h-full min-h-0 overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <PlayerSidebarV2 campaignId={campaignId} />
                </div>
                {isCombatActive && (
                  <div className="h-full w-[320px] flex-shrink-0 border-l border-border/70 overflow-y-auto">
                    <InitiativeTracker campaignId={campaignId} isDM={false} />
                  </div>
                )}
              </div>
            )}
          </main>

          <aside className="h-full w-[25%] min-w-[320px] max-w-[400px] flex-shrink-0 border-l border-border/70 bg-card/70">
            <ChatPanel campaignId={campaignId} connectedUsers={connectedUsers || []} />
          </aside>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50">
        {hasTacticalMap && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setRightOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg hover:text-foreground"
              aria-label="Toggle chat sidebar"
              title="Toggle chat"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        )}
        <DiceRollerToast campaignId={campaignId} />
      </div>

      {sessionEndedCountdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="px-4 text-center">
            <LogOut className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="mb-2 font-[Cinzel] text-xl font-semibold text-foreground">Session Ended</h2>
            <p className="mb-4 font-['IM_Fell_English'] text-sm italic text-muted-foreground">
              {isDM ? 'The session has been ended.' : 'The DM has ended the session.'}
            </p>
            {sessionEndedCountdown > 0 && (
              <p className="mb-4 text-xs text-muted-foreground">
                Redirecting in {sessionEndedCountdown}s...
              </p>
            )}
            <Button variant="outline" onClick={() => navigate(`/app/campaigns/${campaignId}`)}>
              Leave Now
            </Button>
          </div>
        </div>
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-lg border border-border border-t-2 border-t-destructive/50 bg-card p-6 shadow-warm-lg">
            <h3 className="mb-2 font-[Cinzel] text-base font-semibold text-foreground uppercase tracking-wider">
              End Session?
            </h3>
            <p className="mb-5 font-['IM_Fell_English'] text-sm italic text-muted-foreground">
              This will end the live session for all participants and move the campaign to recap.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowEndConfirm(false)} disabled={endSession.isPending}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleEndSession} disabled={endSession.isPending}>
                {endSession.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
