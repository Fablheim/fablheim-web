import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/hooks/useCampaigns';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useEndCombat, useInitiative, useNextTurn } from '@/hooks/useLiveSession';
import { useCampaignStage } from '@/hooks/useCampaignStage';
import { useBattleMap } from '@/hooks/useBattleMap';
import { useSessionRoom } from '@/hooks/useSocket';
import { useCombatSync } from '@/hooks/useCombatSync';
import { Button } from '@/components/ui/Button';
import { MapTab } from '@/components/session/MapTab';
import { ChatPanel } from '@/components/session/ChatPanel';
import DMMainContent from '@/components/session/DMMainContent';
import PlayerSidebarV2 from '@/components/session/PlayerSidebarV2';
import DiceRollerToast from '@/components/session/DiceRollerToast';
import DiceRoller from '@/components/session/DiceRoller';
import { EventsFeed } from '@/components/session/EventsFeed';
import { BottomDrawer } from '@/components/session/BottomDrawer';
import SessionWorkspaceShell from '@/components/session/SessionWorkspaceShell';
import { QuickActionBar } from '@/components/session/QuickActionBar';
import {
  SessionWorkspaceStateProvider,
  useSessionWorkspaceState,
} from '@/components/session/SessionWorkspaceState';
import { FocusCard } from '@/components/session/FocusCard';

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

  const [desyncDismissed, setDesyncDismissed] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionEndedCountdown, setSessionEndedCountdown] = useState<number | null>(null);
  const prevStageRef = useRef(campaign?.stage);

  const { endSession } = useCampaignStage(campaignId);

  // Reset desync dismissed when a new desync occurs
  useEffect(() => {
    if (desynced) setDesyncDismissed(false);
  }, [desynced]);

  // Detect when session ends (stage transitions from live -> non-live)
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
    <SessionWorkspaceStateProvider initiative={initiative}>
      <SessionWorkspaceContent
        campaignId={campaignId}
        campaignName={campaignName}
        isDM={!!isDM}
        connected={connected}
        connectedUsers={connectedUsers || []}
        desynced={desynced}
        desyncDismissed={desyncDismissed}
        dismissDesync={() => {
          dismissDesync();
          setDesyncDismissed(true);
        }}
        initiative={initiative}
        battleMap={battleMap}
        onLeave={() => navigate(`/app/campaigns/${campaignId}`)}
        onOpenEndConfirm={() => setShowEndConfirm(true)}
      />

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
    </SessionWorkspaceStateProvider>
  );
}

