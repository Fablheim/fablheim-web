import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  Check,
  Dice5,
  Drama,
  Link2,
  MessageSquare,
  ScrollText,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';

// ── Data ────────────────────────────────────────────────────────

interface GameSystemCard {
  name: string;
  slug: string;
  flavor: string;
  license: string;
  licenseColor: string;
}

const gameSystems: GameSystemCard[] = [
  {
    name: 'D&D 5e',
    slug: 'dnd5e',
    flavor: 'Slay dragons. Explore dungeons. Cast fireballs. The one you have probably heard of.',
    license: 'CC BY 4.0',
    licenseColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    name: 'Pathfinder 2e',
    slug: 'pathfinder2e',
    flavor: 'Tactical combat with deep character builds. For players who love making meaningful choices every turn.',
    license: 'ORC',
    licenseColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  },
  {
    name: 'Fate Core',
    slug: 'fate',
    flavor: 'Story first, rules second. Play any genre — noir, sci-fi, horror, fantasy — with one flexible system.',
    license: 'CC BY 3.0',
    licenseColor: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  },
  {
    name: 'Daggerheart',
    slug: 'daggerheart',
    flavor: 'Hope and fear in every roll. Cinematic fantasy from the creators of Critical Role.',
    license: 'DPCGL',
    licenseColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
  {
    name: 'Custom',
    slug: '',
    flavor: 'Your homebrew, your mechanics, your world. Fablheim stays out of the way.',
    license: 'Any',
    licenseColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
];

// ── Sections ────────────────────────────────────────────────────

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
        <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsla(280,55%,50%,0.1)_0%,transparent_67%)]" />
        <div className="absolute right-0 top-14 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,hsla(35,95%,60%,0.13)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[radial-gradient(circle,hsla(42,85%,58%,0.06)_0%,transparent_72%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="lg:pr-8">
          <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <Dice5 className="h-3.5 w-3.5" />
            Welcome, adventurer
          </p>

          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.04] text-[color:var(--mkt-text)] sm:text-5xl lg:text-6xl">
            Every Legend
            <span className="gold-forged block">Starts at a Table</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--mkt-muted)] sm:text-lg">
            A tabletop RPG is a story you build with friends — part improv, part strategy, part just hanging out.
            One person sets the scene, everyone else decides what happens next. Dice add the chaos.
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
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> No experience needed</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> Players join free</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> No rulebook required</span>
          </div>
        </div>

        <aside className="grid gap-4 rounded-2xl border border-[color:var(--mkt-border)]/60 bg-[linear-gradient(180deg,hsla(32,28%,16%,0.24)_0%,hsla(24,14%,8%,0.45)_100%)] p-3 shadow-[inset_0_1px_0_hsla(38,36%,70%,0.1),0_16px_34px_hsla(24,34%,4%,0.44)] lg:max-w-[30rem] lg:justify-self-end">
          <article className="mkt-card mkt-card-mounted mkt-card-elevated iron-brackets texture-parchment rounded-xl p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">The short version</p>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              <li className="inline-flex items-center gap-2"><Drama className="h-4 w-4 text-[color:var(--mkt-accent)]" /> One person narrates the world</li>
              <li className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Everyone else plays a character</li>
              <li className="inline-flex items-center gap-2"><Dice5 className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Dice decide what fate allows</li>
              <li className="inline-flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[color:var(--mkt-accent)]" /> The story belongs to all of you</li>
            </ul>
          </article>

          <article className="mkt-card mkt-card-mounted rounded-xl bg-[linear-gradient(160deg,hsla(38,84%,56%,0.16)_0%,hsla(18,74%,43%,0.13)_48%,hsla(24,14%,9%,0.9)_100%)] p-5 sm:p-6 lg:ml-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">The only real rule</p>
            <p className="mt-2 text-[color:var(--mkt-text)]">If the table is laughing, you are playing correctly.</p>
          </article>
        </aside>
      </div>
    </section>
  );
}

