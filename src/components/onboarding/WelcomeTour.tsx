import { useState } from 'react';
import { Book, Users, Sparkles, Swords, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WelcomeTourProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Book,
    title: 'Create Your Campaign',
    description:
      'Set up your world with a campaign — choose your system (D&D 5e, Pathfinder 2e, and more), describe your setting, and invite your players.',
    tip: 'Head to Campaigns in the sidebar to begin.',
  },
  {
    icon: Users,
    title: 'Build Your Party',
    description:
      'Create characters with full stat blocks, backstories, and portraits. Players can manage their own characters, or GMs can create NPCs to populate the world.',
    tip: 'Characters are scoped to campaigns — select a campaign first.',
  },
  {
    icon: Swords,
    title: 'Run Live Sessions',
    description:
      'Roll dice, track initiative, manage a battle map, and take session notes — all in real-time with your party. Everyone sees updates instantly.',
    tip: 'Start a session from your campaign\'s detail page.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Tools',
    description:
      'Generate NPCs, encounters, lore, and session recaps with AI that understands your campaign context. Your world, enriched by intelligent suggestions.',
    tip: 'AI features require age verification (18+) and consume credits.',
  },
];

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-lg border border-gold/30 bg-card shadow-warm-lg texture-parchment iron-brackets overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={onComplete}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-2">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-gold/30 bg-primary/10 shadow-glow-sm">
            <Icon className="h-7 w-7 text-primary" />
          </div>

          <p className="font-[Cinzel] text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Step {step + 1} of {STEPS.length}
          </p>

          <h2 className="font-['IM_Fell_English'] text-2xl font-bold text-foreground text-carved">
            {current.title}
          </h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {current.description}
          </p>

          <div className="mt-4 rounded-md border border-brass/20 bg-brass/5 px-3 py-2">
            <p className="text-xs text-brass">
              <span className="font-[Cinzel] uppercase tracking-wider">Tip:</span>{' '}
              {current.tip}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-5">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none font-[Cinzel] uppercase tracking-wider"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {isLast ? (
            <Button onClick={onComplete} className="shadow-glow">
              Begin Your Adventure
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
