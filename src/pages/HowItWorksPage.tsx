import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Book,
  Users,
  Map,
  Sparkles,
  Shield,
  ArrowRight,
  Zap,
  BookOpen,
  Crown,
  Swords,
  UserPlus,
  Clock,
  CheckCircle,
  Radio,
  Globe,
  Compass,
  ChevronLeft,
  Dice5,
  NotebookPen,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

type Track = 'gm' | 'player';

interface FeatureSection {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tagline: string;
  bullets: string[];
  comingSoon?: boolean;
}

const gmSections: FeatureSection[] = [
  {
    icon: Book,
    title: 'Create a Campaign in Minutes',
    tagline:
      'Pick your system, name your world, and start playing. No setup marathon required.',
    bullets: [
      'Choose from D&D 5e, Pathfinder 2e, Call of Cthulhu, Fate, Daggerheart, or go fully custom',
      'Set your homebrew rules and toggle specific mechanics on or off',
      'Add a description, banner, and session schedule',
      'Manage multiple campaigns from a single dashboard',
    ],
  },
  {
    icon: Map,
    title: 'Build Your World',
    tagline:
      'Locations, NPCs, factions, quests, lore -- all connected, all in one place.',
    bullets: [
      'Create world entries that link together: NPCs live in locations, factions control regions',
      'Control visibility so players only see what you reveal',
      'Your world data feeds the AI -- the more you build, the smarter it gets',
      'Filter, search, and browse across every entry in your campaign',
    ],
  },
  {
    icon: Users,
    title: 'Invite Your Players',
    tagline:
      'Share a link or send an email. Your party assembles in seconds.',
    bullets: [
      'Generate a shareable invite link for instant joining',
      'Send email invitations directly from the app',
      'Players create an account and land in your campaign immediately',
      'Promote trusted players to Co-GM for shared worldbuilding access',
    ],
  },
  {
    icon: Sparkles,
    title: 'AI Tools That Save Your Prep',
    tagline:
      '"Oh shit" buttons for when you need an NPC, encounter, or location right now.',
    bullets: [
      'Generate NPCs, encounters with XP budgeting, locations, taverns, shops, factions, and plot hooks on the fly',
      'Session recap: jot notes during play, AI polishes them into a structured summary with key moments',
      'Rule lookups grounded in actual SRD content -- not hallucinated answers',
      'Everything is a suggestion -- you review and edit before anything goes live',
    ],
  },
  {
    icon: BookOpen,
    title: 'Campaign Notebook',
    tagline:
      'Your private GM workspace. Works great on its own -- and makes AI dramatically better.',
    bullets: [
      'Organize session notes, plot threads, world lore, NPC details, and player tracking by category',
      'Tag, pin, and link notes to specific sessions for quick reference',
      'Works without AI: a full-featured notebook for prep and in-session notes',
      'When you use AI, the notebook gives it context about YOUR campaign -- not generic content',
    ],
  },
  {
    icon: Radio,
    title: 'Run Live Sessions',
    tagline:
      'Real-time session management with your whole party connected.',
    bullets: [
      'See who is online in your session room with live connection status',
      'Dice rolling with full history, broadcast to the whole table',
      'Initiative tracking for combat encounters with turn order management',
      'Take session notes live and generate AI recaps afterward',
    ],
  },
  {
    icon: Compass,
    title: 'Coming Soon',
    tagline:
      'These features are being forged in the workshop.',
    bullets: [
      'Battle maps with AI generation and a community library',
      'AI Game Master for solo and group one-shots',
      'Voice narration for AI GM sessions',
    ],
    comingSoon: true,
  },
];

const playerSections: FeatureSection[] = [
  {
    icon: UserPlus,
    title: 'Join a Campaign',
    tagline:
      'Get an invite from your GM and you are in. No hoops, no friction.',
    bullets: [
      'Join via a shared link or email invite from your GM',
      'Create an account and see your campaign immediately',
      'Accept or decline invitations at your pace',
      'Join multiple campaigns across different groups',
    ],
  },
  {
    icon: Shield,
    title: 'Create Your Character',
    tagline:
      'Build your hero with everything your GM needs -- and an AI brainstorming partner if you want one.',
    bullets: [
      'Set ability scores, class, race, level, backstory, and passive checks',
      'AI brainstorming: get backstory ideas, personality suggestions, and build recommendations tailored to your system',
      'AI helps you get started -- you make every final decision',
      'Full manual creation if you prefer to do it yourself',
    ],
  },
  {
    icon: Swords,
    title: 'Play Sessions',
    tagline:
      'Connect to your GM\'s live session and play in real time.',
    bullets: [
      'Join your GM\'s live session room with real-time connection',
      'Roll dice with full history, visible to the whole table',
      'Track initiative during combat encounters',
      'See who else is connected and ready to play',
    ],
  },
  {
    icon: Clock,
    title: 'Stay in the Loop',
    tagline:
      'Session recaps so you never forget what happened last time.',
    bullets: [
      'Browse session history for every campaign you belong to',
      'Read AI-polished session summaries with key moments and hooks',
      'Personal notes space for your own tracking and reminders',
      'Never lose track of where the story left off',
    ],
  },
  {
    icon: Crown,
    title: 'Free vs Upgraded',
    tagline:
      'You never need to pay to play. But if you want AI on your side, it\'s there.',
    bullets: [
      'Free tier: character sheet, dice rolling, session tracking, join any campaign -- no paywall to play',
      'Upgraded tier: AI character creation assistant, backstory brainstorming, personal AI session recaps',
      'Upgraded tier: quick rule lookups grounded in actual SRD content, character development suggestions',
      'Your GM\'s tier covers campaign-level AI -- your tier covers personal AI tools',
    ],
  },
];

