import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Tab } from '@/context/TabContext';

interface PanelTabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onCloseOthers?: (tabId: string) => void;
  onCloseAll?: () => void;
  focused?: boolean;
}

export function PanelTabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onCloseOthers,
  onCloseAll,
  focused,
}: PanelTabBarProps) {
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    function handler(e: Event) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dismiss();
      }
    }
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [contextMenu, dismiss]);

  if (tabs.length === 0) return null;

  const contextTab = contextMenu ? tabs.find((t) => t.id === contextMenu.tabId) : null;
  const hasOthers = tabs.filter((t) => t.id !== contextMenu?.tabId && t.closeable).length > 0;

  return (
    <div className={`relative flex items-center overflow-x-auto border-b bg-[hsl(24,20%,8%)] texture-wood transition-colors ${focused ? 'border-b-primary/60 shadow-[0_1px_0_hsla(38,80%,50%,0.2)]' : 'border-b-border'}`}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex min-w-[120px] max-w-[200px] cursor-pointer select-none items-center gap-2 border-r border-border px-4 py-2 transition-colors ${
            activeTabId === tab.id
              ? 'bg-card border-b-2 border-b-primary text-foreground shadow-[0_2px_10px_hsla(38,90%,50%,0.12),inset_0_-1px_0_hsla(38,50%,50%,0.1)]'
              : 'text-muted-foreground hover:bg-[hsla(38,20%,30%,0.08)] hover:text-foreground'
          }`}
          onClick={() => onTabClick(tab.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
          }}
        >
          <span className="flex-1 truncate font-[Cinzel] text-xs font-medium tracking-wider uppercase">{tab.title}</span>
          {tab.closeable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="rounded p-0.5 opacity-0 transition-opacity hover:bg-[hsla(38,30%,40%,0.15)] group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-md border border-border iron-brackets tavern-card texture-parchment py-1 shadow-warm-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextTab?.closeable && (
            <button
              onClick={() => { onTabClose(contextMenu.tabId); dismiss(); }}
              className="flex w-full px-4 py-1.5 text-left text-sm text-card-foreground transition-colors duration-150 hover:bg-muted"
            >
              Close
            </button>
          )}
          {onCloseOthers && hasOthers && (
            <button
              onClick={() => { onCloseOthers(contextMenu.tabId); dismiss(); }}
              className="flex w-full px-4 py-1.5 text-left text-sm text-card-foreground transition-colors duration-150 hover:bg-muted"
            >
              Close Others
            </button>
          )}
          {onCloseAll && (
            <button
              onClick={() => { onCloseAll(); dismiss(); }}
              className="flex w-full px-4 py-1.5 text-left text-sm text-card-foreground transition-colors duration-150 hover:bg-muted"
            >
              Close All
            </button>
          )}
        </div>
      )}
    </div>
  );
}
