import { useEffect, useMemo, useState } from 'react';
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
import { useInitiative, useNextTurn } from '@/hooks/useLiveSession';
import { useCampaignStage } from '@/hooks/useCampaignStage';
import { useBattleMap } from '@/hooks/useBattleMap';
import { useSessionRoom } from '@/hooks/useSocket';
import { useCombatSync } from '@/hooks/useCombatSync';
import { useSessionLifecycle } from '@/hooks/useSessionLifecycle';
import { useSessionSocketEvents } from '@/hooks/useSessionSocketEvents';
import { Button } from '@/components/ui/Button';
import { MapTab } from '@/components/session/MapTab';
import { ChatPanel } from '@/components/session/ChatPanel';
import DMMainContent from '@/components/session/DMMainContent';
import DMSidebarV2 from '@/components/session/DMSidebarV2';
import PlayerSidebarV2 from '@/components/session/PlayerSidebarV2';
import InitiativeBanner from '@/components/session/InitiativeBanner';
import DiceRollerToast from '@/components/session/DiceRollerToast';
import DiceRoller from '@/components/session/DiceRoller';
import { EventsFeed } from '@/components/session/EventsFeed';
import { BottomDrawer } from '@/components/session/BottomDrawer';
import { CampaignShell } from '@/components/shell/CampaignShell';
import { QuickActionBar } from '@/components/session/QuickActionBar';
import {
  SessionWorkspaceStateProvider,
  useSessionWorkspaceState,
} from '@/components/session/SessionWorkspaceState';
import { FocusCard } from '@/components/session/FocusCard';
import { RollRequestPrompt } from '@/components/session/RollRequestPrompt';

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
  const { connected, connectedUsers, desynced, dismissDesync, error: socketError } = useSessionRoom(campaignId);
  const { data: initiative } = useInitiative(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);
  useCombatSync(campaignId);

  const selectedCampaign = accessibleCampaigns?.find((c) => c._id === campaignId);
  const isDM = !!(campaign && user && campaign.dmId === user._id) || selectedCampaign?.role === 'co_dm';

  const [desyncDismissed, setDesyncDismissed] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const { endSession } = useCampaignStage(campaignId);
  const { sessionEndedCountdown, shouldRedirect } = useSessionLifecycle(campaignId);

  // Reset desync dismissed when a new desync occurs
  useEffect(() => {
    if (desynced) setDesyncDismissed(false);
  }, [desynced]);

  // Auto-redirect when countdown reaches 0
  useEffect(() => {
    if (shouldRedirect) {
      navigate(`/app/campaigns/${campaignId}`);
    }
  }, [shouldRedirect, campaignId, navigate]);

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

      {socketError && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 shadow-lg backdrop-blur">
          <p className="text-sm font-medium text-destructive">{socketError}</p>
        </div>
      )}

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
  const { rollRequest, dismissRollRequest } = useSessionSocketEvents(campaignId, { isDM });

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

    </>
  );

  const leftPanel = isDM ? (
    <DMSidebarV2
      campaignId={campaignId}
      isDM={isDM}
      selectedEntry={entryToDisplay}
      onSelectEntryId={(id) => selectEntry(id, { pin: true })}
      onClearSelectedEntry={() => selectEntry(null, { pin: true })}
    />
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

  const rightPanel = isDM && (isCombatActive || hasTacticalMap) ? (
    <div className="h-full min-h-0">
      <FocusCard campaignId={campaignId} isDM={isDM} entryOverride={entryToDisplay} />
    </div>
  ) : undefined;

  return (
    <>
      <CampaignShell
        header={header}
        sidebar={leftPanel}
        center={centerStage}
        rightPanel={rightPanel}
        initiativeBanner={
          isCombatActive ? (
            <InitiativeBanner
              campaignId={campaignId}
              isDM={isDM}
              onSelectEntry={(id) => selectEntry(id, { pin: true })}
              focusedEntryId={focusedEntryId}
            />
          ) : undefined
        }
        quickActionBar={
          isDM && isCombatActive ? (
            <QuickActionBar
              campaignId={campaignId}
              focusedEntry={entryToDisplay}
              onEndTurn={() => nextTurn.mutate()}
              disableEndTurn={!isCombatActive || nextTurn.isPending}
              onSpawnToken={() => {
                window.dispatchEvent(new CustomEvent('fablheim:spawn-token', {
                  detail: {
                    name: entryToDisplay?.name ?? 'Token',
                    type: entryToDisplay?.type ?? 'other',
                  },
                }));
              }}
              layout="horizontal"
              isDM={isDM}
            />
          ) : undefined
        }
        mapOverlay={hasTacticalMap ? <DiceRollerToast campaignId={campaignId} /> : undefined}
        bottomDrawer={drawer}
        defaultLeftOpen
        defaultRightOpen
        appState={isCombatActive ? 'combat' : 'narrative'}
      />

      {rollRequest && (
        <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
          <RollRequestPrompt
            campaignId={campaignId}
            requestId={rollRequest.requestId}
            label={rollRequest.label}
            type={rollRequest.type}
            expiresAt={rollRequest.expiresAt}
            onDismiss={dismissRollRequest}
          />
        </div>
      )}
    </>
  );
}
