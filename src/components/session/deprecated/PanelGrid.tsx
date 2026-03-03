import { useState, useEffect, useRef } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { ChevronDown, X } from 'lucide-react';
import { PANEL_REGISTRY, getPanelsForStage } from '@/lib/panel-registry';
import { PanelRenderer } from '@/components/workspace/PanelRenderer';
import type { PanelLayout } from '@/types/session-layout';
import type { PanelId } from '@/types/workspace';
import type { Campaign } from '@/types/campaign';

interface PanelGridProps {
  layout: PanelLayout;
  campaign: Campaign;
  isDM: boolean;
  sessionId?: string;
  activePanelIds: PanelId[];
  onMainSplitChange: (percent: number) => void;
  onSwapPanel: (slot: 'topBar' | 'leftMain' | 'rightMain' | 'bottomBar', panelId: PanelId) => void;
  onRemoveSlot: (slot: 'topBar' | 'bottomBar') => void;
  onLeaveSession: () => void;
}

// ── Mobile check ──────────────────────────────────────────

function useMobileCheck() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}

// ── Panel Slot Header ─────────────────────────────────────

interface PanelSlotHeaderProps {
  panelId: PanelId;
  slot: 'topBar' | 'leftMain' | 'rightMain' | 'bottomBar';
  removable: boolean;
  activePanelIds: PanelId[];
  onSwap: (slot: 'topBar' | 'leftMain' | 'rightMain' | 'bottomBar', panelId: PanelId) => void;
  onRemove?: () => void;
}

