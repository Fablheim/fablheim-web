import { useMemo, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  Check,
  Coins,
  Compass,
  Map,
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
import { faqPageSchema, howToSchema } from '@/seo/schema';
import { BILLING_CONFIG } from '@/config/billingConfig';

type Track = 'gm' | 'player';

type Step = {
  title: string;
  body: string;
  bullets: string[];
  icon: ComponentType<{ className?: string }>;
};

const gmSteps: Step[] = [
  {
    title: 'Prep in the Campaign Hall',
    body: 'Before session night, build what you need in one place instead of splitting prep across multiple apps.',
    bullets: [
      'Create and organize world entities, encounters, characters, and notes',
      'Use stage flow (prep/live/recap) to keep campaign state clear',
      'Invite players by link or email and assign campaign access',
    ],
    icon: Compass,
  },
  {
    title: 'Run the Session Cockpit',
    body: 'When live starts, tools shift into a focused session view built for pace and clarity.',
    bullets: [
      'Initiative tracker, encounter controls, party status, chat, and dice',
      'Battle map with configurable grid and token movement',
      'Rules lookup and session notes available during play',
    ],
    icon: Swords,
  },
  {
    title: 'Recap and Continue',
    body: 'End session into recap and carry forward what happened without losing continuity.',
    bullets: [
      'Session recap view supports copy and regenerate actions',
      'Campaign returns to prep with updated context',
      'Notes and hooks are ready for next session planning',
    ],
    icon: ScrollText,
  },
  {
    title: 'Use AI Only When Needed',
    body: 'AI sits in an optional lane for fast support moments, not as a required workflow.',
    bullets: [
      'Tools include NPC, encounter, quest, lore, and rules assistant',
      `Free tier has ${BILLING_CONFIG.freeMonthlyCredits} monthly AI credits; paid tiers add monthly credits`,
      'Credit costs and balance are visible inside the app',
    ],
    icon: Sparkles,
  },
];

const playerSteps: Step[] = [
  {
    title: 'Join Quickly',
    body: 'Players join campaigns by invite and access table resources without a paid plan.',
    bullets: [
      'Join by invite link or email token',
      'Players can participate on free accounts',
      'Shared campaign context appears after joining',
    ],
    icon: Users,
  },
  {
    title: 'Create and Use Character Data',
    body: 'Character creation and updates stay in one account-linked place.',
    bullets: [
      'Character wizard for guided setup',
      'Character details available during active sessions',
      'GM and players both see relevant party context',
    ],
    icon: Map,
  },
  {
    title: 'Stay Synced During Play',
    body: 'Live tools keep players aligned with session state as combat and story evolve.',
    bullets: [
      'Live chat and dice events',
      'Initiative visibility and turn context',
      'Battle map tokens and shared board state',
    ],
    icon: MessageSquare,
  },
  {
    title: 'Catch Up Between Sessions',
    body: 'Recap and notes make it easier to return to the campaign after breaks.',
    bullets: [
      'Recap access for session outcomes',
      'Follow-up hooks stay tied to campaign context',
      'Less repeated explanation at the next session start',
    ],
    icon: BookOpenText,
  },
];

const howToFaq = [
  {
    question: 'Do I need AI to run a session with Fablheim?',
    answer: 'No. Core prep, live session controls, and recap flow work without AI.',
  },
  {
    question: 'What does live session mode include?',
    answer: 'Initiative, chat, dice, encounters, notes, and optional map support.',
  },
  {
    question: 'Does free tier include monthly AI credits?',
    answer: `No. Free tier includes ${BILLING_CONFIG.freeMonthlyCredits} monthly AI credits.`,
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
            <Compass className="h-3.5 w-3.5" />
            Prep -&gt; Live -&gt; Recap
          </p>

          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.05] text-[color:var(--mkt-text)] sm:text-5xl lg:text-6xl">
            How Fablheim Works
            <span className="gold-forged block">Campaign Hall to Session Cockpit</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--mkt-muted)] sm:text-lg">
            The product follows actual table rhythm: prep what matters, run live with fewer interruptions, then recap
            into the next session.
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
              <p className="mt-1 text-xs text-[color:var(--mkt-muted)]">World, encounters, notes</p>
            </div>
            <div className="rounded-lg border border-[color:var(--mkt-border)] bg-black/25 p-3">
              <p className="font-[Cinzel] text-sm text-[color:var(--mkt-text)]">Live</p>
              <p className="mt-1 text-xs text-[color:var(--mkt-muted)]">Initiative, dice, chat, map</p>
            </div>
            <div className="rounded-lg border border-[color:var(--mkt-border)] bg-black/25 p-3">
              <p className="font-[Cinzel] text-sm text-[color:var(--mkt-text)]">Recap</p>
              <p className="mt-1 text-xs text-[color:var(--mkt-muted)]">Summary + next hooks</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[color:var(--mkt-muted)]">AI tools exist for fast support moments, but the workflow still works fully without AI.</p>
        </article>
      </div>
    </section>
  );
}

