import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  ChevronLeft,
  Swords,
  Target,
  BookOpen,
  Heart,
  Sparkles,
  Users,
  Dice5,
  ScrollText,
  MessageSquare,
  Drama,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface GameSystem {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  flavor: string[];
  license: string;
  licenseColor: string;
}

const gameSystems: GameSystem[] = [
  {
    icon: Swords,
    name: 'Dungeons & Dragons 5th Edition',
    slug: 'dnd5e',
    tagline: 'The world\'s most popular tabletop RPG',
    description:
      'The game that started it all (and keeps going). Explore dungeons, fight dragons, cast spells, and tell epic fantasy stories with your friends. If you have heard of TTRPGs at all, this is probably why.',
    flavor: [
      'Choose a class (wizard, rogue, fighter, and more) and a race (elf, dwarf, human, etc.)',
      'Roll a 20-sided die to determine success or failure -- the iconic "d20 system"',
      'Massive community with endless adventures, homebrew content, and actual play shows',
      'Great for beginners with straightforward core rules and tons of learning resources',
    ],
    license: 'CC BY 4.0',
    licenseColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',

  },
  {
    icon: Target,
    name: 'Pathfinder 2nd Edition',
    slug: 'pathfinder2e',
    tagline: 'Deep tactics, infinite builds',
    description:
      'Paizo\'s tactical fantasy RPG for players who love character customization and crunchy combat. If D&D is the gateway, Pathfinder is the deep end -- in the best way.',
    flavor: [
      'Three-action economy gives you real choices every turn, not just "I attack"',
      'Ancestries, heritages, and class feats let you build exactly the character you imagine',
      'Tighter math and encounter balancing make running the game smoother for GMs',
      'Entire rules archive free online at Archives of Nethys -- no books required to play',
    ],
    license: 'ORC License',
    licenseColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',

  },
  {
    icon: BookOpen,
    name: 'Fate Core',
    slug: 'fate',
    tagline: 'Fiction first, rules second',
    description:
      'A narrative-focused system by Evil Hat Productions where the story drives the mechanics, not the other way around. Play any genre -- sci-fi, noir, fantasy, horror -- with one flexible framework.',
    flavor: [
      'Aspects describe your character in plain language: "Disgraced Knight With a Score to Settle"',
      'Fate points let you invoke aspects for dramatic moments and narrative control',
      'Collaborative world-building -- players help shape the setting, not just inhabit it',
      'Lightweight rules that get out of the way so you can focus on the story',
    ],
    license: 'CC BY 3.0',
    licenseColor: 'text-violet-400 border-violet-500/30 bg-violet-500/10',

  },
  {
    icon: Heart,
    name: 'Daggerheart',
    slug: 'daggerheart',
    tagline: 'Cinematic fantasy from Critical Role',
    description:
      'Darrington Press\'s new TTRPG built for dramatic, character-driven stories. A dual-dice system creates natural tension between hope and fear in every roll.',
    flavor: [
      'Roll two dice (hope and fear) -- which one is higher shapes the narrative outcome',
      'Domains and classes combine to create unique character archetypes',
      'Designed for cinematic, story-forward play with meaningful player choices',
      'Community gaming license lets creators build on the system freely',
    ],
    license: 'DPCGL',
    licenseColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',

  },
];

function renderHero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-rose-700/8" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="font-['IM_Fell_English'] mb-4 text-4xl font-bold text-[hsl(35,25%,92%)] sm:text-5xl lg:text-6xl">
          New to Tabletop RPGs?
        </h1>
        <div className="divider-ornate mx-auto mb-6 max-w-md" />
        <p className="mx-auto mb-4 max-w-2xl text-lg text-[hsl(30,12%,55%)] sm:text-xl">
          Tabletop roleplaying games are collaborative stories you tell with friends,
          guided by rules, shaped by dice, and limited only by imagination.
        </p>
        <p className="mx-auto max-w-2xl text-base text-[hsl(30,12%,45%)]">
          No experience needed. This page will get you started.
        </p>
      </div>
    </section>
  );
}

