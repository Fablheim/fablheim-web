import { useMemo, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  Check,
  Compass,
  Crown,
  Layers,
  Map,
  NotebookPen,
  Radio,
  ScrollText,
  Sparkles,
  Sword,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';

type Track = 'gm' | 'player';

type Step = {
  title: string;
  body: string;
  bullets: string[];
  icon: ComponentType<{ className?: string }>;
  comingSoon?: boolean;
};

const gmSteps: Step[] = [
  {
    title: 'Create a Campaign',
    body: 'Pick your system, set your table context, and get a playable foundation in minutes.',
    bullets: [
      'D&D 5e, Pathfinder 2e, Fate Core, Daggerheart, or Custom',
      'Campaign hall starts with practical defaults',
      'Built for speed, not setup marathons',
    ],
    icon: Crown,
  },
  {
    title: 'Build Your World',
    body: 'Locations, factions, NPCs, and quests stay connected so prep remains coherent over time.',
    bullets: [
      'Entity links keep lore usable at the table',
      'DM-only and player-facing visibility controls',
      'Search and filter across campaign knowledge',
    ],
    icon: Map,
  },
  {
    title: 'Invite Players',
    body: 'Bring players in quickly by link or email and move from planning to play fast.',
    bullets: [
      'Invite in minutes',
      'Shared campaign context from day one',
      'Co-DM support for trusted collaborators',
    ],
    icon: Users,
  },
  {
    title: 'AI Tools (Optional)',
    body: 'AI is a toolsmith, not a driver. Generate when needed, edit everything, keep narrative control.',
    bullets: [
      'NPCs, encounters, world details, and recaps',
      'Results are editable before they land',
      'AI assists. You decide.',
    ],
    icon: Sparkles,
  },
  {
    title: 'Campaign Notebook',
    body: 'Capture threads, clues, and follow-ups in one place that stays useful during prep and live play.',
    bullets: [
      'Session notes and plot threads stay organized',
      'Context remains available when pressure is high',
      'Works great with or without AI',
    ],
    icon: NotebookPen,
  },
  {
    title: 'Run Live Sessions',
    body: 'Your table command center for game night: synced tools, clear state, fewer interruptions.',
    bullets: [
      'Initiative, dice, chat, maps, and handouts',
      'Live participants and room state visibility',
      'Designed for confident pacing at the table',
    ],
    icon: Radio,
  },
  {
    title: 'Coming Soon',
    body: 'Carefully scoped additions in active design and validation.',
    bullets: [
      'AI battle map generation + map library',
      'Expanded session recap controls',
      'More panel preset workflows',
    ],
    icon: Compass,
    comingSoon: true,
  },
];

const playerSteps: Step[] = [
  {
    title: 'Join a Campaign',
    body: 'Get invited and enter the table quickly. No complex onboarding.',
    bullets: [
      'Join via link or email invite',
      'Players join free',
      'Jump into active sessions fast',
    ],
    icon: UserPlus,
  },
  {
    title: 'Create Your Character',
    body: 'Build your character with a clear flow and campaign-aware context.',
    bullets: [
      'Stats, identity, and system-specific details',
      'Optional AI support for brainstorming',
      'Final decisions stay with the player',
    ],
    icon: Crown,
  },
  {
    title: 'Participate Live',
    body: 'Roll, chat, and track the action in real time with the rest of the group.',
    bullets: [
      'Live dice + session chat',
      'Initiative and encounter visibility',
      'Maps and shared handouts during play',
    ],
    icon: Sword,
  },
  {
    title: 'Catch Up with Recaps',
    body: 'Stay oriented between sessions without digging through disconnected notes.',
    bullets: [
      'Session summaries and campaign continuity',
      'Key moments are easier to retain',
      'Less re-explaining next session',
    ],
    icon: ScrollText,
  },
  {
    title: 'Rules Lookup',
    body: 'Quick rules reference keeps momentum high when questions appear mid-session.',
    bullets: [
      'Multi-system Rules Library',
      'Fast lookup from one place',
      'Supports table confidence under pressure',
    ],
    icon: BookOpenText,
  },
];

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">{eyebrow}</p>
      <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-[color:var(--mkt-muted)]">{body}</p>
    </header>
  );
}