function StageWorkflow() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-18 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-10 max-w-4xl" />
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Session Stages"
          title="Prep, run, and recap in one lifecycle"
          body="Campaign stage is explicit in the product so the table always knows what mode it is in."
        />

        <div className="mt-8 grid items-stretch gap-4 md:grid-cols-3">
          <article className="mkt-card mkt-card-mounted rounded-xl p-5 h-full flex flex-col">
            <p className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Prep</p>
            <p className="mt-3 text-sm text-[color:var(--mkt-muted)]">Build encounters, adjust world context, and organize notes before players arrive.</p>
          </article>
          <article className="mkt-card mkt-card-mounted rounded-xl p-5 h-full flex flex-col">
            <p className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Live</p>
            <p className="mt-3 text-sm text-[color:var(--mkt-muted)]">Switch to session runner with initiative, combat controls, chat, dice, and map tools.</p>
          </article>
          <article className="mkt-card mkt-card-mounted rounded-xl p-5 h-full flex flex-col">
            <p className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Recap</p>
            <p className="mt-3 text-sm text-[color:var(--mkt-muted)]">Close the session, review recap output, and carry forward key moments to next prep.</p>
          </article>
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
          title={activeTrack === 'gm' ? 'Game Master Path' : 'Player Path'}
          body={
            activeTrack === 'gm'
              ? 'This path reflects the current GM workflow in the app today.'
              : 'This path reflects what players currently do in invited campaigns.'
          }
        />

        <div className="mt-6 inline-flex rounded-lg border border-[color:var(--mkt-border)] bg-[color:var(--mkt-surface-2)] p-1">
          <button
            type="button"
            onClick={() => setActiveTrack('gm')}
            className={`mkt-tab px-5 py-2.5 text-sm font-semibold ${activeTrack === 'gm' ? 'mkt-tab-active' : ''}`}
          >
            Game Master
          </button>
          <button
            type="button"
            onClick={() => setActiveTrack('player')}
            className={`mkt-tab px-5 py-2.5 text-sm font-semibold ${activeTrack === 'player' ? 'mkt-tab-active' : ''}`}
          >
            Player
          </button>
        </div>

        <div className="mt-8 grid items-stretch gap-4 md:grid-cols-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="mkt-card mkt-card-mounted rounded-xl p-5 h-full flex flex-col">
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