function renderWhatIs() {
  return (
    <section className="relative py-16">
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="animate-unfurl iron-brackets texture-parchment rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-carved mb-2 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)] sm:text-3xl">
              What is a TTRPG?
            </h2>
            <p className="mx-auto max-w-3xl text-[hsl(35,20%,75%)]">
              A tabletop roleplaying game is part improv theater, part strategy game,
              part social hangout. Here is how it works.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
            {renderWhatIsCards()}
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-[hsl(30,12%,50%)]">
            That is the whole idea. The rules exist to add stakes and surprise --
            everything else is you and your friends telling a story together.
          </p>
        </div>
      </div>
    </section>
  );
}

function renderWhatIsCards() {
  const items = [
    {
      icon: Users,
      title: 'Players & Characters',
      text: 'Each player creates a character -- a hero with strengths, flaws, and a backstory. You decide what your character says and does.',
    },
    {
      icon: Drama,
      title: 'The Game Master',
      text: 'One person (the GM) describes the world, plays the NPCs, and sets the stage. Think narrator meets improv director.',
    },
    {
      icon: Dice5,
      title: 'Dice & Rules',
      text: 'When the outcome is uncertain, you roll dice. The rules tell you how to resolve combat, persuasion, magic, and everything in between.',
    },
    {
      icon: MessageSquare,
      title: 'Collaborative Story',
      text: 'There is no script. The story emerges from everyone\'s choices. Your plan might work, or it might go spectacularly sideways. Both are great.',
    },
  ];

  return items.map((item) => {
    const Icon = item.icon;
    return (
      <div
        key={item.title}
        className="rounded-md border border-[hsl(24,14%,22%)] bg-[hsl(24,14%,10%)] p-4"
      >
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-5 w-5 text-amber-500" />
          <h3 className="font-[Cinzel] text-sm font-semibold text-[hsl(35,25%,92%)]">
            {item.title}
          </h3>
        </div>
        <p className="text-sm text-[hsl(30,12%,55%)]">{item.text}</p>
      </div>
    );
  });
}

function renderSystemCards(navigate: ReturnType<typeof useNavigate>) {
  return gameSystems.map((system, index) => {
    const Icon = system.icon;
    return (
      <div
        key={system.name}
        className="animate-unfurl iron-brackets texture-parchment rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] p-6 transition-all hover:border-amber-500/30 sm:p-8"
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-strong bg-amber-600/20 shadow-glow-sm">
              <Icon className="h-7 w-7 text-amber-500" />
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <h3 className="font-[Cinzel] text-xl font-semibold text-[hsl(35,25%,92%)]">
                {system.name}
              </h3>
              <span
                className={`rounded-full border px-2.5 py-0.5 font-[Cinzel] text-[10px] font-bold tracking-widest uppercase ${system.licenseColor}`}
              >
                {system.license}
              </span>
            </div>
            <p className="mb-3 font-['IM_Fell_English'] text-sm italic text-amber-400/80">
              {system.tagline}
            </p>
            <p className="mb-4 text-sm text-[hsl(35,20%,75%)]">
              {system.description}
            </p>
            <ul className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {system.flavor.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                  <span className="text-sm text-[hsl(30,12%,55%)]">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(`/srd/${system.slug}`)}
              className="inline-flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-2 font-[Cinzel] text-xs font-semibold tracking-wider text-amber-400 uppercase transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-[0_0_12px_hsla(38,80%,50%,0.1)]"
            >
              <ScrollText className="h-4 w-4" />
              Browse the Free Rules
              <ArrowRight className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </div>
      </div>
    );
  });
}

