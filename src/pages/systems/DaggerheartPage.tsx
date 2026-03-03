import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageSchema } from '@/seo/schema';

const faq = [
  {
    question: 'Can I use Fablheim for Daggerheart sessions?',
    answer: 'Yes. You can prep campaign context, run live sessions, and keep recaps in one flow.',
  },
  {
    question: 'Is AI required for Daggerheart campaigns?',
    answer: 'No. AI is optional and credit-based.',
  },
];

export default function DaggerheartPage() {
  const { user } = useAuth();

  return (
    <MarketingPage>
      <SEO
        title="Daggerheart Campaign Manager | Fablheim"
        description="Use Fablheim for Daggerheart campaign prep, live session controls, and recap continuity."
        canonicalPath="/systems/daggerheart"
      />
      <JsonLd data={faqPageSchema('/systems/daggerheart', faq)} />

      <MarketingNavbar
        user={user}
        links={[
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'Pricing', to: '/pricing' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <section className="mkt-section mkt-hero-stage px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-['IM_Fell_English'] text-4xl text-[color:var(--mkt-text)] sm:text-5xl">
            Daggerheart Campaign Manager for Prep, Live Play, and Recap
          </h1>
          <p className="mt-4 max-w-3xl text-[color:var(--mkt-muted)]">
            Keep Daggerheart campaign state clear from pre-session planning through live table control and recap.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a className="mkt-chip px-3 py-1" href="/how-it-works">How It Works</a>
            <a className="mkt-chip px-3 py-1" href="/pricing">Pricing</a>
            <a className="mkt-chip px-3 py-1" href="/srd">Rules Library</a>
            <a className="mkt-chip px-3 py-1" href="/srd/daggerheart">Daggerheart SRD</a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}

