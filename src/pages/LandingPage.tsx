import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  Check,
  Coins,
  Compass,
  LifeBuoy,
  ScrollText,
  Sparkles,
  Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageSchema, softwareApplicationSchema } from '@/seo/schema';
import { BILLING_CONFIG } from '@/config/billingConfig';

const pillars = [
  {
    icon: Compass,
    title: 'Campaign Hall',
    body: 'Run campaigns from one place: world entries, encounters, notes, characters, and session planning.',
  },
  {
    icon: Swords,
    title: 'Session Cockpit',
    body: 'Live session view with initiative, chat, dice, encounters, party info, and optional map support.',
  },
  {
    icon: ScrollText,
    title: 'Prep -> Live -> Recap',
    body: 'Campaign stages follow real GM workflow so continuity survives from one session to the next.',
  },
  {
    icon: Sparkles,
    title: 'Optional AI Assist',
    body: 'Credits-based AI for NPCs, encounters, quests, lore, rules Q&A, and recaps. Fully optional.',
  },
  {
    icon: Coins,
    title: 'Transparent Credits',
    body: 'Costs are visible in-product, with subscription credits and one-time packs tracked in one ledger.',
  },
];

const liveTools = [
  'Initiative tracker with turn flow and conditions',
  'Live chat and dice rolls for everyone at the table',
  'Encounter loading and session notes in-session',
  'Battle map grid + tokens with zoom/pan (functional, not a full VTT suite)',
];

const landingFaq = [
  {
    question: 'Do I need AI to use Fablheim?',
    answer: 'No. Core campaign and session runner workflows work without AI.',
  },
  {
    question: 'Does the free tier include AI credits?',
    answer: `No. Free tier includes ${BILLING_CONFIG.freeMonthlyCredits} monthly AI credits.`,
  },
  {
    question: 'Can I buy credits without a subscription?',
    answer: `Yes. You can buy a one-time pack of ${BILLING_CONFIG.creditPack.credits} credits for ${BILLING_CONFIG.creditPack.price}.`,
  },
  {
    question: 'What systems are supported?',
    answer: 'D&D 5e, Pathfinder 2e, Fate Core, and Daggerheart.',
  },
  {
    question: 'Is the battle map required?',
    answer: 'No. Map tools are optional and only load when you run an encounter with a map.',
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
            <Compass className="h-3.5 w-3.5" />
            Campaign Command Hall
          </p>

          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.04] text-[color:var(--mkt-text)] sm:text-5xl lg:text-6xl">
            One Hall,
            <span className="gold-forged block">Every Tool for Session Night</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--mkt-muted)] sm:text-lg">
            Fablheim replaces the tab-juggle with one practical workflow for prep, live play, and recap. Built for GMs
            who want less interface friction and smoother table momentum.
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
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> Prep -&gt; Live -&gt; Recap stages</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> No AI required to run sessions</span>
          </div>
        </div>

        <aside className="grid gap-4 rounded-2xl border border-[color:var(--mkt-border)]/60 bg-[linear-gradient(180deg,hsla(32,28%,16%,0.24)_0%,hsla(24,14%,8%,0.45)_100%)] p-3 shadow-[inset_0_1px_0_hsla(38,36%,70%,0.1),0_16px_34px_hsla(24,34%,4%,0.44)] lg:max-w-[30rem] lg:justify-self-end">
          <article className="mkt-card mkt-card-mounted mkt-card-elevated iron-brackets texture-parchment rounded-xl p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Typical GM flow</p>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Prep encounters, world context, session notes</li>
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Run live with chat, dice, initiative, and map</li>
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> End session into recap and follow-up hooks</li>
            </ul>
          </article>

          <article className="mkt-card mkt-card-mounted rounded-xl bg-[linear-gradient(160deg,hsla(38,84%,56%,0.16)_0%,hsla(18,74%,43%,0.13)_48%,hsla(24,14%,9%,0.9)_100%)] p-5 sm:p-6 lg:ml-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Design stance</p>
            <p className="mt-2 text-[color:var(--mkt-text)]">High ritual mood. Practical session control.</p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Why teams switch</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Stop juggling chat, docs, initiative trackers, and map tabs
          </h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            Fablheim is built around one command hall so your table can focus on decisions and story instead of tool
            switching.
          </p>
        </header>

        <article className="mkt-card mkt-card-mounted iron-brackets mt-8 overflow-hidden rounded-xl">
          <div className="grid items-stretch md:grid-cols-2">
            <section className="flex h-full min-w-0 flex-col p-6 sm:p-7">
              <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">WITHOUT A COMMAND HALL</h3>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="min-w-0 leading-relaxed">Momentum breaks during tool switches</span>
                </li>
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="min-w-0 leading-relaxed">Prep notes and live controls drift apart</span>
                </li>
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="min-w-0 leading-relaxed">Recaps and next hooks are harder to keep consistent</span>
                </li>
              </ul>
            </section>

            <section className="flex h-full min-w-0 flex-col border-t border-[color:var(--mkt-border)] p-6 sm:p-7 md:border-l md:border-t-0">
              <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">WITH FABLHEIM</h3>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
                {[
                  'Campaign entities, encounters, and notebook stay in one hall',
                  'Session Cockpit keeps live tools side-by-side',
                  'Prep -> Live -> Recap preserves continuity',
                ].map((text) => (
                  <li key={text} className="grid grid-cols-[0.9rem_1fr] items-start gap-3">
                    <Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" aria-hidden="true" />
                    <span className="min-w-0 leading-relaxed">{text}</span>
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Core pillars</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Truth-based capabilities, live today</h2>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={`mkt-card rounded-xl p-5 ${index === 0 || index === 3 ? 'mkt-card-mounted' : ''}`}
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

function SessionCockpitSection() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Live session runner</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Guided Session Cockpit</h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            When the session goes live, the app shifts into a dedicated cockpit so the GM can keep pace and players can
            stay synced.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-[color:var(--mkt-muted)]">
            {liveTools.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--mkt-success)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-[color:var(--mkt-muted)]">
            In-person and hybrid friendly: GM runs from one device, players join and use their own character views.
          </p>
        </div>

        <article className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--mkt-muted)]">Cockpit snapshot</p>
          <div className="mt-4 grid grid-cols-6 gap-2">
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Initiative</div>
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Battle Map</div>
            <div className="col-span-4 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Chat + Dice</div>
            <div className="col-span-2 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Party</div>
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Encounters</div>
            <div className="col-span-3 rounded border border-[color:var(--mkt-border)] bg-black/25 px-2 py-2 text-xs text-[color:var(--mkt-muted)]">Session Notes</div>
          </div>
          <p className="mt-4 text-sm text-[color:var(--mkt-muted)]">Battle maps are intentionally simple: map background, grid settings, token placement, and turn-by-turn play.</p>
        </article>
      </div>
    </section>
  );
}