const pricingTiers = [
  {
    name: 'Wanderer',
    price: 'Free',
    tagline: 'Everything you need to play',
    highlights: [
      'Unlimited campaigns',
      'Character creation & management',
      'Live sessions & dice rolling',
      'Session history & tracking',
      'World browsing (GM-permitted)',
    ],
  },
  {
    name: 'Hobbyist',
    price: '$4.99/mo',
    tagline: 'AI tools for players and GMs',
    highlights: [
      'Everything in Wanderer',
      'AI session summaries (10/mo)',
      'AI NPC & encounter generation',
      'Rule lookups (SRD-grounded)',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Game Master',
    price: '$9.99/mo',
    tagline: 'Unlimited arcane power',
    highlights: [
      'Everything in Hobbyist',
      'Unlimited AI features',
      'Advanced worldbuilding AI',
      'Campaign analytics',
      'Premium support',
    ],
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTrack, setActiveTrack] = useState<Track>('gm');

  const sections = activeTrack === 'gm' ? gmSections : playerSections;

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
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-rose-700/8" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-['IM_Fell_English'] mb-4 text-4xl font-bold text-[hsl(35,25%,92%)] sm:text-5xl lg:text-6xl">
            How Fablheim Works
          </h1>
          <div className="divider-ornate mx-auto mb-6 max-w-md" />
          <p className="mx-auto mb-10 max-w-2xl text-lg text-[hsl(30,12%,55%)] sm:text-xl">
            Whether you command the story or live it, Fablheim gives you the
            tools to make every session legendary.
          </p>

          {/* Track Toggle */}
          <div className="mx-auto inline-flex rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,10%)] p-1">
            <button
              onClick={() => setActiveTrack('gm')}
              className={`flex items-center gap-2 rounded-md px-6 py-2.5 font-[Cinzel] text-sm font-semibold transition-all ${
                activeTrack === 'gm'
                  ? 'bg-amber-600/20 text-amber-400 shadow-glow-sm'
                  : 'text-[hsl(30,12%,55%)] hover:text-[hsl(35,20%,75%)]'
              }`}
            >
              <Globe className="h-4 w-4" />
              For Game Masters
            </button>
            <button
              onClick={() => setActiveTrack('player')}
              className={`flex items-center gap-2 rounded-md px-6 py-2.5 font-[Cinzel] text-sm font-semibold transition-all ${
                activeTrack === 'player'
                  ? 'bg-amber-600/20 text-amber-400 shadow-glow-sm'
                  : 'text-[hsl(30,12%,55%)] hover:text-[hsl(35,20%,75%)]'
              }`}
            >
              <Shield className="h-4 w-4" />
              For Players
            </button>
          </div>
        </div>
      </section>

      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* Feature Sections */}
      <section className="relative py-16">
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className={`animate-unfurl rounded-lg border p-6 transition-all sm:p-8 ${
                    section.comingSoon
                      ? 'border-dashed border-[hsl(24,14%,22%)] bg-[hsl(24,14%,10%)]/60'
                      : 'iron-brackets texture-parchment border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] hover:border-amber-500/30'
                  }`}
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <div className="shrink-0">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                          section.comingSoon
                            ? 'border-[hsl(24,14%,25%)] bg-[hsl(24,14%,15%)]'
                            : 'border-gold-strong bg-amber-600/20 shadow-glow-sm'
                        }`}
                      >
                        <Icon
                          className={`h-7 w-7 ${
                            section.comingSoon
                              ? 'text-[hsl(30,12%,45%)]'
                              : 'text-amber-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <h3
                          className={`font-[Cinzel] text-xl font-semibold ${
                            section.comingSoon
                              ? 'text-[hsl(30,12%,55%)]'
                              : 'text-[hsl(35,25%,92%)]'
                          }`}
                        >
                          {section.title}
                        </h3>
                        {section.comingSoon && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-[Cinzel] text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p
                        className={`mb-4 text-sm ${
                          section.comingSoon
                            ? 'text-[hsl(30,12%,45%)]'
                            : 'text-[hsl(35,20%,75%)]'
                        }`}
                      >
                        {section.tagline}
                      </p>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <CheckCircle
                              className={`mt-0.5 h-4 w-4 shrink-0 ${
                                section.comingSoon
                                  ? 'text-[hsl(30,12%,35%)]'
                                  : 'text-brass'
                              }`}
                            />
                            <span
                              className={`text-sm ${
                                section.comingSoon
                                  ? 'text-[hsl(30,12%,40%)]'
                                  : 'text-[hsl(30,12%,55%)]'
                              }`}
                            >
                              {bullet}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* Coming from Roll20? */}
      <section className="relative bg-[hsl(24,14%,10%)]/50 py-16">
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-carved mb-4 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)] sm:text-3xl">
              Coming from Roll20?
            </h2>
            <p className="mx-auto max-w-2xl text-[hsl(30,12%,55%)]">
              If you have used Roll20, here is what is different about Fablheim.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                icon: RefreshCw,
                title: 'System-Agnostic',
                description:
                  'Not just D&D. Built for Pathfinder 2e, Call of Cthulhu, Fate, Daggerheart, and fully custom systems.',
              },
              {
                icon: Sparkles,
                title: 'AI-Powered GM Tools',
                description:
                  'Generate NPCs, encounters, recaps, and rule lookups on the fly. AI that knows your specific campaign.',
              },
              {
                icon: NotebookPen,
                title: 'Campaign Notebook',
                description:
                  'A private GM workspace that doubles as AI context. The more you write, the smarter your tools get.',
              },
              {
                icon: Dice5,
                title: 'Modern & Fair',
                description:
                  'Clean, modern interface. Free tier covers everything players need. No paywall to play at the table.',
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

      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* Pricing Summary */}
      <section className="relative py-16">
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-carved mb-4 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)] sm:text-3xl">
              Simple Pricing
            </h2>
            <p className="text-[hsl(30,12%,55%)]">
              Start free. Upgrade when you want arcane power.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-lg border p-6 texture-parchment ${
                  tier.popular
                    ? 'border-2 border-gold-strong bg-[hsl(24,14%,13%)] iron-brackets'
                    : 'border-[hsl(24,14%,20%)] bg-[hsl(24,14%,12%)]/80'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-[hsl(35,25%,92%)]"
                      style={{
                        background:
                          'radial-gradient(circle at 40% 38%, hsl(350, 48%, 42%) 0%, hsl(350, 44%, 32%) 60%, hsl(350, 40%, 24%) 100%)',
                        boxShadow:
                          '0 3px 10px hsla(350, 40%, 15%, 0.7), inset 0 -1px 2px hsla(350, 30%, 12%, 0.5)',
                      }}
                    >
                      <Crown className="h-3 w-3" />
                      Popular
                    </span>
                  </div>
                )}

                <div className="mb-4 text-center">
                  <h3 className="font-[Cinzel] text-lg font-bold text-[hsl(35,25%,92%)]">
                    {tier.name}
                  </h3>
                  <p className="font-['IM_Fell_English'] mt-1 text-2xl font-bold text-[hsl(35,25%,92%)]">
                    {tier.price}
                  </p>
                  <p className="mt-1 text-xs text-[hsl(30,12%,55%)]">
                    {tier.tagline}
                  </p>
                </div>

                <ul className="space-y-2">
                  {tier.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                      <span className="text-xs text-[hsl(35,20%,75%)]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="iron-brackets border-medieval texture-leather rounded-2xl bg-gradient-to-br from-amber-600/15 via-amber-800/10 to-rose-700/15 p-12">
            <h2 className="text-flame mb-4 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)] sm:text-3xl">
              {user ? 'Back to Your Campaigns' : 'Ready to Begin?'}
            </h2>
            <p className="mb-8 text-lg text-[hsl(35,20%,75%)]">
              {user
                ? 'Your campaigns are waiting. Return to your dashboard.'
                : 'Create your free account and forge your first campaign in minutes.'}
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/app' : '/register')}
                className="btn-emboss shimmer-gold text-lg px-8"
              >
                {user ? 'Go to Dashboard' : 'Start Your Campaign'}
                <Zap className="ml-2 h-5 w-5" />
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="text-lg px-8"
                >
                  Sign In
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