function SessionWorkspaceContent({
  campaignId,
  campaignName,
  isDM,
  connected,
  connectedUsers,
  desynced,
  desyncDismissed,
  dismissDesync,
  initiative,
  battleMap,
  onLeave,
  onOpenEndConfirm,
}: {
  campaignId: string;
  campaignName: string;
  isDM: boolean;
  connected: boolean;
  connectedUsers: Array<{ userId: string; username: string; socketId: string; role: 'dm' | 'player'; connectedAt: string; lastActivity: string }>;
  desynced: boolean;
  desyncDismissed: boolean;
  dismissDesync: () => void;
  initiative: ReturnType<typeof useInitiative>['data'];
  battleMap: ReturnType<typeof useBattleMap>['data'];
  onLeave: () => void;
  onOpenEndConfirm: () => void;
}) {
  const {
    selectedEntryId,
    focusedEntryId,
    selectEntry,
  } = useSessionWorkspaceState();

  const nextTurn = useNextTurn(campaignId);
  const endCombat = useEndCombat(campaignId);

  const isCombatActive = !!initiative?.isActive;
  const hasTacticalMap = !!(
    battleMap?.isActive ||
    (battleMap?.tokens?.length ?? 0) > 0 ||
    !!battleMap?.backgroundImageUrl
  );

  const focusedEntry = focusedEntryId
    ? initiative?.entries.find((entry) => entry.id === focusedEntryId) ?? null
    : null;
  const activeTurnEntry =
    initiative?.isActive && initiative.entries[initiative.currentTurn]
      ? initiative.entries[initiative.currentTurn]
      : null;
  const entryToDisplay = focusedEntry ?? activeTurnEntry;
  const initiativeOrder = initiative ? [...initiative.entries] : [];

  useEffect(() => {
    if (!selectedEntryId || !initiative) return;
    const exists = initiative.entries.some((entry) => entry.id === selectedEntryId);
    if (!exists) {
      selectEntry(null, { pin: true });
    }
  }, [initiative, selectedEntryId, selectEntry]);

  const header = (
    <>
      <header className="session-top-bar flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-[hsla(38,50%,40%,0.22)] px-4">
        <div className="session-top-brand flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-[Cinzel] uppercase tracking-[0.12em] text-muted-foreground">Live Session</p>
            <h1 className="truncate font-[Cinzel] text-base font-semibold text-foreground text-embossed">
              {campaignName}
            </h1>
          </div>
          <div className="flex items-center gap-1.5" title={connected ? 'Connected' : 'Reconnecting...'}>
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            {!connected && (
              <span className="text-[10px] text-yellow-500">Reconnecting...</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDM ? (
            <Button variant="destructive" size="sm" onClick={onOpenEndConfirm}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              End Session
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onLeave}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Leave
            </Button>
          )}
        </div>
      </header>

      {desynced && !desyncDismissed && (
        <div className="flex shrink-0 items-center justify-between border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="font-[Cinzel] text-xs font-medium text-foreground">Session out of sync</span>
            <span className="text-[10px] text-muted-foreground">Your view may not match other participants.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Reload
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissDesync}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {isCombatActive && (
        <div className="flex items-center gap-2 border-b border-[hsla(38,50%,40%,0.22)] px-4 py-2">
          <span className="shrink-0 text-[10px] font-[Cinzel] uppercase tracking-[0.12em] text-muted-foreground">
            Round {initiative?.round ?? '-'}
          </span>
          <div className="min-w-0 flex flex-1 items-center gap-1 overflow-x-auto pb-0.5">
            {initiativeOrder.map((entry) => {
              const isCurrent = activeTurnEntry?.id === entry.id;
              const isFocused = focusedEntryId === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectEntry(entry.id, { pin: true })}
                  className={`inline-flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-[10px] ${
                    isCurrent
                      ? 'border-primary/60 bg-primary/20 text-primary'
                      : isFocused
                        ? 'border-blue-400/60 bg-blue-500/15 text-blue-300'
                        : 'border-border/60 bg-card/60 text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-background/60 text-[9px] font-semibold">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{entry.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  const leftPanel = isDM ? (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="rounded border border-border/60 bg-background/30 p-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Round</p>
        <p className="text-sm font-semibold text-foreground">{initiative?.isActive ? initiative.round : '-'}</p>
      </div>

      <div className="rounded border border-border/60 bg-background/30 p-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Turn</p>
        <p className="truncate text-sm font-semibold text-foreground">
          {activeTurnEntry?.name ?? 'No active turn'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => nextTurn.mutate()}
          disabled={!isCombatActive || nextTurn.isPending}
        >
          Next Turn
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => endCombat.mutate()}
          disabled={!isCombatActive || endCombat.isPending}
        >
          End Combat
        </Button>
      </div>

      <QuickActionBar
        campaignId={campaignId}
        focusedEntry={entryToDisplay}
        onEndTurn={() => nextTurn.mutate()}
        onSpawnToken={() => {
          window.dispatchEvent(new CustomEvent('fablheim:spawn-token', {
            detail: {
              name: entryToDisplay?.name ?? 'Token',
              type: entryToDisplay?.type ?? 'other',
            },
          }));
        }}
        disableEndTurn={!isCombatActive || nextTurn.isPending}
        layout="vertical"
      />
    </div>
  ) : (
    <PlayerSidebarV2 campaignId={campaignId} />
  );

  const centerStage = hasTacticalMap ? (
    <MapTab
      campaignId={campaignId}
      isDM={isDM}
      onTokenSelect={(initiativeEntryId) => selectEntry(initiativeEntryId ?? null, { pin: true })}
      selectedEntryId={focusedEntryId}
    />
  ) : (
    isDM ? (
      <DMMainContent campaignId={campaignId} isDM={isDM} />
    ) : (
      <PlayerSidebarV2 campaignId={campaignId} />
    )
  );

  const drawer = (
    <BottomDrawer
      mapMode={hasTacticalMap}
      chat={<ChatPanel campaignId={campaignId} connectedUsers={connectedUsers} />}
      events={<EventsFeed campaignId={campaignId} />}
      dice={<div className="h-full overflow-y-auto p-2"><DiceRoller campaignId={campaignId} /></div>}
    />
  );

  const rightPanel = isDM ? (
    <div className="h-full min-h-0">
      <FocusCard campaignId={campaignId} isDM={isDM} entryOverride={entryToDisplay} />
    </div>
  ) : undefined;

  return (
    <>
      <SessionWorkspaceShell
        header={header}
        leftPanel={leftPanel}
        centerStage={centerStage}
        rightPanel={rightPanel}
        mapOverlay={hasTacticalMap ? <DiceRollerToast campaignId={campaignId} /> : undefined}
        bottomDrawer={drawer}
        defaultLeftOpen
        defaultRightOpen
        mapMode={hasTacticalMap}
      />
    </>
  );
}
