import { useEffect, useMemo, useState, type ReactNode } from 'react';

type BottomDrawerTab = 'chat' | 'events' | 'dice';
type DrawerMode = 'collapsed' | 'peek' | 'expanded';

interface BottomDrawerProps {
  mapMode?: boolean;
  chat: ReactNode;
  events: ReactNode;
  dice: ReactNode;
}

const HEIGHT_BY_MODE: Record<DrawerMode, string> = {
  collapsed: 'h-10',
  peek: 'h-[240px]',
  expanded: 'h-[420px] max-h-[70vh]',
};

export function BottomDrawer({ mapMode = false, chat, events, dice }: BottomDrawerProps) {
  const [activeTab, setActiveTab] = useState<BottomDrawerTab>('chat');
  const [mode, setMode] = useState<DrawerMode>(mapMode ? 'collapsed' : 'peek');

  useEffect(() => {
    setMode(mapMode ? 'collapsed' : 'peek');
  }, [mapMode]);

  const activeContent = useMemo(() => {
    if (activeTab === 'events') return events;
    if (activeTab === 'dice') return dice;
    return chat;
  }, [activeTab, chat, events, dice]);

  return (
    <section
      className={`border-t border-border/70 bg-card/95 backdrop-blur-sm transition-[height] duration-200 ${HEIGHT_BY_MODE[mode]}`}
      aria-label="Session bottom drawer"
    >
      <div className="flex h-10 items-center justify-between border-b border-border/60 px-2">
        <div className="flex items-center gap-1">
          <TabButton label="Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <TabButton label="Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
          <TabButton label="Dice" active={activeTab === 'dice'} onClick={() => setActiveTab('dice')} />
        </div>

        <div className="flex items-center gap-1">
          <ModeButton label="_" title="Collapse drawer" active={mode === 'collapsed'} onClick={() => setMode('collapsed')} />
          <ModeButton label="-" title="Peek drawer" active={mode === 'peek'} onClick={() => setMode('peek')} />
          <ModeButton label="+" title="Expand drawer" active={mode === 'expanded'} onClick={() => setMode('expanded')} />
        </div>
      </div>

      {mode !== 'collapsed' && (
        <div className="h-[calc(100%-2.5rem)] min-h-0 overflow-hidden">
          {activeContent}
        </div>
      )}
    </section>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
        active
          ? 'border border-primary/35 bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function ModeButton({
  label,
  title,
  active,
  onClick,
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-6 w-6 rounded border text-xs ${
        active
          ? 'border-primary/35 bg-primary/15 text-primary'
          : 'border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
