import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  Check,
  Flame,
  Gem,
  Hammer,
  Layers,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';

const pillarCards = [
  {
    icon: Gem,
    title: 'Campaign Hall',
    body: 'Characters, world lore, quests, encounters, and notes mounted in one shared command hall.',
  },
  {
    icon: Sparkles,
    title: 'AI Toolsmith',
    body: 'AI assists. You decide. Generate when needed, edit everything, and keep narrative authority in human hands.',
  },
  {
    icon: Swords,
    title: 'Live Session Runner',
    body: 'Initiative, dice, maps, and chat in one live view so game night stays focused and fast.',
  },
  {
    icon: Layers,
    title: 'Dynamic Panel Workspace',
    body: 'Drag, resize, save layouts per stage. It feels like VS Code for running tabletop sessions.',
  },
  {
    icon: Flame,
    title: 'Transparent Credits',
    body: 'Know exactly what AI actions cost. No hidden token math. No surprises after session night.',
  },
];

const systems = ['D&D 5e', 'Pathfinder 2e', 'Fate Core', 'Daggerheart', 'Custom'];

const testimonials = [
  {
    quote:
      'Fablheim finally replaced my Discord + docs + VTT shuffle. I prep less and run cleaner sessions.',
    by: 'Closed Beta GM',
  },
  {
    quote:
      'The panel system is the first layout that matches how I actually run prep, live play, and recap.',
    by: 'Long Campaign DM',
  },
  {
    quote:
      'It feels handcrafted and readable at the table. The vibe is fantasy, but the flow is practical.',
    by: 'Weekly Group Organizer',
  },
];

function Hero({
  loggedIn,
  onPrimary,
  onHowItWorks,
}: {
  loggedIn: boolean;
  onPrimary: () => void;
  onHowItWorks: () => void;
}) {
  return (
    <section className="mkt-section mkt-hero-stage relative overflow-hidden px-4 pb-18 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsla(35,95%,60%,0.17)_0%,transparent_67%)]" />
        <div className="absolute right-0 top-14 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,hsla(14,84%,46%,0.14)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="lg:pr-8">
          <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <Hammer className="h-3.5 w-3.5" />
            The Command Hall Where Campaigns Come to Life
          </p>

          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.04] text-[color:var(--mkt-text)] sm:text-5xl lg:text-6xl">
            Run Your Table
            <span className="gold-forged block">Like a Forgemaster</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--mkt-muted)] sm:text-lg">
            Replace the 6-tool juggle with one forged workspace for prep, live play, and recap. One Hall. Every Tool.
            Your Story.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={onPrimary} className="shimmer-gold text-base">
              {loggedIn ? 'Open Dashboard' : 'Enter the Realm'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onHowItWorks} className="text-base">
              See How It Works
              <ScrollText className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-[color:var(--mkt-muted)] sm:grid-cols-3">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> Players can join free</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> Stage-based workflow</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> AI assists. You decide.</span>
          </div>
        </div>

        <aside className="grid gap-4 rounded-2xl border border-[color:var(--mkt-border)]/60 bg-[linear-gradient(180deg,hsla(32,28%,16%,0.24)_0%,hsla(24,14%,8%,0.45)_100%)] p-3 shadow-[inset_0_1px_0_hsla(38,36%,70%,0.1),0_16px_34px_hsla(24,34%,4%,0.44)] lg:max-w-[30rem] lg:justify-self-end">
          <article className="mkt-card mkt-card-mounted mkt-card-elevated iron-brackets texture-parchment rounded-xl p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Tonight in one hall</p>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Prep: encounters, notes, world context</li>
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Live: initiative, dice, maps, chat</li>
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Recap: summary + follow-up hooks</li>
            </ul>
          </article>

          <article className="mkt-card mkt-card-mounted rounded-xl bg-[linear-gradient(160deg,hsla(38,84%,56%,0.16)_0%,hsla(18,74%,43%,0.13)_48%,hsla(24,14%,9%,0.9)_100%)] p-5 sm:p-6 lg:ml-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Forged principle</p>
            <p className="mt-2 text-[color:var(--mkt-text)]">High ritual mood. Low cognitive load.</p>
          </article>
        </aside>
      </div>
    </section>
  );
}

