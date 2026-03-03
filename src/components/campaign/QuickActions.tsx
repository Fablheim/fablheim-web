import { useNavigate } from 'react-router-dom';
import { Users, Map, BookOpen, Sparkles, Swords } from 'lucide-react';

interface QuickActionsProps {
  campaignId: string;
}

const ACTIONS = [
  {
    icon: Users,
    label: 'Characters',
    description: 'Manage PCs and NPCs',
    pathFn: (id: string) => `/app/characters?campaign=${id}`,
    title: 'Characters',
  },
  {
    icon: Map,
    label: 'World',
    description: 'Locations, factions, lore',
    pathFn: (id: string) => `/app/world?campaign=${id}`,
    title: 'World',
  },
  {
    icon: BookOpen,
    label: 'Notebook',
    description: 'Campaign notes and plans',
    pathFn: (id: string) => `/app/notebook?campaign=${id}`,
    title: 'Notebook',
  },
  {
    icon: Swords,
    label: 'Encounters',
    description: 'Plan & prep encounters',
    pathFn: (id: string) => `/app/campaigns/${id}/encounters`,
    title: 'Encounter Prep',
  },
  {
    icon: Sparkles,
    label: 'AI Tools',
    description: 'Generate content with AI',
    pathFn: (id: string) => `/app/campaigns/${id}/ai-tools`,
    title: 'AI Tools',
  },
];

export function QuickActions({ campaignId }: QuickActionsProps) {
  const navigate = useNavigate();

  function handleAction(action: typeof ACTIONS[number]) {
    navigate(action.pathFn(campaignId));
  }

  return (
    <div className="mkt-card mkt-card-mounted space-y-3 rounded-xl p-4">
      <h3 className="font-[Cinzel] text-sm uppercase tracking-wider text-[color:var(--mkt-muted)]">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => handleAction(action)}
              className="group mkt-card flex flex-col items-center gap-2 rounded-lg border border-iron/30 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[color:var(--mkt-accent)]/45 hover:shadow-glow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--mkt-border)] bg-black/20 transition-colors group-hover:border-[color:var(--mkt-accent)]/40 group-hover:bg-black/30">
                <Icon className="h-5 w-5 text-[color:var(--mkt-accent)]" />
              </div>
              <div>
                <p className="font-[Cinzel] text-xs font-semibold text-[color:var(--mkt-text)] uppercase tracking-wider">
                  {action.label}
                </p>
                <p className="text-[10px] text-[color:var(--mkt-muted)] mt-0.5">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