function RulesPricingAndAi({ onRules, onPricing }: { onRules: () => void; onPricing: () => void }) {
  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <BookOpenText className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Rules Library</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Public SRD lookup across D&D 5e, Pathfinder 2e, Fate, and Daggerheart.</p>
            <Button variant="outline" onClick={onRules} className="mt-4">Open Rules Library</Button>
          </article>

          <article className="mkt-card rounded-lg p-5">
            <Coins className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Pricing reality</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Free tier runs the core app with {BILLING_CONFIG.freeMonthlyCredits} monthly AI credits. Paid tiers add monthly AI credits.</p>
            <p className="mt-2 text-xs text-[color:var(--mkt-muted)]">Hobbyist {BILLING_CONFIG.tiers.hobbyist.monthlyCredits}, Game Master {BILLING_CONFIG.tiers.pro.monthlyCredits}, Pro {BILLING_CONFIG.tiers.professional.monthlyCredits} credits / month.</p>
            <p className="mt-2 text-xs text-[color:var(--mkt-muted)]">{BILLING_CONFIG.creditPack.price} pack: {BILLING_CONFIG.creditPack.credits} base credits. Subscriber bonuses: {BILLING_CONFIG.creditPack.bonusCreditsByTier.hobbyist}/{BILLING_CONFIG.creditPack.bonusCreditsByTier.pro}/{BILLING_CONFIG.creditPack.bonusCreditsByTier.professional}.</p>
          </article>

          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <LifeBuoy className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">No AI required</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">You can plan and run full sessions without spending credits. AI is an optional assist lane.</p>
            <Button variant="outline" onClick={onPricing} className="mt-4">See pricing details</Button>
          </article>
        </div>
      </div>
    </section>
  );
}

function LandingFaq() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">FAQ</p>
        <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Common Questions</h2>
        <article className="mkt-card mkt-card-mounted mt-4 rounded-xl p-5">
          <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Pack FAQ</h3>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--mkt-muted)]">
            <li>Packs are base credits + subscriber bonus.</li>
            <li>Bonus applies only if your subscription is active.</li>
          </ul>
        </article>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {landingFaq.map((item) => (
            <article key={item.question} className="mkt-card rounded-xl p-5">
              <h3 className="font-semibold text-[color:var(--mkt-text)]">{item.question}</h3>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--mkt-muted)]">Ready for tonight</p>
          <h2 className="mt-3 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Build the hall. Run the session. Keep the story moving.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[color:var(--mkt-muted)]">
            Practical campaign management for real tables, with optional AI when you need fast backup.
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
      <SEO
        title="Fablheim | TTRPG Campaign Manager and Session Runner"
        description="Fablheim is a command hall for tabletop GMs: prep, live session cockpit, and recap continuity with optional credits-based AI."
        canonicalPath="/"
      />
      <JsonLd
        data={softwareApplicationSchema({
          name: 'Fablheim',
          path: '/',
          description:
            'Campaign management and live session runner for tabletop RPGs with prep, live, and recap continuity.',
        })}
      />
      <JsonLd data={faqPageSchema('/', landingFaq)} />

      <MarketingNavbar
        user={user}
        links={[
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'Pricing', to: '/pricing' },
          { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <Hero loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />
      <ProblemFraming />
      <Pillars />
      <SessionCockpitSection />
      <RulesPricingAndAi onRules={() => navigate('/srd')} onPricing={() => navigate('/pricing')} />
      <LandingFaq />
      <ClosingCta loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />

      <MarketingFooter />
    </MarketingPage>
  );
}
