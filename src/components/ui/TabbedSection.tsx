import type { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
}

interface TabbedSectionProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
  children: ReactNode;
}

export function TabbedSection({
  tabs,
  activeTabId,
  onChange,
  children,
}: TabbedSectionProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex items-center gap-1 border-b border-border/50 pb-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
