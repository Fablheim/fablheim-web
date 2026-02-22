import { useNavigate } from 'react-router-dom';
import {
  Book,
  Users,
  ScrollText,
  Map,
  Sparkles,
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: Book,
    title: 'Campaign Tomes',
    description:
      'Chronicle multiple campaigns within a single grand archive. Track sessions, NPCs, locations, and quests -- all bound in one legendary tome.',
  },
  {
    icon: ScrollText,
    title: 'Session Scrolls',
    description:
      'Inscribe detailed session notes as your saga unfolds. Never lose the thread of your story or forget where fate left you.',
  },
  {
    icon: Users,
    title: 'Fellowship Ready',
    description:
      'Summon your party with a simple link or raven. Every adventurer stays on the same page of the chronicle.',
  },
  {
    icon: Map,
    title: 'World Forging',
    description:
      'Forge realms with locations, factions, relics, and quests. Keep every thread of your world woven and connected.',
  },
  {
    icon: Shield,
    title: 'Hero Tracking',
    description:
      'Track player characters, passive scores, and vital details. Quick reference when the dice are rolling.',
  },
  {
    icon: Sparkles,
    title: 'Arcane Assistant',
    description:
      "Let the Arcane Assistant conjure session summaries and prep work. Completely optional -- you wield the quill.",
  },
];