function PanelSlotHeader({ panelId, slot, removable, activePanelIds, onSwap, onRemove }: PanelSlotHeaderProps) {
  const [swapOpen, setSwapOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panel = PANEL_REGISTRY[panelId];
  const Icon = panel?.icon;

  const availablePanels = getPanelsForStage('live').filter(
    (p) => !activePanelIds.includes(p.id) || p.id === panelId,
  );

  useEffect(() => {
    if (!swapOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setSwapOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [swapOpen]);

  return (
    <div className="session-panel-header" ref={ref}>
      <div className="panel-title">
        {Icon && <Icon style={{ width: 13, height: 13, opacity: 0.6 }} />}
        <span>{panel?.title ?? panelId}</span>
      </div>
      <div className="panel-controls">
        <button
          type="button"
          onClick={() => setSwapOpen(!swapOpen)}
          className="app-focus-ring session-panel-control"
          aria-label="Switch panel"
        >
          <ChevronDown style={{ width: 12, height: 12 }} />
        </button>
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="app-focus-ring session-panel-control"
            aria-label="Remove panel"
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        )}

        {swapOpen && (
          <div className="absolute top-full right-0 z-50 mt-1.5 min-w-[200px] rounded-lg border border-[hsla(38,30%,25%,0.5)] bg-[hsl(24,16%,11%)] py-1.5 shadow-[0_16px_36px_hsla(24,36%,3%,0.55)]">
            {availablePanels.map((p) => {
              const PIcon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSwap(slot, p.id);
                    setSwapOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                    p.id === panelId
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:bg-[hsla(38,30%,30%,0.12)] hover:text-foreground'
                  }`}
                >
                  <PIcon style={{ width: 13, height: 13, opacity: 0.7 }} />
                  {p.title}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Panel Slot Wrapper ────────────────────────────────────

interface PanelSlotWrapperProps {
  panelId: PanelId;
  slot: 'topBar' | 'leftMain' | 'rightMain' | 'bottomBar';
  removable: boolean;
  campaign: Campaign;
  isDM: boolean;
  sessionId?: string;
  activePanelIds: PanelId[];
  onSwap: (slot: 'topBar' | 'leftMain' | 'rightMain' | 'bottomBar', panelId: PanelId) => void;
  onRemove?: () => void;
}

function PanelSlotWrapper({
  panelId,
  slot,
  removable,
  campaign,
  isDM,
  sessionId,
  activePanelIds,
  onSwap,
  onRemove,
}: PanelSlotWrapperProps) {
  return (
    <div className="session-panel-frame flex h-full flex-col overflow-hidden">
      <PanelSlotHeader
        panelId={panelId}
        slot={slot}
        removable={removable}
        activePanelIds={activePanelIds}
        onSwap={onSwap}
        onRemove={onRemove}
      />
      <div className="flex-1 overflow-auto">
        <PanelRenderer
          panelId={panelId}
          campaign={campaign}
          isDM={isDM}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
}

// ── PanelGrid ─────────────────────────────────────────────

const slotKey = (layout: PanelLayout) =>
  `${layout.topBar ? '1' : '0'}-${layout.bottomBar ? '1' : '0'}`;

export function PanelGrid({
  layout,
  campaign,
  isDM,
  sessionId,
  activePanelIds,
  onMainSplitChange,
  onSwapPanel,
  onRemoveSlot,
  onLeaveSession,
}: PanelGridProps) {
  const isMobile = useMobileCheck();

  if (isMobile) {
    return renderMobileFallback();
  }

  const hasTopBar = !!(layout.topBar && layout.topBar.panelId);
  const hasBottomBar = !!(layout.bottomBar && layout.bottomBar.panelId);

  return (
    <div className="flex-1 overflow-hidden bg-[linear-gradient(180deg,hsla(24,16%,8%,0.92)_0%,hsla(24,18%,6%,0.96)_100%)] p-3 md:p-4">
      <Group
        key={slotKey(layout)}
        orientation="vertical"
        className="h-full"
      >
        {renderTopBar()}
        {renderMainArea()}
        {renderBottomBar()}
      </Group>
    </div>
  );

  function renderTopBar() {
    if (!hasTopBar || !layout.topBar) return null;
    return (
      <>
        <Panel defaultSize={15} minSize={8} maxSize={30}>
          <PanelSlotWrapper
            panelId={layout.topBar.panelId}
            slot="topBar"
            removable
            campaign={campaign}
            isDM={isDM}
            sessionId={sessionId}
            activePanelIds={activePanelIds}
            onSwap={onSwapPanel}
            onRemove={() => onRemoveSlot('topBar')}
          />
        </Panel>
        <Separator className="session-separator-v" />
      </>
    );
  }

  function renderMainArea() {
    return (
      <Panel>
        <Group
          orientation="horizontal"
          className="h-full"
        >
          <Panel
            defaultSize={layout.mainSplitPercent}
            minSize={20}
            onResize={(size) => onMainSplitChange(size.asPercentage)}
          >
            <PanelSlotWrapper
              panelId={layout.leftMain.panelId}
              slot="leftMain"
              removable={false}
              campaign={campaign}
              isDM={isDM}
              sessionId={sessionId}
              activePanelIds={activePanelIds}
              onSwap={onSwapPanel}
            />
          </Panel>
          <Separator className="session-separator-h" />
          <Panel defaultSize={100 - layout.mainSplitPercent} minSize={20}>
            <PanelSlotWrapper
              panelId={layout.rightMain.panelId}
              slot="rightMain"
              removable={false}
              campaign={campaign}
              isDM={isDM}
              sessionId={sessionId}
              activePanelIds={activePanelIds}
              onSwap={onSwapPanel}
            />
          </Panel>
        </Group>
      </Panel>
    );
  }

  function renderBottomBar() {
    if (!hasBottomBar || !layout.bottomBar) return null;
    return (
      <>
        <Separator className="session-separator-v" />
        <Panel defaultSize={25} minSize={12} maxSize={45}>
          <PanelSlotWrapper
            panelId={layout.bottomBar.panelId}
            slot="bottomBar"
            removable
            campaign={campaign}
            isDM={isDM}
            sessionId={sessionId}
            activePanelIds={activePanelIds}
            onSwap={onSwapPanel}
            onRemove={() => onRemoveSlot('bottomBar')}
          />
        </Panel>
      </>
    );
  }

  function renderMobileFallback() {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <p className="font-['IM_Fell_English'] text-lg text-foreground">
            Session workspace requires a larger screen
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please use a tablet or desktop for the best session experience.
          </p>
          <button
            type="button"
            onClick={onLeaveSession}
            className="mt-4 rounded-md border border-iron bg-accent px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-all font-[Cinzel]"
          >
            Leave Session
          </button>
        </div>
      </div>
    );
  }
}