function Hero({
  loggedIn,
  onPrimary,
  onRules,
}: {
  loggedIn: boolean;
  onPrimary: () => void;
  onRules: () => void;
}) {
  return (
    <section className="mkt-section mkt-hero-stage relative overflow-hidden px-4 pb-18 pt-14 sm:px-6 sm:pb-22 sm:pt-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-36 top-6 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsla(36,95%,60%,0.16)_0%,transparent_68%)]" />
        <div className="absolute right-0 top-14 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,hsla(16,82%,46%,0.13)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="lg:pr-8">
          <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <Layers className="h-3.5 w-3.5" />
            Prep. Play. Recap. Repeat.
          </p>

          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.05] text-[color:var(--mkt-text)] sm:text-5xl lg:text-6xl">
            How Fablheim Works
            <span className="gold-forged block">High ritual mood, low cognitive load</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--mkt-muted)] sm:text-lg">
            A practical flow for Game Masters and players: one forged workspace from session prep to live play to recap.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={onPrimary} className="shimmer-gold text-base">
              {loggedIn ? 'Open Dashboard' : 'Enter the Realm'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onRules} className="text-base">
              Browse Rules Library
              <BookOpenText className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <article className="mkt-card mkt-card-mounted mkt-card-elevated iron-brackets texture-parchment rounded-xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Workflow at a glance</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[color:var(--mkt-border)] bg-black/25 p-3">
              <p className="font-[Cinzel] text-sm text-[color:var(--mkt-text)]">Prep</p>
              <p className="mt-1 text-xs text-[color:var(--mkt-muted)]">World, encounters, notebook</p>
            </div>
            <div className="rounded-lg border border-[color:var(--mkt-border)] bg-black/25 p-3">
              <p className="font-[Cinzel] text-sm text-[color:var(--mkt-text)]">Live</p>
              <p className="mt-1 text-xs text-[color:var(--mkt-muted)]">Initiative, dice, chat, maps</p>
            </div>
            <div className="rounded-lg border border-[color:var(--mkt-border)] bg-black/25 p-3">
              <p className="font-[Cinzel] text-sm text-[color:var(--mkt-text)]">Recap</p>
              <p className="mt-1 text-xs text-[color:var(--mkt-muted)]">Summary, follow-ups, next hooks</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[color:var(--mkt-muted)]">AI assists where useful, but narrative authority always stays with the GM.</p>
        </article>
      </div>
    </section>
  );
}