const pricingTiers = [
  {
    name: 'Wanderer',
    price: '$0',
    period: 'forever',
    description: 'Begin your journey through the realms',
    features: [
      'Unlimited campaigns',
      'Session scrolls & tracking',
      'Hero management',
      'Summon up to 10 adventurers per campaign',
      'World forging tools',
      'Tavern community support',
    ],
    cta: 'Enter the Tavern',
    highlight: false,
  },
  {
    name: 'Hobbyist',
    price: '$4.99',
    period: '/month',
    description: 'For Game Masters who seek arcane aid',
    features: [
      'Everything in Wanderer',
      'Arcane session summaries (10/month)',
      'Arcane NPC conjurer',
      'Arcane plot divinations',
      'Saved workspace layouts',
      'Priority raven support',
    ],
    cta: 'Claim Your Seat',
    highlight: true,
  },
  {
    name: 'Game Master',
    price: '$9.99',
    period: '/month',
    description: 'For legendary GMs commanding multiple realms',
    features: [
      'Everything in Hobbyist',
      'Unlimited arcane features',
      'Advanced world forging',
      'Campaign war-table analytics',
      'Custom guild branding',
      'Premium raven support',
    ],
    cta: 'Ascend the Throne',
    highlight: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="vignette grain-overlay min-h-screen bg-[hsl(24,18%,6%)]">
      {/* Navigation */}
      <nav className="texture-wood sticky top-0 z-50 border-b border-gold bg-[hsl(24,18%,6%)]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/fablheim-logo.png" alt="Fablheim" className="h-9 w-9 rounded-md shadow-glow-sm animate-candle" />
              <span className="font-['Cinzel_Decorative'] text-glow-gold text-xl font-bold text-[hsl(35,25%,92%)]">
                Fablheim
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/how-it-works')}>
                How It Works
              </Button>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')}>Enter the Realm</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Dramatic torch-lit background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/15 via-transparent to-rose-700/10" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 600px 400px at 15% 30%, hsla(25, 80%, 40%, 0.12) 0%, transparent 70%), radial-gradient(ellipse 500px 350px at 85% 60%, hsla(15, 90%, 35%, 0.08) 0%, transparent 70%), radial-gradient(ellipse 300px 300px at 50% 10%, hsla(38, 90%, 50%, 0.06) 0%, transparent 60%)',
          }}
        />

        {/* Floating dust particles */}
        <div
          className="animate-dust pointer-events-none absolute left-[12%] top-0 h-1 w-1 rounded-full bg-amber-400/30"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="animate-dust pointer-events-none absolute left-[35%] top-0 h-1.5 w-1.5 rounded-full bg-amber-300/20"
          style={{ animationDelay: '3s' }}
        />
        <div
          className="animate-dust pointer-events-none absolute left-[58%] top-0 h-1 w-1 rounded-full bg-amber-500/25"
          style={{ animationDelay: '7s' }}
        />
        <div
          className="animate-dust pointer-events-none absolute left-[78%] top-0 h-0.5 w-0.5 rounded-full bg-amber-300/30"
          style={{ animationDelay: '11s' }}
        />
        <div
          className="animate-dust pointer-events-none absolute left-[45%] top-0 h-1 w-1 rounded-full bg-amber-400/20"
          style={{ animationDelay: '5s' }}
        />
        <div
          className="animate-dust pointer-events-none absolute left-[90%] top-0 h-1.5 w-1.5 rounded-full bg-amber-200/15"
          style={{ animationDelay: '9s' }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
          <div className="text-center">
            <h1 className="font-['IM_Fell_English'] mb-6 text-5xl font-bold text-[hsl(35,25%,92%)] sm:text-7xl lg:text-8xl">
              Your Epic Campaign,
              <br />
              <span className="text-flame bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Forged in Adventure
              </span>
            </h1>

            <div className="divider-ornate mx-auto mb-6 max-w-md" />

            <p className="mx-auto mb-2 max-w-2xl font-[Cinzel] text-xl text-[hsl(35,20%,75%)] sm:text-2xl">
              Chronicle your campaigns. Rally your fellowship. Shape your world.
            </p>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[hsl(30,12%,55%)]">
              Arcane tools when you need them -- but you always hold the quill.
            </p>

            <div className="divider-ornate mx-auto mb-10 max-w-md" />

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="btn-emboss shimmer-gold text-lg px-8"
              >
                Begin Your Quest
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-lg px-8"
              >
                Sign In
              </Button>
            </div>
            <p className="mt-4 text-sm text-[hsl(30,12%,55%)]">
              No gold required &middot; Free forever tier
            </p>
          </div>
        </div>
      </section>

      {/* Ornate divider between sections */}
      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* Features Grid */}
      <section className="relative bg-[hsl(24,14%,10%)]/50 py-20">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-carved mb-4 font-[Cinzel] text-3xl font-bold text-[hsl(35,25%,92%)] sm:text-4xl">
              Your Armory of Legendary Tools
            </h2>
            <p className="text-xl text-[hsl(30,12%,55%)]">
              Forged for Game Masters, by Game Masters
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="iron-brackets hover-lift animate-unfurl texture-parchment rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] p-6 transition-all hover:border-amber-500/50 hover:shadow-glow"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div className="border-gold-strong shadow-glow-sm mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-amber-600/20">
                    <Icon className="h-7 w-7 text-amber-500" />
                  </div>
                  <h3 className="mb-2 font-[Cinzel] text-xl font-semibold text-[hsl(35,25%,92%)]">
                    {feature.title}
                  </h3>
                  <p className="text-[hsl(30,12%,55%)]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ornate divider */}
      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* How It Works */}
      <section className="relative py-20">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-carved mb-4 font-[Cinzel] text-3xl font-bold text-[hsl(35,25%,92%)] sm:text-4xl">
              Three Steps to Legend
            </h2>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Connecting line behind steps (desktop only) */}
            <div
              className="absolute top-8 left-[16.67%] right-[16.67%] hidden h-px md:block"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, hsla(38, 50%, 40%, 0.3) 20%, hsla(38, 50%, 40%, 0.3) 80%, transparent 100%)',
              }}
            />

            {[
              {
                step: '1',
                title: 'Forge Your Campaign',
                description:
                  'Establish your campaign in moments. Build your world as the story unfolds.',
              },
              {
                step: '2',
                title: 'Summon Your Party',
                description:
                  'Send ravens or share a portal link. Your fellowship assembles instantly.',
              },
              {
                step: '3',
                title: 'Write Your Legend',
                description:
                  'Take notes, track heroes, build your world. Everything in one hallowed hall.',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div
                  className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)]"
                  style={{
                    background:
                      'radial-gradient(circle at 40% 38%, hsl(350, 48%, 42%) 0%, hsl(350, 44%, 32%) 60%, hsl(350, 40%, 24%) 100%)',
                    boxShadow:
                      '0 2px 8px hsla(350, 40%, 15%, 0.6), inset 0 -1px 3px hsla(350, 30%, 12%, 0.5), inset 0 1px 2px hsla(350, 50%, 55%, 0.2)',
                  }}
                >
                  {item.step}
                </div>
                <h3 className="text-embossed mb-2 font-[Cinzel] text-xl font-semibold text-[hsl(35,25%,92%)]">
                  {item.title}
                </h3>
                <p className="text-[hsl(30,12%,55%)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ornate divider */}
      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* Pricing */}
      <section className="relative bg-[hsl(24,14%,10%)]/50 py-20">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-carved mb-4 font-[Cinzel] text-3xl font-bold text-[hsl(35,25%,92%)] sm:text-4xl">
              Choose Your Allegiance
            </h2>
            <p className="text-xl text-[hsl(30,12%,55%)]">
              Begin as a Wanderer. Ascend when you seek arcane power.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`tavern-card texture-parchment relative rounded-lg border p-8 ${
                  tier.highlight
                    ? 'iron-brackets animate-candle border-2 border-gold-strong bg-[hsl(24,14%,13%)]'
                    : 'border-[hsl(24,14%,20%)] bg-[hsl(24,14%,12%)]/80'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold text-[hsl(35,25%,92%)]"
                      style={{
                        background:
                          'radial-gradient(circle at 40% 38%, hsl(350, 48%, 42%) 0%, hsl(350, 44%, 32%) 60%, hsl(350, 40%, 24%) 100%)',
                        boxShadow:
                          '0 3px 10px hsla(350, 40%, 15%, 0.7), inset 0 -1px 2px hsla(350, 30%, 12%, 0.5), inset 0 1px 1px hsla(350, 50%, 55%, 0.2)',
                      }}
                    >
                      <Crown className="h-4 w-4" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6 text-center">
                  <h3 className="mb-2 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)]">
                    {tier.name}
                  </h3>
                  <div className="mb-2">
                    <span className="font-['IM_Fell_English'] text-4xl font-bold text-[hsl(35,25%,92%)]">
                      {tier.price}
                    </span>
                    <span className="text-[hsl(30,12%,55%)]">{tier.period}</span>
                  </div>
                  <p className="text-sm text-[hsl(30,12%,55%)]">{tier.description}</p>
                </div>

                <ul className="mb-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brass" />
                      <span className="text-sm text-[hsl(35,20%,75%)]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate('/register')}
                  variant={tier.highlight ? 'primary' : 'outline'}
                  className={`w-full ${tier.highlight ? 'btn-emboss shimmer-gold' : ''}`}
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ornate divider */}
      <div className="divider-ornate mx-auto max-w-3xl" />

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="iron-brackets border-medieval texture-leather rounded-2xl bg-gradient-to-br from-amber-600/15 via-amber-800/10 to-rose-700/15 p-12">
            <h2 className="text-flame mb-4 font-[Cinzel] text-3xl font-bold text-[hsl(35,25%,92%)] sm:text-4xl">
              Ready to Forge Your Legend?
            </h2>
            <p className="mb-8 text-xl text-[hsl(35,20%,75%)]">
              Join the fellowship of Game Masters already shaping legendary campaigns with
              Fablheim
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="btn-emboss shimmer-gold text-lg px-8"
            >
              Begin Your Quest
              <Zap className="ml-2 h-5 w-5" />
            </Button>
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
