import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ScrollText, Swords, Map, Sparkles, LogOut, StopCircle, MessageCircle, Activity, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import DiceRoller from '@/components/session/DiceRoller';
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import { PartyOverview } from '@/components/session/PartyOverview';
import { QuickReference } from '@/components/session/QuickReference';
import { SessionNotesTab } from '@/components/session/SessionNotesTab';
import { EncountersTab } from '@/components/session/EncountersTab';
import { MapTab } from '@/components/session/MapTab';
import { AIToolsTab } from '@/components/session/AIToolsTab';
import { ChatPanel } from '@/components/session/ChatPanel';
import { EventsFeed } from '@/components/session/EventsFeed';
import { HandoutsTab } from '@/components/session/HandoutsTab';
import { SessionRecapModal } from '@/components/session/SessionRecapModal';
import { useSessionRoom, useSocketEvent } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useSession, useEndSession } from '@/hooks/useSessions';
import { useCombatSync } from '@/hooks/useCombatSync';
import { api } from '@/api/client';
import type { Campaign } from '@/types/campaign';

interface SessionRunnerPageProps {
  campaignId: string;
  sessionId: string;
}

type WorkspaceTab = 'notes' | 'encounters' | 'map' | 'ai' | 'chat' | 'events' | 'handouts';

const TABS: { id: WorkspaceTab; label: string; icon: typeof ScrollText }[] = [
  { id: 'notes', label: 'Notes', icon: ScrollText },
  { id: 'encounters', label: 'Encounters', icon: Swords },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'handouts', label: 'Handouts', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'events', label: 'Events', icon: Activity },
  { id: 'ai', label: 'AI Tools', icon: Sparkles },
];

