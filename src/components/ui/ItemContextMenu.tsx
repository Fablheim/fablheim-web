import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { EllipsisVertical, PanelLeft, PanelRight } from 'lucide-react';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';

interface ItemContextMenuProps {
  children: ReactNode;
  item: { title: string; path: string; icon?: string };
  className?: string;
}

export function ItemContextMenu({ children, item, className = '' }: ItemContextMenuProps) {
  const { openLeftTab, openRightTab } = useTabs();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: Event) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dismiss();
      }
    }
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [open, dismiss]);

  return (
    <div className={`group relative ${className}`} ref={menuRef}>
      {children}

      {/* Kebab button — visible on hover */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
      >
        <EllipsisVertical className="h-4 w-4" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-border bg-popover py-1 shadow-warm-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openLeftTab({
                title: item.title,
                path: item.path,
                content: resolveRouteContent(item.path, item.title),
              });
              dismiss();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-card-foreground transition-colors duration-150 hover:bg-muted"
          >
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
            Open in Panel 1
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openRightTab({
                title: item.title,
                path: item.path,
                content: resolveRouteContent(item.path, item.title),
              });
              dismiss();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-card-foreground transition-colors duration-150 hover:bg-muted"
          >
            <PanelRight className="h-4 w-4 text-muted-foreground" />
            Open in Panel 2
          </button>
        </div>
      )}
    </div>
  );
}
