import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageSchema } from '@/seo/schema';

const faq = [
  {
    question: 'Does Fablheim support Fate Core campaigns?',
    answer: 'Yes. Fate Core campaigns can use prep tools, the live session cockpit, and recap workflows.',
  },
  {
    question: 'Do I need AI for Fate Core campaign prep?',
    answer: 'No. AI is optional and can be skipped completely.',
  },
];

export default function FateCorePage() {
  const { user } = useAuth();

  return (
    <MarketingPage>
      <SEO
        title="Fate Core Campaign Organizer | Fablheim"
        description="Organize Fate Core prep, run live sessions, and keep recap continuity in one command hall."
        canonicalPath="/systems/fate-core"
      />
      <JsonLd data={faqPageSchema('/systems/fate-core', faq)} />

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
            Fate Core Campaign Manager for Prep, Live Play, and Recap
          </h1>
          <p className="mt-4 max-w-3xl text-[color:var(--mkt-muted)]">
            Track scenes, session notes, and table flow in one workspace built for continuity.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a className="mkt-chip px-3 py-1" href="/how-it-works">How It Works</a>
            <a className="mkt-chip px-3 py-1" href="/pricing">Pricing</a>
            <a className="mkt-chip px-3 py-1" href="/srd">Rules Library</a>
            <a className="mkt-chip px-3 py-1" href="/srd/fate">Fate Core SRD</a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}