function TheTable() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-18 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-10 max-w-4xl" />
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">At the table</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Two roles, one shared story
          </h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            Every table has a Game Master and a group of players. The GM builds the world and plays
            everyone who lives in it. The players each bring one character to life.
          </p>
        </header>

        <article className="mkt-card mkt-card-mounted iron-brackets mt-8 overflow-hidden rounded-xl">
          <div className="grid items-stretch md:grid-cols-2">
            <section className="flex h-full flex-col p-6 sm:p-7">
              <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">THE GAME MASTER</h3>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
                {[
                  'Describes the world — taverns, dungeons, courts, wildernesses',
                  'Plays every NPC the party meets',
                  'Sets challenges and decides consequences',
                  'Keeps the story moving (Fablheim helps with this part)',
                ].map((text) => (
                  <li key={text} className="grid grid-cols-[0.9rem_1fr] items-start gap-3">
                    <Drama className="mt-0.5 h-4 w-4 text-[color:var(--mkt-accent)]" aria-hidden="true" />
                    <span className="leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex h-full flex-col border-t border-[color:var(--mkt-border)] p-6 sm:p-7 md:border-l md:border-t-0">
              <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">THE PLAYERS</h3>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
                {[
                  'Create a character with a name, a backstory, and abilities',
                  'Decide what your character says and does',
                  'Roll dice when the outcome is uncertain',
                  'Collaborate — the best stories are the ones nobody expected',
                ].map((text) => (
                  <li key={text} className="grid grid-cols-[0.9rem_1fr] items-start gap-3">
                    <Swords className="mt-0.5 h-4 w-4 text-[color:var(--mkt-success)]" aria-hidden="true" />
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

function ChooseYourPath({ onRules }: { onRules: () => void }) {
  const navigate = useNavigate();

  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Choose your path</p>
            <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
              Five worlds, one hall
            </h2>
            <p className="mt-3 max-w-3xl text-[color:var(--mkt-muted)]">
              Each system has its own flavor. Your GM usually picks, but all of them publish free rules
              so you can read ahead if you want — or just show up and play.
            </p>
          </header>
          <Button variant="outline" onClick={onRules} className="justify-self-start lg:justify-self-end">
            Browse Rules Library
            <BookOpenText className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gameSystems.map((system, index) => (
            <article
              key={system.name}
              className={`mkt-card flex flex-col rounded-xl p-5 ${index === 0 || index === 3 ? 'mkt-card-mounted' : ''}`}
            >
              <div className="flex items-center gap-3">
                <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">{system.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${system.licenseColor}`}>
                  {system.license}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--mkt-muted)]">{system.flavor}</p>
              {system.slug && (
                <button
                  onClick={() => navigate(`/srd/${system.slug}`)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--mkt-accent)] transition-opacity hover:opacity-80"
                >
                  Read the free rules <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function YouDontNeedToStudy() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Relax</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Nobody reads the whole rulebook
          </h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            Fablheim has the published rules built in. Your GM can search for anything mid-session.
            You just play — the table will teach you the rest.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-[color:var(--mkt-muted)]">
            {[
              'Rules are searchable mid-game, not homework',
              'AI can answer rule questions with real citations',
              'Character creation walks you through it step by step',
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--mkt-success)]" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-[color:var(--mkt-muted)]">
            AI tools are optional — they help with backstories, rule lookups, and session recaps,
            but the GM always has the final word. Your story stays human.
          </p>
        </div>

        <article className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--mkt-muted)]">A typical first session</p>
          <div className="mt-4 space-y-3">
            {[
              { num: '1', text: 'Your GM sends you an invite link' },
              { num: '2', text: 'You create a character (a wizard walks you through it)' },
              { num: '3', text: 'Everyone joins the session — dice, maps, and chat sync live' },
              { num: '4', text: 'After the session, a recap catches up anyone who missed a detail' },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color:var(--mkt-border)] bg-black/25 font-[Cinzel] text-xs text-[color:var(--mkt-accent)]">
                  {step.num}
                </span>
                <p className="text-sm text-[color:var(--mkt-muted)]">{step.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-[color:var(--mkt-muted)]">That is the whole thing. Show up, roll dice, tell a story.</p>
        </article>
      </div>
    </section>
  );
}

function AlreadyInvited() {
  const navigate = useNavigate();

  return (
    <section className="mkt-section relative bg-[linear-gradient(180deg,hsla(24,14%,8%,0.84)_0%,hsla(24,12%,7%,0.95)_100%)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <Sparkles className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">5</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Game systems supported</p>
          </article>
          <article className="mkt-card rounded-lg p-5">
            <BookOpenText className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Free</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Full rules library, no login needed</p>
          </article>
          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <Users className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">&lt; 5 min</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">From invite to first session</p>
          </article>
          <article className="mkt-card rounded-lg p-5">
            <Dice5 className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">$0</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Players never pay to play</p>
          </article>
        </div>

        <article className="mkt-card mkt-card-mounted rounded-2xl border-medieval p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-[color:var(--mkt-accent)]" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Already have an invite?</p>
              </div>
              <h3 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)] sm:text-3xl">
                Your GM sent you a link or code
              </h3>
              <p className="mt-3 text-[color:var(--mkt-muted)]">
                Skip the tour — jump straight into their campaign. You will create a character as part of joining.
              </p>
            </div>
            <Button size="lg" variant="outline" onClick={() => navigate('/join')} className="justify-self-start lg:justify-self-end">
              Enter Invite Code
              <ArrowRight className="ml-2 h-4 w-4" />
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--mkt-muted)]">Your seat is waiting</p>
          <h2 className="mt-3 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            The best way to learn is to play
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[color:var(--mkt-muted)]">
            Grab a friend who GMs, pick a system, and sit down at the table.
            The rules will make sense after one session. The stories will last longer.
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

// ── Page ─────────────────────────────────────────────────────────

export default function NewToTTRPGsPage() {
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
          { label: 'Home', to: '/' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <Hero loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />
      <TheTable />
      <ChooseYourPath onRules={() => navigate('/srd')} />
      <YouDontNeedToStudy />
      <AlreadyInvited />
      <ClosingCta loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />

      <MarketingFooter />
    </MarketingPage>
  );
}
