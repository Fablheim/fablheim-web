import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { SessionTopBar } from '@/components/session/SessionTopBar';
import { SideDashboard } from '@/components/session/SideDashboard';
import { PanelGrid } from '@/components/session/PanelGrid';
import { SessionRecapModal } from '@/components/session/SessionRecapModal';
import { AppEmptyState } from '@/components/app/AppEmptyState';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/hooks/useCampaigns';
import { useSession } from '@/hooks/useSessions';
import { useCampaignStage } from '@/hooks/useCampaignStage';
import { useSessionRoom, useSocketEvent } from '@/hooks/useSocket';
import { useCombatSync } from '@/hooks/useCombatSync';
import { useSessionLayout } from '@/hooks/useSessionLayout';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';

// ── URL parsing ──────────────────────────────────────────

function parseSessionParams(pathname: string): { campaignId: string; sessionId: string | null } {
  // /app/campaigns/:campaignId/session/:sessionId/play
  const playMatch = pathname.match(/\/campaigns\/([^/]+)\/session\/([^/]+)\/play/);
  if (playMatch) return { campaignId: playMatch[1], sessionId: playMatch[2] };

  // /app/campaigns/:campaignId/live
  const liveMatch = pathname.match(/\/campaigns\/([^/]+)\/live/);
  if (liveMatch) return { campaignId: liveMatch[1], sessionId: null };

  return { campaignId: '', sessionId: null };
}

// ── SessionShell ─────────────────────────────────────────

