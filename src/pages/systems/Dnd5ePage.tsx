import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageSchema } from '@/seo/schema';

const faq = [
  {
    question: 'Is this D&D 5e only?',
    answer: 'No. Fablheim supports D&D 5e, Pathfinder 2e, Fate Core, and Daggerheart.',
  },
  {
    question: 'Do I need AI to run a D&D campaign in Fablheim?',
    answer: 'No. AI is optional and credits-based.',
  },
];

export default function Dnd5ePage() {
  const { user } = useAuth();

  return (
    <MarketingPage>
      <SEO
        title="D&D 5e Campaign Manager | Fablheim"
        description="Use Fablheim for D&D 5e prep, live session control, and recap continuity in one command hall."
        canonicalPath="/systems/dnd-5e"
      />
      <JsonLd data={faqPageSchema('/systems/dnd-5e', faq)} />

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
            D&D 5e Campaign Manager for Prep, Live Play, and Recap
          </h1>
          <p className="mt-4 max-w-3xl text-[color:var(--mkt-muted)]">
            Organize encounters, notes, and session flow for D&D 5e with one command hall and optional AI assists.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a className="mkt-chip px-3 py-1" href="/how-it-works">How It Works</a>
            <a className="mkt-chip px-3 py-1" href="/pricing">Pricing</a>
            <a className="mkt-chip px-3 py-1" href="/srd">Rules Library</a>
            <a className="mkt-chip px-3 py-1" href="/srd/dnd5e">D&D 5e SRD</a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}