function ProblemFraming() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-18 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-10 max-w-4xl" />
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Why Fablheim</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Stop juggling six tabs to run one session
          </h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            Most GMs stitch together chat, docs, maps, rules, initiative, and notes. Fablheim forges that workflow into a
            single command hall.
          </p>
        </header>

        <article className="mkt-card mkt-card-mounted iron-brackets mt-8 overflow-hidden rounded-xl">
          <div className="grid items-stretch md:grid-cols-2">
            <section className="flex h-full flex-col p-6 sm:p-7">
              <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">WITHOUT FABLHEIM</h3>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="leading-relaxed">Momentum breaks during tab switches</span>
                </li>
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="leading-relaxed">Rules lookups stall the table</span>
                </li>
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="leading-relaxed">Prep, notes, and maps live in different places</span>
                </li>
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="leading-relaxed">Session continuity relies on memory</span>
                </li>
              </ul>
            </section>

            <section className="flex h-full flex-col border-t border-[color:var(--mkt-border)] p-6 sm:p-7 md:border-l md:border-t-0">
              <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">WITH FABLHEIM</h3>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
                {[
                  'Prep, play, and recap flow together',
                  'Rules are searchable instantly',
                  'Everything lives in one command hall',
                  'Your campaign remembers everything',
                ].map((text) => (
                  <li key={text} className="grid grid-cols-[0.9rem_1fr] items-start gap-3">
                    <Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" aria-hidden="true" />
                    <span className="leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Core advantages</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">One hall. Every tool. Your story.</h2>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillarCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={`mkt-card rounded-xl p-5 ${index === 1 || index === 3 ? 'mkt-card-mounted' : ''}`}
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/25">
                  <Icon className="h-5 w-5 text-[color:var(--mkt-accent)]" />
                </div>
                <h3 className="mt-4 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">{item.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PanelWorkspaceSection() {

  const features = [
    '21 panel types across stages',
    'Drag, resize, add, and remove panels on demand',
    'Save and load layouts per campaign'
  ];


  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Differentiator</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Your table, your layout</h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            Fablheim's dynamic panel workspace is built for how GMs actually run nights. Rearrange quickly, save presets,
            and switch between Prep, Live, and Recap without rebuilding your flow.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-[color:var(--mkt-muted)]">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--mkt-success)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <article className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--mkt-muted)]">Live layout snapshot</p>
          <div className="mt-4 grid grid-cols-6 gap-2">
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Initiative</div>
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Battle Map</div>
            <div className="col-span-4 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Chat + Dice</div>
            <div className="col-span-2 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Notes</div>
            <div className="col-span-2 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Party</div>
            <div className="col-span-2 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Handouts</div>
            <div className="col-span-2 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Rules</div>
          </div>
          <p className="mt-4 text-sm text-[color:var(--mkt-muted)]">Stage-aware defaults get you started instantly. Custom presets handle your preferred table style.</p>
        </article>
      </div>
    </section>
  );
}

function RulesAndSystems({ onRules }: { onRules: () => void }) {
  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Rules support</p>
            <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Rules at your fingertips</h2>
            <p className="mt-3 max-w-3xl text-[color:var(--mkt-muted)]">
              Fast rules reference for multiple systems, available publicly and integrated into live play workflows.
            </p>
          </header>
          <Button variant="outline" onClick={onRules} className="justify-self-start lg:justify-self-end">
            Open Rules Library
            <BookOpenText className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {systems.map((system) => (
            <article key={system} className="mkt-card rounded-lg px-4 py-3 text-center">
              <p className="font-[Cinzel] text-sm text-[color:var(--mkt-text)]">{system}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofAndPricing({ onHowItWorks }: { onHowItWorks: () => void }) {
  return (
    <section className="mkt-section relative bg-[linear-gradient(180deg,hsla(24,14%,8%,0.84)_0%,hsla(24,12%,7%,0.95)_100%)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <ShieldCheck className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Prep → Live → Recap</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Stage flow mirrors real GM behavior</p>
          </article>
          <article className="mkt-card rounded-lg p-5">
            <Layers className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">21</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Panel types across workflow stages</p>
          </article>
          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <Users className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">&lt; 5 min</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Typical campaign setup to first invite</p>
          </article>
          <article className="mkt-card rounded-lg p-5">
            <Sparkles className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Optional AI</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Use it when needed, skip it when not</p>
          </article>
        </div>

        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.by} className="mkt-card rounded-lg p-5 h-full flex flex-col">
              <p className="flex-1 leading-relaxed text-[color:var(--mkt-text)]">“{item.quote}”</p>
              <footer className="mt-4 text-sm text-[color:var(--mkt-muted)]">{item.by}</footer>
            </blockquote>
          ))}
        </div>

        <article className="mkt-card mkt-card-mounted rounded-2xl border-medieval p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Pricing teaser</p>
              <h3 className="mt-2 font-[Cinzel] text-2xl text-[color:var(--mkt-text)] sm:text-3xl">Clear plans. Transparent credit economy.</h3>
              <p className="mt-3 text-[color:var(--mkt-muted)]">Start free, upgrade when you need more campaign and AI power. No hidden usage math.</p>
            </div>
            <Button size="lg" variant="outline" onClick={onHowItWorks} className="justify-self-start lg:justify-self-end">
              View Pricing Details
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}

function ClosingCta({
  loggedIn,
  onPrimary,
  onHowItWorks,
}: {
  loggedIn: boolean;
  onPrimary: () => void;
  onHowItWorks: () => void;
}) {
  return (
    <section className="mkt-section relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-12 max-w-4xl opacity-80" />
      <div className="mx-auto max-w-5xl">
        <div className="mkt-card mkt-card-mounted mkt-card-elevated mkt-ceremony iron-brackets texture-leather rounded-2xl border-medieval p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--mkt-muted)]">Final call</p>
          <h2 className="mt-3 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Build the hall. Gather the fellowship. Run the legend.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[color:var(--mkt-muted)]">
            Campaign management forged for game night. Warm, practical, and ready when your players arrive.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={onPrimary} className="shimmer-gold text-base">
              {loggedIn ? 'Continue to Dashboard' : 'Enter the Realm'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onHowItWorks} className="text-base">
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loggedIn = !!user;

  function handlePrimary() {
    navigate(loggedIn ? '/app' : '/register');
  }

  return (
    <MarketingPage>
      <MarketingNavbar
        user={user}
        links={[
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <Hero loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />
      <ProblemFraming />
      <Pillars />
      <PanelWorkspaceSection />
      <RulesAndSystems onRules={() => navigate('/srd')} />
      <ProofAndPricing onHowItWorks={() => navigate('/how-it-works')} />
      <ClosingCta loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />

      <MarketingFooter />
    </MarketingPage>
  );
}