export function SessionShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { campaignId, sessionId: urlSessionId } = parseSessionParams(location.pathname);

  // Campaign data
  const { data: campaign, isLoading: campaignLoading, error: campaignError } = useCampaign(campaignId);
  const { data: accessibleCampaigns } = useAccessibleCampaigns();

  // Resolve sessionId — from URL or from campaign's activeSessionId
  const sessionId = urlSessionId ?? campaign?.activeSessionId ?? '';

  // When on /live and activeSessionId becomes available, upgrade URL to include sessionId
  useEffect(() => {
    if (!urlSessionId && campaign?.activeSessionId) {
      navigate(
        `/app/campaigns/${campaignId}/session/${campaign.activeSessionId}/play`,
        { replace: true },
      );
    }
  }, [urlSessionId, campaign?.activeSessionId, campaignId, navigate]);

  // Session data
  const { data: session } = useSession(campaignId, sessionId);

  // WebSocket room
  const {
    connected,
    connectedUsers,
    joined,
    error: socketError,
    desynced,
    syncData,
    updateStateVersion,
    dismissDesync,
  } = useSessionRoom(campaignId);

  // DM check — campaign owner OR co-DM role
  const selectedCampaign = accessibleCampaigns?.find((c) => c._id === campaignId);
  const isDM = !!(campaign && user && campaign.dmId === user._id) || selectedCampaign?.role === 'co_dm';

  // Session lifecycle — use campaign-level endpoint (matches how sessions are started)
  const { endSession: endSessionMutation } = useCampaignStage(campaignId);
  const [showRecapModal, setShowRecapModal] = useState(false);

  // Cross-system combat sync (with stateVersion tracking)
  useCombatSync(campaignId, updateStateVersion);

  // Invalidate TanStack Query caches when sync-response arrives with new data
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!syncData) return;
    queryClient.invalidateQueries({ queryKey: ['initiative', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['characters', campaignId] });
  }, [syncData, campaignId, queryClient]);

  // Layout state
  const {
    layout,
    loadPreset,
    resetToDefault,
    setMainSplit,
    swapPanel,
    removeSlot,
    addSlot,
    activePanelIds,
  } = useSessionLayout(campaignId);

  // Socket events — session ended (non-DM notification)
  useSocketEvent('session:ended', () => {
    setShowRecapModal(true);
  });

  // Socket events — recap ready
  useSocketEvent('session:recap-ready', () => {
    // Recap modal will auto-fetch via useSessionRecap
  });

  // ── Handlers ─────────────────────────────────────────

  function handleEndSession() {
    if (!confirm('End this session? Statistics will be calculated and an AI recap will be generated.')) return;
    endSessionMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Session ended');
        setShowRecapModal(true);
      },
      onError: (err) => toast.error(`Failed to end session: ${(err as Error).message}`),
    });
  }

  function handleLeaveSession() {
    navigate('/app/campaigns');
  }

  // ── Loading / Error states ───────────────────────────

  if (campaignLoading) {
    return renderCentered(
      <>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-['IM_Fell_English']">Loading session...</p>
      </>,
    );
  }

  if (campaignError || !campaign) {
    return renderCentered(
      <AppEmptyState
        title="Failed to load session"
        reason={campaignError instanceof Error ? campaignError.message : 'Campaign not found'}
        className="max-w-lg"
        primaryAction={
          <Button variant="outline" onClick={() => navigate('/app/campaigns')}>
            Back to Campaigns
          </Button>
        }
      />,
    );
  }

  if (socketError) {
    return renderCentered(
      <AppEmptyState
        title="Failed to join session"
        reason={socketError}
        className="max-w-lg"
        primaryAction={
          <Button variant="outline" onClick={() => navigate('/app/campaigns')}>
            Back to Campaigns
          </Button>
        }
      />,
    );
  }

  if (!joined) {
    return renderCentered(
      <>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-['IM_Fell_English']">Joining session...</p>
      </>,
    );
  }

  // ── Main render ──────────────────────────────────────

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {renderTopBar()}
      {renderDesyncBanner()}
      {renderWorkspace()}
      {renderRecapModal()}
    </div>
  );

  // ── Render helpers ───────────────────────────────────

  function renderCentered(children: React.ReactNode) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        {children}
      </div>
    );
  }

  function renderDesyncBanner() {
    if (!desynced) return null;
    return (
      <div className="flex items-center justify-between bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-sm text-amber-200">
        <span className="font-['IM_Fell_English']">
          Connection was interrupted. State has been resynchronized.
        </span>
        <button
          type="button"
          onClick={dismissDesync}
          className="ml-4 rounded p-1 hover:bg-amber-500/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  function renderTopBar() {
    return (
      <SessionTopBar
        campaign={campaign!}
        isDM={isDM}
        session={session}
        connected={connected}
        connectedUsers={connectedUsers}
        joined={joined}
        isEndingSession={endSessionMutation.isPending}
        onEndSession={handleEndSession}
        onLeaveSession={handleLeaveSession}
        layout={layout}
        activePanelIds={activePanelIds}
        onLoadPreset={loadPreset}
        onResetToDefault={resetToDefault}
        onAddSlot={addSlot}
      />
    );
  }

  function renderWorkspace() {
    return (
      <div className="relative flex flex-1 overflow-hidden">
        <SideDashboard campaignId={campaignId} isDM={isDM} />
        <PanelGrid
          layout={layout}
          campaign={campaign!}
          isDM={isDM}
          sessionId={sessionId || undefined}
          activePanelIds={activePanelIds}
          onMainSplitChange={setMainSplit}
          onSwapPanel={swapPanel}
          onRemoveSlot={removeSlot}
          onLeaveSession={handleLeaveSession}
        />
      </div>
    );
  }

  function renderRecapModal() {
    if (!showRecapModal || !session) return null;
    return (
      <SessionRecapModal
        campaignId={campaignId}
        sessionId={sessionId}
        sessionTitle={session.title ?? `Session ${session.sessionNumber}`}
        durationMinutes={session.durationMinutes}
        statistics={session.statistics}
        onClose={() => {
          setShowRecapModal(false);
          if (session.status === 'completed') {
            navigate(`/app/campaigns/${campaignId}`);
          }
        }}
      />
    );
  }
}