export function SessionRunnerPage({ campaignId, sessionId }: SessionRunnerPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected, connectedUsers, joined, error } = useSessionRoom(campaignId);
  const { data: campaigns } = useAccessibleCampaigns();
  const { data: session } = useSession(campaignId, sessionId);
  const endSessionMutation = useEndSession();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('notes');
  const [diceCollapsed, setDiceCollapsed] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedTokenEntryId, setSelectedTokenEntryId] = useState<string | null>(null);

  // Cross-system combat sync: hp:changed socket events -> query cache invalidation
  useCombatSync(campaignId);

  const selectedCampaign = campaigns?.find((c) => c._id === campaignId);
  const isDM = !!(campaign && user && campaign.dmId === user._id) || selectedCampaign?.role === 'co_dm';

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
          setCampaignError(err instanceof Error ? err.message : 'Failed to load campaign');
        }
      } finally {
        if (!cancelled) setCampaignLoading(false);
      }
    }
    fetchCampaign();
    return () => { cancelled = true; };
  }, [campaignId]);

  // Elapsed time ticker
  useEffect(() => {
    if (!session?.startedAt || session.status !== 'in_progress') return;

    const updateElapsed = () => {
      const start = new Date(session.startedAt!).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000 / 60));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [session?.startedAt, session?.status]);

  // Listen for session:ended event (for non-DM players)
  useSocketEvent('session:ended', () => {
    setShowRecapModal(true);
  });

  // Listen for recap:ready event
  useSocketEvent('session:recap-ready', () => {
    // Recap is ready — modal will auto-fetch it
  });

  function handleLeaveSession() {
    navigate(`/app/campaigns/${campaignId}`);
  }

  function handleEndSession() {
    if (!confirm('End this session? Statistics will be calculated and an AI recap will be generated.')) return;
    endSessionMutation.mutate(
      { campaignId, sessionId, generateRecap: true },
      {
        onSuccess: () => {
          toast.success('Session ended');
          setShowRecapModal(true);
        },
        onError: () => toast.error('Failed to end session'),
      },
    );
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
          <p className="mt-1 text-sm text-muted-foreground">{campaignError ?? 'Campaign not found'}</p>
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

  // Join error
  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="tavern-card texture-parchment iron-brackets rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <p className="font-medium text-destructive font-['IM_Fell_English'] text-lg">Failed to join session</p>
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

  // Connecting
  if (!joined) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-['IM_Fell_English']">Joining session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {renderHeader()}
      {renderMain()}
      {renderDiceBar()}

      {showRecapModal && session && (
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
      )}
    </div>
  );

  function renderHeader() {
    return (
      <header className="flex items-center justify-between border-b border-[hsla(38,50%,40%,0.2)] shadow-[0_2px_10px_hsla(38,80%,50%,0.06)] texture-wood bg-card px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-foreground font-[Cinzel] text-embossed text-sm">
            {campaign!.name}
          </h1>
          <div className="flex items-center gap-1.5">
            <span
              className={
                connected
                  ? 'h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                  : 'h-2 w-2 rounded-full bg-red-500 animate-pulse'
              }
            />
            <span className="text-xs text-muted-foreground">
              {connected ? `${connectedUsers.length} online` : 'Disconnected'}
            </span>
          </div>
          {/* Elapsed time */}
          {session?.status === 'in_progress' && elapsed > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {Math.floor(elapsed / 60)}h {elapsed % 60}m
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-1">
            {connectedUsers.slice(0, 6).map((u) => (
              <div
                key={u.userId}
                title={`${u.username} (${u.role === 'dm' ? 'GM' : 'Player'})`}
                className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary border border-gold/30"
              >
                {u.username.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          {isDM && (
            <button
              type="button"
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
              className="flex items-center gap-1.5 rounded-md border border-blood/40 bg-blood/10 px-3 py-1.5 text-xs text-[hsl(0,55%,55%)] hover:bg-blood/20 disabled:opacity-50 transition-all font-[Cinzel] uppercase tracking-wider"
            >
              <StopCircle className="h-3.5 w-3.5" />
              {endSessionMutation.isPending ? 'Ending...' : 'End Session'}
            </button>
          )}
          <button
            type="button"
            onClick={handleLeaveSession}
            className="flex items-center gap-1.5 rounded-md border border-iron bg-accent px-3 py-1.5 text-xs text-muted-foreground hover:bg-blood/15 hover:text-[hsl(0,55%,55%)] hover:border-blood/40 transition-all font-[Cinzel] uppercase tracking-wider"
          >
            <LogOut className="h-3.5 w-3.5" />
            Leave
          </button>
        </div>
      </header>
    );
  }

  function renderMain() {
    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Initiative Tracker */}
        <div className="hidden lg:flex w-[280px] xl:w-[320px] flex-col border-r border-[hsla(38,40%,30%,0.15)] overflow-y-auto texture-parchment p-3">
          <InitiativeTracker campaignId={campaignId} isDM={isDM} selectedEntryId={selectedTokenEntryId} />
        </div>

        {/* Center panel: Tabbed workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[hsla(38,40%,30%,0.15)] bg-card/60 texture-leather shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-[Cinzel] uppercase tracking-wider transition-all border-b-2 ${
                    isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className={`flex-1 ${activeTab === 'chat' || activeTab === 'events' || activeTab === 'map' ? 'overflow-hidden' : 'overflow-y-auto'} texture-parchment`}>
            {activeTab === 'notes' && <SessionNotesTab campaignId={campaignId} />}
            {activeTab === 'encounters' && <EncountersTab campaignId={campaignId} isDM={isDM} />}
            {activeTab === 'map' && (
              <MapTab
                campaignId={campaignId}
                isDM={isDM}
                onTokenSelect={(entryId) => setSelectedTokenEntryId(entryId ?? null)}
              />
            )}
            {activeTab === 'handouts' && <HandoutsTab campaignId={campaignId} isDM={isDM} />}
            {activeTab === 'chat' && <ChatPanel campaignId={campaignId} connectedUsers={connectedUsers} />}
            {activeTab === 'events' && <EventsFeed campaignId={campaignId} />}
            {activeTab === 'ai' && <AIToolsTab campaignId={campaignId} />}
          </div>
        </div>

        {/* Right panel: Party + Quick Reference */}
        <div className="hidden xl:flex w-[280px] flex-col border-l border-[hsla(38,40%,30%,0.15)] overflow-y-auto texture-parchment p-3 gap-6">
          <PartyOverview campaignId={campaignId} />
          <QuickReference campaignId={campaignId} />
        </div>
      </div>
    );
  }

  function renderDiceBar() {
    return (
      <div className="shrink-0 border-t border-[hsla(38,50%,40%,0.2)]">
        <button
          onClick={() => setDiceCollapsed(!diceCollapsed)}
          className="w-full flex items-center justify-center gap-2 py-1.5 bg-card/80 texture-wood text-xs text-muted-foreground hover:text-foreground transition-all font-[Cinzel] uppercase tracking-wider"
        >
          {diceCollapsed ? 'Show Dice Roller' : 'Hide Dice Roller'}
        </button>
        {!diceCollapsed && (
          <div className="max-h-[300px] overflow-y-auto bg-card/40 px-4 py-3">
            <DiceRoller campaignId={campaignId} />
          </div>
        )}
      </div>
    );
  }
}
