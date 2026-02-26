import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { LucideIcon } from 'lucide-react';

export interface SidebarNavItem {
  label: string;
  icon: LucideIcon;
  panel?: string;
  path?: string;
  action?: string;
  requiresPaid?: boolean;
}

export interface SidebarNavSection {
  section: string;
  items: SidebarNavItem[];
}

interface SidebarSectionProps {
  title: string;
  items: SidebarNavItem[];
  activePanelIds?: string[];
  onItemClick: (item: SidebarNavItem) => void;
}

export function SidebarSection({ title, items, activePanelIds = [], onItemClick }: SidebarSectionProps) {
  const { user } = useAuth();

  return (
    <div className="mb-4">
      <p className="px-3 pt-2 pb-1 font-[Cinzel] text-muted-foreground text-[10px] tracking-widest uppercase">
        {title}
      </p>
      <div className="space-y-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isLocked = item.requiresPaid && user?.subscriptionTier === 'free';
          const isActive = item.panel ? activePanelIds.includes(item.panel) : false;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => !isLocked && onItemClick(item)}
              disabled={isLocked}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                isActive
                  ? 'border-l-2 border-primary bg-primary/8 text-primary shadow-[inset_0_0_25px_hsla(38,90%,50%,0.08)]'
                  : isLocked
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-[hsla(38,30%,30%,0.08)] hover:text-foreground'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${!isActive ? 'text-[hsla(38,30%,60%,0.6)]' : ''}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {isLocked && <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