function StageWorkflow() {
  const stages = [
    {
      title: 'Prep',
      body: 'Build encounters, review notes, and arrange your panel layout before players arrive.',
    },
    {
      title: 'Live',
      body: 'Run initiative, dice, chat, maps, and handouts from one synchronized command view.',
    },
    {
      title: 'Recap',
      body: 'Capture outcomes, polish summaries, and prepare the next session with continuity intact.',
    },
  ];

  return (
    <section className="mkt-section mkt-section-surface px-4 py-18 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-10 max-w-4xl" />
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Stage Model"
          title="Prep. Play. Recap. Repeat."
          body="Fablheim models how real tables run: preparation, live execution, and continuity after the session."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3 items-stretch">
          {stages.map((stage) => (
            <article key={stage.title} className="mkt-card mkt-card-mounted rounded-xl p-5 h-full flex flex-col">
              <p className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">{stage.title}</p>
              <p className="mt-3 flex-1 text-sm text-[color:var(--mkt-muted)]">{stage.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tracks({ activeTrack, setActiveTrack }: { activeTrack: Track; setActiveTrack: (track: Track) => void }) {
  const steps = useMemo(() => (activeTrack === 'gm' ? gmSteps : playerSteps), [activeTrack]);

  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Role Paths"
          title={activeTrack === 'gm' ? 'Game Master Track' : 'Player Track'}
          body={
            activeTrack === 'gm'
              ? 'From campaign setup to live operation, this is the practical flow for running table night with confidence.'
              : 'From invite to recap, this is the path for players to stay engaged, informed, and ready each session.'
          }
        />

        <div className="mt-6 inline-flex rounded-lg border border-[color:var(--mkt-border)] bg-[color:var(--mkt-surface-2)] p-1">
          <button
            type="button"
            onClick={() => setActiveTrack('gm')}
            className={`mkt-tab px-5 py-2.5 text-sm font-semibold ${activeTrack === 'gm' ? 'mkt-tab-active' : ''}`}
          >
            Game Master Track
          </button>
          <button
            type="button"
            onClick={() => setActiveTrack('player')}
            className={`mkt-tab px-5 py-2.5 text-sm font-semibold ${activeTrack === 'player' ? 'mkt-tab-active' : ''}`}
          >
            Player Track
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 items-stretch">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className={`mkt-card rounded-xl p-5 h-full flex flex-col ${step.comingSoon ? 'border-dashed opacity-90' : 'mkt-card-mounted'}`}
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/25">
                    <Icon className="h-5 w-5 text-[color:var(--mkt-accent)]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Step {idx + 1}</p>
                    <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">{step.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-[color:var(--mkt-muted)]">{step.body}</p>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
                  {step.bullets.map((bullet) => (
                    <li key={bullet} className="grid grid-cols-[0.9rem_1fr] items-start gap-3">
                      <Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" aria-hidden="true" />
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WorkspaceAndLive() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Differentiator"
            title="Dynamic panel workspace"
            body="Arrange the table your way: drag, resize, and save presets per campaign and stage."
          />
          <ul className="mt-5 space-y-3 text-sm text-[color:var(--mkt-muted)]">
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />21 panel types across Prep, Live, and Recap</li>
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />Stage-aware defaults + custom presets for power users</li>
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />Live session runner includes initiative, dice, chat, maps, and handouts</li>
          </ul>
        </div>

        <article className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--mkt-muted)]">Live Session Runner</p>
          <div className="mt-4 grid grid-cols-6 gap-2">
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Initiative</div>
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Battle Map</div>
            <div className="col-span-4 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Chat + Dice</div>
            <div className="col-span-2 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Handouts</div>
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Rules Lookup</div>
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Notebook</div>
          </div>
          <p className="mt-4 text-sm text-[color:var(--mkt-muted)]">Mounted for game-night clarity: fewer context switches, better pacing.</p>
        </article>
      </div>
    </section>
  );
}

function AiStanceAndSoon() {
  const soonItems = [
    'Expanded recap controls and templates',
    'Additional panel presets by play style',
    'Deeper rules-reference workflows',
  ];

  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <article className="mkt-card mkt-card-mounted rounded-xl border-medieval p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">AI Philosophy</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">AI as a Toolsmith, Not a Driver</h2>
          <p className="mt-3 text-[color:var(--mkt-muted)]">
            Optional assistance for prep and recap, with editable outputs and clear control boundaries. Fablheim is built
            to respect GM authority first.
          </p>
          <ul className="mt-5 grid gap-3 text-sm text-[color:var(--mkt-muted)] md:grid-cols-2">
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />Generate only when needed</li>
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />Every result is editable</li>
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />Transparent credit economy</li>
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />No AI-first workflow pressure</li>
          </ul>
        </article>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Coming Soon</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3 items-stretch">
            {soonItems.map((item) => (
              <article key={item} className="mkt-card rounded-lg border-dashed p-5 h-full">
                <p className="text-sm leading-relaxed text-[color:var(--mkt-muted)]">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCta({ loggedIn, onPrimary, onRules }: { loggedIn: boolean; onPrimary: () => void; onRules: () => void }) {
  return (
    <section className="mkt-section relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-12 max-w-4xl opacity-80" />
      <div className="mx-auto max-w-5xl">
        <div className="mkt-card mkt-card-mounted mkt-card-elevated mkt-ceremony iron-brackets texture-leather rounded-2xl border-medieval p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--mkt-muted)]">Ready to run</p>
          <h2 className="mt-3 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Bring your table into one command hall
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[color:var(--mkt-muted)]">
            Forge smoother session nights with a workflow that respects how GMs and players actually play.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={onPrimary} className="shimmer-gold text-base">
              {loggedIn ? 'Open Dashboard' : 'Enter the Realm'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onRules} className="text-base">
              Browse Rules Library
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loggedIn = !!user;
  const [activeTrack, setActiveTrack] = useState<Track>('gm');

  function handlePrimary() {
    navigate(loggedIn ? '/app' : '/register');
  }

  return (
    <MarketingPage>
      <MarketingNavbar
        user={user}
        links={[
          { label: 'Home', to: '/' },
          { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <Hero loggedIn={loggedIn} onPrimary={handlePrimary} onRules={() => navigate('/srd')} />
      <StageWorkflow />
      <Tracks activeTrack={activeTrack} setActiveTrack={setActiveTrack} />
      <WorkspaceAndLive />
      <AiStanceAndSoon />
      <ClosingCta loggedIn={loggedIn} onPrimary={handlePrimary} onRules={() => navigate('/srd')} />

      <MarketingFooter />
    </MarketingPage>
  );
}
