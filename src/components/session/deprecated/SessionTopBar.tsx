import { LogOut, Plus, StopCircle } from 'lucide-react';
import { SessionTimer } from '@/components/sidebar/SessionTimer';
import { SessionStatusCluster } from '@/components/session/SessionStatusCluster';
import { LayoutPresetSelector } from './LayoutPresetSelector';
import { getPanelsForStage } from '@/lib/panel-registry';
import type { ConnectedUser } from '@/hooks/useSocket';
import type { PanelLayout } from '@/types/session-layout';
import type { PanelId } from '@/types/workspace';
import type { Campaign, Session } from '@/types/campaign';

interface SessionTopBarProps {
  campaign: Campaign;
  isDM: boolean;
  session: Session | undefined;
  connected: boolean;
  connectedUsers: ConnectedUser[];
  joined: boolean;
  isEndingSession: boolean;
  onEndSession: () => void;
  onLeaveSession: () => void;
  layout: PanelLayout;
  activePanelIds: PanelId[];
  onLoadPreset: (presetId: string) => void;
  onResetToDefault: () => void;
  onAddSlot: (slot: 'topBar' | 'bottomBar', panelId: PanelId) => void;
}

export function SessionTopBar({
  campaign,
  isDM,
  session,
  connected,
  connectedUsers,
  joined,
  isEndingSession,
  onEndSession,
  onLeaveSession,
  layout,
  activePanelIds,
  onLoadPreset,
  onResetToDefault,
  onAddSlot,
}: SessionTopBarProps) {
  const canAddPanel = activePanelIds.length < 4;
  const hasEmptySlot = !layout.topBar || !layout.bottomBar;

  return (
    <header className="session-top-bar relative z-10 flex h-[80px] shrink-0 items-center justify-between gap-4 border-b border-[hsla(38,50%,40%,0.22)] px-4 md:px-5">
      {renderLeft()}
      {renderRight()}
    </header>
  );

  function renderLeft() {
    return (
      <div className="flex min-w-0 items-center gap-4">
        <div className="session-top-brand">
          <img src="/fablheim-logo.png" alt="" className="h-7 w-7 rounded-sm shadow-glow-sm" />
          <div className="min-w-0">
            <p className="text-[10px] font-[Cinzel] uppercase tracking-[0.12em] text-muted-foreground">Live Session</p>
            <h1 className="truncate font-[Cinzel] text-base font-semibold text-foreground text-embossed">
              {campaign.name}
            </h1>
          </div>
        </div>
        <SessionStatusCluster
          connected={connected}
          joined={joined}
          stage={campaign.stage}
          sessionStatus={session?.status}
          onlineCount={connectedUsers.length}
        />
        {session?.startedAt && (
          <SessionTimer
            startedAt={session.startedAt}
            className="rounded-md bg-[hsla(0,70%,45%,0.12)] px-2.5 py-1 text-[hsl(0,60%,65%)]"
          />
        )}
      </div>
    );
  }

  function renderRight() {
    return (
      <div className="flex items-center gap-2.5">
        {renderConnectedAvatars()}
        <LayoutPresetSelector
          onLoadPreset={onLoadPreset}
          onResetToDefault={onResetToDefault}
        />
        {canAddPanel && hasEmptySlot && renderAddPanelButton()}
        {isDM && renderEndSessionButton()}
        {renderLeaveButton()}
      </div>
    );
  }

  function renderConnectedAvatars() {
    if (connectedUsers.length === 0) return null;
    return (
      <div className="hidden sm:flex items-center gap-1.5">
        <div className="session-top-avatars">
          {connectedUsers.slice(0, 5).map((u) => (
            <div
              key={u.userId}
              title={`${u.username} (${u.role === 'dm' ? 'GM' : 'Player'})`}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-primary/20 text-xs text-primary"
            >
              {u.username.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAddPanelButton() {
    const emptySlot = !layout.topBar ? 'topBar' : 'bottomBar';
    const available = getPanelsForStage('live').filter(
      (p) => !activePanelIds.includes(p.id),
    );
    if (available.length === 0) return null;

    return (
      <button
        type="button"
        onClick={() => onAddSlot(emptySlot as 'topBar' | 'bottomBar', available[0].id)}
        className="app-focus-ring inline-flex items-center gap-1 rounded-md border border-iron/80 bg-accent/70 px-3 py-2.5 text-[11px] font-[Cinzel] uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        <span className="hidden sm:inline">Panel</span>
      </button>
    );
  }

  function renderEndSessionButton() {
    return (
      <button
        type="button"
        onClick={onEndSession}
        disabled={isEndingSession}
        className="app-focus-ring inline-flex items-center gap-1.5 rounded-md border border-blood/50 bg-blood/12 px-3.5 py-2.5 text-xs text-[hsl(0,65%,68%)] transition-all hover:bg-blood/20 disabled:opacity-50 font-[Cinzel] uppercase tracking-wider"
      >
        <StopCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {isEndingSession ? 'Ending...' : 'End Session'}
        </span>
      </button>
    );
  }

  function renderLeaveButton() {
    return (
      <button
        type="button"
        onClick={onLeaveSession}
        className="app-focus-ring inline-flex items-center gap-1.5 rounded-md border border-iron/80 bg-accent/70 px-3.5 py-2.5 text-xs text-muted-foreground transition-all hover:bg-blood/15 hover:text-[hsl(0,55%,55%)] hover:border-blood/40 font-[Cinzel] uppercase tracking-wider"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Leave</span>
      </button>
    );
  }
}
