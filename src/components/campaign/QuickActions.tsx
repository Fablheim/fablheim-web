import { Users, Map, BookOpen, Sparkles, Swords } from 'lucide-react';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';

interface QuickActionsProps {
  campaignId: string;
}

const ACTIONS = [
  {
    icon: Users,
    label: 'Characters',
    description: 'Manage PCs and NPCs',
    path: '/app/characters',
    title: 'Characters',
  },
  {
    icon: Map,
    label: 'World',
    description: 'Locations, factions, lore',
    path: '/app/world',
    title: 'World',
  },
  {
    icon: BookOpen,
    label: 'Notebook',
    description: 'Campaign notes and plans',
    path: '/app/notebook',
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
  const { openTab } = useTabs();

  function handleAction(action: typeof ACTIONS[number]) {
    const path = 'pathFn' in action && action.pathFn
      ? action.pathFn(campaignId)
      : action.path!;
    openTab({ title: action.title, path, content: resolveRouteContent(path, action.title) });
  }

  return (
    <div className="space-y-2">
      <h3 className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
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
              className="group flex flex-col items-center gap-2 rounded-lg border border-iron/30 bg-accent/20 p-4 text-center transition-all hover:border-gold/40 hover:shadow-glow-sm hover-lift texture-leather"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-[Cinzel] text-xs font-semibold text-foreground uppercase tracking-wider">
                  {action.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
