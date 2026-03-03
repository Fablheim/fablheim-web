import { Library, Plus, Users } from 'lucide-react';
import { stageConfig } from '@/config/stage-config';
import type { Campaign } from '@/types/campaign';

interface QuickAccessBarProps {
  recentCampaigns: Campaign[];
  onNavigate: (path: string) => void;
}

export function QuickAccessBar({ recentCampaigns, onNavigate }: QuickAccessBarProps) {
  const items = [
    ...recentCampaigns.slice(0, 3).map((c) => {
      const stage = stageConfig[c.stage];
      const StageIcon = stage.Icon;
      return {
        key: c._id,
        icon: StageIcon,
        label: c.name,
        iconClass: stage.color,
        onClick: () => onNavigate(`/app/campaigns/${c._id}`),
      };
    }),
    {
      key: 'new',
      icon: Plus,
      label: 'New Campaign',
      iconClass: 'text-primary',
      onClick: () => onNavigate('/app/campaigns'),
    },
    {
      key: 'characters',
      icon: Users,
      label: 'Characters',
      iconClass: 'text-forest',
      onClick: () => onNavigate('/app/characters'),
    },
    {
      key: 'rules',
      icon: Library,
      label: 'Rules',
      iconClass: 'text-brass',
      onClick: () => onNavigate('/app/rules'),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="mkt-card mkt-card-mounted flex flex-col items-center gap-1.5 rounded-lg p-3 transition-all hover:-translate-y-0.5 hover:border-[color:var(--mkt-accent)]/45"
          >
            <Icon className={`h-4.5 w-4.5 ${item.iconClass}`} />
            <span className="truncate text-center font-[Cinzel] text-[11px] font-semibold uppercase tracking-wider text-[color:var(--mkt-muted)]">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