function renderFablheimHelps() {
  return (
    <section className="relative bg-[hsl(24,14%,10%)]/50 py-16">
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-carved mb-4 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)] sm:text-3xl">
            You Don't Need to Memorize the Rules
          </h2>
          <p className="mx-auto max-w-2xl text-[hsl(30,12%,55%)]">
            Fablheim has these SRDs built right in. Here is what that means for you.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            {
              icon: Sparkles,
              title: 'AI Rule Lookups',
              description:
                'Ask Fablheim\'s AI a rules question mid-session and get an answer grounded in actual SRD content -- not a hallucinated guess.',
            },
            {
              icon: Shield,
              title: 'System-Aware Tools',
              description:
                'When you generate an NPC or encounter, the AI knows your system\'s rules -- ability scores for D&D, three-action economy for Pathfinder, aspects for Fate.',
            },
            {
              icon: BookOpen,
              title: 'Learn as You Play',
              description:
                'You don\'t need to read a 400-page rulebook before session one. Look things up when you need them, right from your campaign dashboard.',
            },
            {
              icon: Users,
              title: 'Every System, One App',
              description:
                'Run a D&D campaign on Mondays and Pathfinder on Thursdays. Fablheim supports multiple systems from a single account.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] p-5 texture-parchment"
              >
                <div className="mb-3 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-amber-500" />
                  <h3 className="font-[Cinzel] text-base font-semibold text-[hsl(35,25%,92%)]">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-[hsl(30,12%,55%)]">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function NewToTTRPGsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="vignette grain-overlay min-h-screen bg-[hsl(24,18%,6%)]">
      {/* Navigation */}
      <nav className="texture-wood sticky top-0 z-50 border-b border-gold bg-[hsl(24,18%,6%)]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img src="/fablheim-logo.png" alt="Fablheim" className="h-9 w-9 rounded-md shadow-glow-sm animate-candle" />
              <span className="font-['Cinzel_Decorative'] text-glow-gold text-xl font-bold text-[hsl(35,25%,92%)]">
                Fablheim
              </span>
            </button>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Home
              </Button>
              <Button variant="ghost" onClick={() => navigate('/how-it-works')}>
                How It Works
              </Button>
              <Button variant="ghost" onClick={() => navigate('/srd')}>
                SRD
              </Button>
              {user ? (
                <Button onClick={() => navigate('/app')}>
                  Dashboard
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/register')}>Enter the Realm</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      {renderHero()}

      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* What is a TTRPG? */}
      {renderWhatIs()}

      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* Game Systems */}
      <section className="relative py-16">
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-carved mb-4 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)] sm:text-3xl">
              Choose Your System
            </h2>
            <p className="mx-auto max-w-2xl text-[hsl(30,12%,55%)]">
              Each game has its own rules, tone, and flavor. All of these systems publish
              free rulesets so you can read before you buy -- or just play for free.
            </p>
          </div>

          <div className="space-y-6">
            {renderSystemCards(navigate)}
          </div>
        </div>
      </section>

      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* How Fablheim Helps */}
      {renderFablheimHelps()}

      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="iron-brackets border-medieval texture-leather rounded-2xl bg-gradient-to-br from-amber-600/15 via-amber-800/10 to-rose-700/15 p-12">
            <h2 className="text-flame mb-4 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)] sm:text-3xl">
              {user ? 'Back to Your Campaigns' : 'Ready to Roll?'}
            </h2>
            <p className="mb-8 text-lg text-[hsl(35,20%,75%)]">
              {user
                ? 'Your campaigns are waiting. Return to your dashboard.'
                : 'Pick a system, gather your friends, and let Fablheim handle the rest. No rulebook required.'}
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/app' : '/register')}
                className="btn-emboss shimmer-gold text-lg px-8"
              >
                {user ? 'Go to Dashboard' : 'Start Your First Campaign'}
                <Zap className="ml-2 h-5 w-5" />
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/how-it-works')}
                  className="text-lg px-8"
                >
                  See How It Works
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
            {!user && (
              <p className="mt-4 text-sm text-[hsl(30,12%,55%)]">
                No gold required &middot; Free forever tier
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="texture-wood relative border-t border-[hsl(24,14%,15%)] py-12">
        <div className="divider-ornate absolute top-0 right-0 left-0" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <img src="/fablheim-logo.png" alt="Fablheim" className="h-8 w-8 rounded-md shadow-glow-sm" />
              <span className="font-['Cinzel_Decorative'] text-glow-gold font-semibold text-[hsl(35,25%,92%)]">
                Fablheim
              </span>
            </div>
            <p className="text-sm text-[hsl(30,12%,55%)]">
              &copy; 2026 Fablheim. Forged for Game Masters, by Game Masters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
