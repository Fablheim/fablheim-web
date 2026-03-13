import { useCallback, useState } from 'react';
import { MessageSquare, Activity, Dices, ChevronUp, ChevronDown, Minus } from 'lucide-react';

type DrawerMode = 'collapsed' | 'peek' | 'expanded';
type DrawerTab = 'chat' | 'events' | 'dice';

interface BottomDrawerV2Props {
  campaignId: string;
}

const DRAWER_TABS: { id: DrawerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'events', label: 'Events', icon: Activity },
  { id: 'dice', label: 'Dice', icon: Dices },
];

const MODE_HEIGHTS: Record<DrawerMode, string> = {
  collapsed: 'h-9',
  peek: 'h-[180px]',
  expanded: 'h-[45vh]',
};

/**
 * Chat / Events / Dice drawer. Three modes:
 * - collapsed: tab bar only (always accessible)
 * - peek: ~180px, shows recent messages
 * - expanded: ~45vh, full interaction
 */
export function BottomDrawerV2({ campaignId: _campaignId }: BottomDrawerV2Props) {
  const [mode, setMode] = useState<DrawerMode>('collapsed');
  const [activeTab, setActiveTab] = useState<DrawerTab>('chat');

  const cycleMode = useCallback(() => {
    setMode((prev) => {
      if (prev === 'collapsed') return 'peek';
      if (prev === 'peek') return 'expanded';
      return 'collapsed';
    });
  }, []);

  const collapse = useCallback(() => setMode('collapsed'), []);

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col border-t border-[hsla(32,26%,26%,0.75)] bg-[hsl(24,14%,12%)] transition-[height] duration-200 ${MODE_HEIGHTS[mode]}`}
    >
      {renderTabBar()}
      {mode !== 'collapsed' && renderContent()}
    </div>
  );

  function renderTabBar() {
    return (
      <div className="flex h-9 shrink-0 items-center gap-1 px-2">
        {DRAWER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (mode === 'collapsed') setMode('peek');
              }}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors ${
                isActive
                  ? 'bg-[hsl(38,92%,50%)]/10 text-[hsl(38,90%,55%)]'
                  : 'text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}

        <div className="flex-1" />

        {mode !== 'collapsed' && (
          <button
            type="button"
            onClick={collapse}
            className="flex h-6 w-6 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
            aria-label="Collapse"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={cycleMode}
          className="flex h-6 w-6 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          aria-label={mode === 'expanded' ? 'Shrink' : 'Expand'}
        >
          {mode === 'expanded' ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    );
  }

  function renderContent() {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto border-t border-[hsla(32,26%,26%,0.4)] px-3">
        <p className="text-xs text-[hsl(30,14%,40%)]">
          {activeTab} — content goes here
        </p>
      </div>
    );
  }
}