function NoAiRequired() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <article className="mkt-card mkt-card-mounted rounded-xl border-medieval p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">No AI Required</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">Run full sessions without AI</h2>
          <p className="mt-3 text-[color:var(--mkt-muted)]">
            Core campaign and session runner features are available without AI usage. AI tools are optional helpers for
            speed under pressure, especially for NPCs, encounters, quests, lore, rules questions, and recaps.
          </p>
          <ul className="mt-5 grid gap-3 text-sm text-[color:var(--mkt-muted)] md:grid-cols-2">
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />Free tier includes {BILLING_CONFIG.freeMonthlyCredits} monthly AI credits</li>
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />Paid tiers add monthly AI credits</li>
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />Credit costs per tool are visible in-app</li>
            <li className="grid grid-cols-[0.9rem_1fr] items-start gap-3"><Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" />One-time {BILLING_CONFIG.creditPack.credits}-credit pack available for {BILLING_CONFIG.creditPack.price}</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function PricingReality() {
  return (
    <section id="pricing" className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Pricing"
          title="Current tiers and credits"
          body="These values reflect current plan and credit behavior implemented in the codebase."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="mkt-card mkt-card-mounted rounded-xl p-5">
            <p className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Wanderer (Free)</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">$0 / month</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{BILLING_CONFIG.freeMonthlyCredits} monthly AI credits</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">Core campaign + live session tools</p>
          </article>
          <article className="mkt-card rounded-xl p-5">
            <p className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Hobbyist</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">$5.99 / month</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{BILLING_CONFIG.tiers.hobbyist.monthlyCredits} monthly AI credits</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">Subscription credits expire after 90 days</p>
          </article>
          <article className="mkt-card mkt-card-mounted rounded-xl p-5">
            <p className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Game Master</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">$9.99 / month</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{BILLING_CONFIG.tiers.pro.monthlyCredits} monthly AI credits</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">Subscription credits expire after 90 days</p>
          </article>
          <article className="mkt-card rounded-xl p-5">
            <p className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Pro</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">$19.99 / month</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{BILLING_CONFIG.tiers.professional.monthlyCredits} monthly AI credits</p>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">Subscription credits expire after 90 days</p>
          </article>
        </div>

        <article className="mkt-card mt-4 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Coins className="mt-0.5 h-5 w-5 text-[color:var(--mkt-accent)]" />
            <div>
              <p className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">One-time credit pack</p>
              <p className="mt-1 text-sm text-[color:var(--mkt-muted)]">{BILLING_CONFIG.creditPack.price} for {BILLING_CONFIG.creditPack.credits} credits, purchasable without a subscription.</p>
              <p className="mt-1 text-sm text-[color:var(--mkt-muted)]">Subscribers get bonus pack credits: Hobbyist {BILLING_CONFIG.creditPack.bonusCreditsByTier.hobbyist}, Pro {BILLING_CONFIG.creditPack.bonusCreditsByTier.pro}, Professional {BILLING_CONFIG.creditPack.bonusCreditsByTier.professional}.</p>
              <p className="mt-1 text-sm text-[color:var(--mkt-muted)]">Current implementation does not publish per-tier memory or storage caps in the pricing UI.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function HowItWorksFaq() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">Workflow FAQ</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {howToFaq.map((item) => (
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
            Keep session flow practical, keep narrative control human, and use AI only when it helps.
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
      <SEO
        title="How Fablheim Works | Prep, Live Session, Recap"
        description="See how Fablheim runs tabletop campaigns with a Prep -> Live -> Recap workflow and optional credits-based AI tools."
        canonicalPath="/how-it-works"
      />
      <JsonLd
        data={howToSchema({
          name: 'How to run a session in Fablheim',
          path: '/how-it-works',
          description: 'Prep campaign context, run live session tools, and recap for continuity.',
          steps: [
            { name: 'Prep campaign context', text: 'Create encounters, notes, and world entities before the session.' },
            { name: 'Run live session cockpit', text: 'Use initiative, dice, chat, encounters, notes, and optional map support.' },
            { name: 'Recap and continue', text: 'Close session with recap and carry forward hooks into next prep.' },
          ],
        })}
      />
      <JsonLd data={faqPageSchema('/how-it-works', howToFaq)} />

      <MarketingNavbar
        user={user}
        links={[
          { label: 'Home', to: '/' },
          { label: 'Pricing', to: '/pricing' },
          { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <Hero loggedIn={loggedIn} onPrimary={handlePrimary} onRules={() => navigate('/srd')} />
      <StageWorkflow />
      <Tracks activeTrack={activeTrack} setActiveTrack={setActiveTrack} />
      <NoAiRequired />
      <PricingReality />
      <HowItWorksFaq />
      <ClosingCta loggedIn={loggedIn} onPrimary={handlePrimary} onRules={() => navigate('/srd')} />

      <MarketingFooter />
    </MarketingPage>
  );
}
