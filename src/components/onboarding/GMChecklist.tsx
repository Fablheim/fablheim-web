import { Book, Users, UserPlus, Swords, X, Check } from 'lucide-react';

interface GMChecklistProps {
  completedSteps: string[];
  onDismiss: () => void;
}

const CHECKLIST_STEPS = [
  {
    id: 'create-campaign',
    icon: Book,
    label: 'Create your first campaign',
    description: 'Set up a campaign with your chosen system and setting',
  },
  {
    id: 'create-character',
    icon: Users,
    label: 'Add a character or NPC',
    description: 'Build a PC or populate your world with NPCs',
  },
  {
    id: 'invite-player',
    icon: UserPlus,
    label: 'Invite a player',
    description: 'Share an invite link or send an email invitation',
  },
  {
    id: 'start-session',
    icon: Swords,
    label: 'Start a live session',
    description: 'Launch a session and roll your first dice',
  },
];

export function GMChecklist({ completedSteps, onDismiss }: GMChecklistProps) {
  const completed = CHECKLIST_STEPS.filter((s) => completedSteps.includes(s.id)).length;
  const total = CHECKLIST_STEPS.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (completed === total) return null;

  return (
    <div className="rounded-lg border border-gold/30 bg-card texture-parchment shadow-warm-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[hsla(38,40%,30%,0.15)] px-4 py-3">
        <div>
          <h3 className="font-[Cinzel] text-sm font-semibold text-foreground uppercase tracking-wider">
            Getting Started
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completed} of {total} complete
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="divide-y divide-[hsla(38,40%,30%,0.1)]">
        {CHECKLIST_STEPS.map((step) => {
          const Icon = step.icon;
          const done = completedSteps.includes(step.id);

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                done ? 'opacity-60' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  done
                    ? 'border-forest/40 bg-forest/15 text-forest'
                    : 'border-iron/30 bg-accent/40 text-muted-foreground'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    done ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
