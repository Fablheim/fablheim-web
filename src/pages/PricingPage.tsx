import { useNavigate } from 'react-router-dom';
import { Coins, ScrollText, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageSchema } from '@/seo/schema';
import { BILLING_CONFIG } from '@/config/billingConfig';

const tiers = [
  {
    name: 'Wanderer (Free)',
    price: '$0',
    credits: 'No monthly AI credits',
    notes: 'Core campaign management and session runner access.',
    tag: 'Core Access',
    cardTone:
      'bg-[linear-gradient(170deg,hsla(220,12%,22%,0.36)_0%,hsla(220,10%,10%,0.84)_100%)] border-[color:var(--mkt-border)]/80',
  },
  {
    name: 'Hobbyist',
    price: `${BILLING_CONFIG.tiers.hobbyist.price}`,
    credits: `${BILLING_CONFIG.tiers.hobbyist.monthlyCredits} monthly AI credits`,
    notes: 'Subscription credits expire after 90 days.',
    tag: 'Weekly Campaigns',
    cardTone:
      'bg-[linear-gradient(170deg,hsla(32,66%,44%,0.2)_0%,hsla(22,28%,12%,0.86)_100%)] border-[color:var(--mkt-border)]/80',
  },
  {
    name: 'Game Master',
    price: `${BILLING_CONFIG.tiers.pro.price}`,
    credits: `${BILLING_CONFIG.tiers.pro.monthlyCredits} monthly AI credits`,
    notes: 'Subscription credits expire after 90 days.',
    tag: 'Best For Active GMs',
    cardTone:
      'bg-[linear-gradient(165deg,hsla(40,90%,56%,0.24)_0%,hsla(18,66%,34%,0.24)_45%,hsla(24,16%,8%,0.9)_100%)] border-[color:var(--mkt-accent)]/70',
    featured: true,
  },
  {
    name: 'Pro',
    price: `${BILLING_CONFIG.tiers.professional.price}`,
    credits: `${BILLING_CONFIG.tiers.professional.monthlyCredits} monthly AI credits`,
    notes: 'Subscription credits expire after 90 days.',
    tag: 'High Throughput',
    cardTone:
      'bg-[linear-gradient(170deg,hsla(14,72%,44%,0.22)_0%,hsla(24,18%,9%,0.9)_100%)] border-[color:var(--mkt-border)]/80',
  },
];

