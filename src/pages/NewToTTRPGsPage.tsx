import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  Check,
  Dice5,
  Drama,
  MessageSquare,
  ScrollText,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageSchema } from '@/seo/schema';

const systems = [
  { name: 'D&D 5e', slug: 'dnd5e' },
  { name: 'Pathfinder 2e', slug: 'pathfinder2e' },
  { name: 'Fate Core', slug: 'fate' },
  { name: 'Daggerheart', slug: 'daggerheart' },
  { name: 'Custom', slug: '' },
];

const newPlayerFaq = [
  {
    question: 'Do I need tabletop experience to start?',
    answer: 'No. New players can join by invite and learn as they play.',
  },
  {
    question: 'Can I access rules without logging in?',
    answer: 'Yes. The rules library is public.',
  },
  {
    question: 'Is AI required for new players?',
    answer: 'No. AI is optional and not required to play.',
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
        <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsla(35,95%,60%,0.13)_0%,transparent_67%)]" />
        <div className="absolute right-0 top-14 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,hsla(18,82%,46%,0.12)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="lg:pr-8">
          <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <Dice5 className="h-3.5 w-3.5" />
            First-time table guide
          </p>

          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.04] text-[color:var(--mkt-text)] sm:text-5xl lg:text-6xl">
            New to TTRPGs?
            <span className="gold-forged block">Start Here</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--mkt-muted)] sm:text-lg">
            Tabletop RPGs are collaborative stories with dice. One person runs the world, players make decisions, and
            everyone reacts to what happens. Fablheim helps keep that shared experience organized without making new
            players learn a complicated tool stack first.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={onPrimary} className="shimmer-gold text-base">
              {loggedIn ? 'Open Dashboard' : 'Join Beta'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onHowItWorks} className="text-base">
              See How It Works
              <ScrollText className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-[color:var(--mkt-muted)] sm:grid-cols-3">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> No experience needed</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> Players join free</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> Rules library is public</span>
          </div>
        </div>

        <aside className="grid gap-4 rounded-2xl border border-[color:var(--mkt-border)]/60 bg-[linear-gradient(180deg,hsla(32,28%,16%,0.24)_0%,hsla(24,14%,8%,0.45)_100%)] p-3 shadow-[inset_0_1px_0_hsla(38,36%,70%,0.1),0_16px_34px_hsla(24,34%,4%,0.44)] lg:max-w-[30rem] lg:justify-self-end">
          <article className="mkt-card mkt-card-mounted mkt-card-elevated iron-brackets texture-parchment rounded-xl p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">The quick version</p>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              <li className="inline-flex items-center gap-2"><Drama className="h-4 w-4 text-[color:var(--mkt-accent)]" /> GM describes the world and NPCs</li>
              <li className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Players choose character actions</li>
              <li className="inline-flex items-center gap-2"><Dice5 className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Dice resolve uncertain outcomes</li>
              <li className="inline-flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Story emerges from table decisions</li>
            </ul>
          </article>

          <article className="mkt-card mkt-card-mounted rounded-xl bg-[linear-gradient(160deg,hsla(38,84%,56%,0.16)_0%,hsla(18,74%,43%,0.13)_48%,hsla(24,14%,9%,0.9)_100%)] p-5 sm:p-6 lg:ml-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Table rule</p>
            <p className="mt-2 text-[color:var(--mkt-text)]">If the table is engaged, you are doing it right.</p>
          </article>
        </aside>
      </div>
    </section>
  );
}

function FirstSessionPath({ onRules }: { onRules: () => void }) {
  const steps = [
    'GM invites you to a campaign by link or email',
    'You create a character with the guided wizard',
    'Live session starts: chat, dice, initiative, and map stay synced',
    'Recap helps everyone remember what happened',
  ];

  return (
    <section className="mkt-section mkt-section-surface px-4 py-18 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-10 max-w-4xl" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Your first game</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">What your first session usually looks like</h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            You do not need to memorize every rule. The table and the GM handle pacing, while Fablheim keeps core tools
            in one place so it is easier to follow what is happening.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-[color:var(--mkt-muted)]">
            {steps.map((step, idx) => (
              <li key={step} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[color:var(--mkt-border)] bg-black/25 text-[10px] text-[color:var(--mkt-accent)]">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <article className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--mkt-muted)]">Rules support</p>
          <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">
            The Rules Library is public and searchable. If you want extra help, AI rule assistant exists for quick
            plain-language answers with citations.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {systems.map((system) => (
              <div key={system.name} className="rounded border border-[color:var(--mkt-border)] bg-black/20 px-3 py-2 text-xs text-[color:var(--mkt-muted)]">
                {system.name}
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={onRules} className="mt-4">
            Browse Rules Library
            <BookOpenText className="ml-2 h-4 w-4" />
          </Button>
        </article>
      </div>
    </section>
  );
}

function ForPlayers() {
  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <Users className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Free Join</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Players can join campaigns without a paid plan.</p>
          </article>
          <article className="mkt-card rounded-lg p-5">
            <Swords className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Live Table Tools</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Dice, chat, initiative context, and map participation.</p>
          </article>
          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <ScrollText className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Session Recap</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Catch up on outcomes between sessions.</p>
          </article>
          <article className="mkt-card rounded-lg p-5">
            <Sparkles className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">AI Is Optional</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Core play works without AI, so new players do not need to think about credits at all.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

function NewToTtrpgFaq() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">Beginner FAQ</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {newPlayerFaq.map((item) => (
            <article key={item.question} className="mkt-card rounded-xl p-5">
              <p className="font-semibold text-[color:var(--mkt-text)]">{item.question}</p>
              <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--mkt-muted)]">Ready to try it</p>
          <h2 className="mt-3 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Join a table and start rolling
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[color:var(--mkt-muted)]">
            Whether you are new or experienced, the goal is the same: less setup friction, more actual play.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={onPrimary} className="shimmer-gold text-base">
              {loggedIn ? 'Open Dashboard' : 'Join Beta'}
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

export default function NewToTTRPGsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loggedIn = !!user;

  function handlePrimary() {
    navigate(loggedIn ? '/app' : '/register');
  }

  return (
    <MarketingPage>
      <SEO
        title="New to TTRPGs? Beginner Guide | Fablheim"
        description="Learn the basics of tabletop RPGs, how sessions usually flow, and how Fablheim helps players join and stay synced during play."
        canonicalPath="/new-to-ttrpgs"
      />
      <JsonLd data={faqPageSchema('/new-to-ttrpgs', newPlayerFaq)} />

      <MarketingNavbar
        user={user}
        links={[
          { label: 'Home', to: '/' },
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'Pricing', to: '/pricing' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <Hero loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />
      <FirstSessionPath onRules={() => navigate('/srd')} />
      <ForPlayers />
      <NewToTtrpgFaq />
      <ClosingCta loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />

      <MarketingFooter />
    </MarketingPage>
  );
}