const pricingFaq = [
  {
    question: 'Does the free tier include monthly AI credits?',
    answer: 'No. The free tier includes core app access, and AI credits start with paid plans.',
  },
  {
    question: 'Can I use Fablheim without AI?',
    answer: 'Yes. Campaign management and the live session runner work without AI.',
  },
  {
    question: 'Can I buy credits without a subscription?',
    answer: `Yes. A one-time ${BILLING_CONFIG.creditPack.price} pack gives ${BILLING_CONFIG.creditPack.credits} credits.`,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loggedIn = !!user;
  const aiCostRows = Object.entries(BILLING_CONFIG.aiActionCosts).sort(([, a], [, b]) => a - b);

  return (
    <MarketingPage>
      <SEO
        title="Fablheim Pricing | Optional AI Credits for GMs"
        description="Fablheim pricing: free core app access, paid tiers with monthly AI credits, and one-time credit packs for optional AI support."
        canonicalPath="/pricing"
      />
      <JsonLd data={faqPageSchema('/pricing', pricingFaq)} />

      <MarketingNavbar
        user={user}
        links={[
          { label: 'Home', to: '/' },
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <section className="mkt-section mkt-hero-stage relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsla(35,95%,60%,0.16)_0%,transparent_68%)]" />
          <div className="absolute right-0 top-12 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,hsla(14,84%,46%,0.14)_0%,transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <Coins className="h-3.5 w-3.5" />
            Transparent Credits
          </p>
          <h1 className="mt-2 font-['IM_Fell_English'] text-4xl text-[color:var(--mkt-text)] sm:text-5xl">
            Clear plans, optional AI credits
          </h1>
          <p className="mt-4 max-w-3xl text-[color:var(--mkt-muted)]">
            Fablheim is usable without AI. The free tier gives you the core app, and paid plans add monthly AI credits.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="rune-divider mx-auto mb-10 max-w-4xl" />
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`mkt-card relative overflow-hidden rounded-xl p-5 ${tier.cardTone} ${
                tier.featured
                  ? 'mkt-card-mounted mkt-card-elevated iron-brackets texture-parchment border-medieval shadow-[0_20px_40px_hsla(24,44%,5%,0.55)]'
                  : 'mkt-card-mounted'
              }`}
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[radial-gradient(circle,hsla(38,90%,60%,0.2)_0%,transparent_68%)]" />
              <div className="relative">
                <p className="inline-flex rounded-full border border-[color:var(--mkt-border)]/70 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--mkt-muted)]">
                  {tier.tag}
                </p>
                <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">{tier.name}</p>
                <div className="mt-3 flex items-end gap-1">
                  <p className="font-[Cinzel] text-3xl leading-none text-[color:var(--mkt-text)]">{tier.price}</p>
                  {tier.name === 'Wanderer (Free)' ? null : (
                    <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--mkt-muted)]">/ month</p>
                  )}
                </div>
                <div className="mt-4 h-px w-full bg-[linear-gradient(90deg,transparent_0%,hsla(38,36%,66%,0.42)_35%,hsla(38,36%,66%,0.42)_65%,transparent_100%)]" />
                <p className="mt-4 text-sm text-[color:var(--mkt-text)]">{tier.credits}</p>
                <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{tier.notes}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-6xl">
          <article className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Coins className="mt-0.5 h-5 w-5 text-[color:var(--mkt-accent)]" />
              <div>
                <h2 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">One-time credit pack</h2>
                <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">
                  Buy {BILLING_CONFIG.creditPack.credits} credits for {BILLING_CONFIG.creditPack.price} without a subscription.
                </p>
                <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">
                  Subscribers get more credits per pack: Hobbyist {BILLING_CONFIG.creditPack.bonusCreditsByTier.hobbyist}, Pro {BILLING_CONFIG.creditPack.bonusCreditsByTier.pro}, Professional {BILLING_CONFIG.creditPack.bonusCreditsByTier.professional}.
                </p>
                <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">
                  If you do not need monthly AI throughput, you can stay on free and buy packs only when needed.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mkt-section px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <article className="mkt-card mkt-card-mounted mkt-card-elevated texture-parchment rounded-xl border-medieval p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-[color:var(--mkt-accent)]" />
              <div>
                <h2 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">No AI required</h2>
                <p className="mt-2 text-[color:var(--mkt-muted)]">
                  Prep, live session control, and recap flow do not require AI credits.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mkt-section mkt-section-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <article className="mkt-card mkt-card-mounted rounded-xl p-6">
            <h2 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">AI Credit Costs</h2>
            <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">
              Same per-action model shown in the in-app Credits page.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {aiCostRows.map(([feature, cost]) => (
                <div key={feature} className="flex items-center justify-between rounded-md border border-[color:var(--mkt-border)]/70 bg-black/20 px-3 py-2">
                  <span className="text-sm text-[color:var(--mkt-text)]">{BILLING_CONFIG.aiActionLabels[feature as keyof typeof BILLING_CONFIG.aiActionLabels]}</span>
                  <span className="font-[Cinzel] text-sm font-semibold text-[color:var(--mkt-accent)]">{cost} cr</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[color:var(--mkt-muted)]">
              Core prep, live, and recap workflow does not require AI credits.
            </p>
          </article>
        </div>
      </section>

      <section className="mkt-section mkt-section-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <article className="mkt-card mkt-card-mounted iron-brackets mb-6 rounded-xl p-5">
            <h2 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Pack FAQ</h2>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              <li>Packs are base credits + subscriber bonus.</li>
              <li>Bonus applies only if your subscription is active.</li>
            </ul>
          </article>
          <h2 className="font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">Pricing FAQ</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {pricingFaq.map((item) => (
              <article key={item.question} className="mkt-card rounded-xl p-5">
                <p className="font-semibold text-[color:var(--mkt-text)]">{item.question}</p>
                <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mkt-card mkt-card-mounted mkt-card-elevated mkt-ceremony iron-brackets texture-leather rounded-2xl border-medieval p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Ready when you are</p>
            <h2 className="font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">Start with the free tier</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[color:var(--mkt-muted)]">
              Move to paid plans only when you want optional AI throughput.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={() => navigate(loggedIn ? '/app' : '/register')}>
                {loggedIn ? 'Open Dashboard' : 'Join Beta'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/how-it-works')} className="text-base">
                See How It Works
                <ScrollText className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}
