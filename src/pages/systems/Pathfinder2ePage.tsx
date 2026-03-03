import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageSchema } from '@/seo/schema';

const faq = [
  {
    question: 'Can I run Pathfinder 2e sessions in Fablheim?',
    answer: 'Yes. Fablheim supports prep, live session cockpit controls, and recap continuity for PF2e campaigns.',
  },
  {
    question: 'Is the battle map a full premium VTT?',
    answer: 'No. It is functional map support with grid, tokens, zoom/pan, and image background upload.',
  },
];

export default function Pathfinder2ePage() {
  const { user } = useAuth();

  return (
    <MarketingPage>
      <SEO
        title="Pathfinder 2e Campaign Tracker | Fablheim"
        description="Run Pathfinder 2e prep, live sessions, and recap flow in one practical command hall."
        canonicalPath="/systems/pathfinder-2e"
      />
      <JsonLd data={faqPageSchema('/systems/pathfinder-2e', faq)} />

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
            Pathfinder 2e Campaign Manager for Prep, Live Play, and Recap
          </h1>
          <p className="mt-4 max-w-3xl text-[color:var(--mkt-muted)]">
            Keep PF2e campaign context and live table controls in one place so session pacing stays consistent.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a className="mkt-chip px-3 py-1" href="/how-it-works">How It Works</a>
            <a className="mkt-chip px-3 py-1" href="/pricing">Pricing</a>
            <a className="mkt-chip px-3 py-1" href="/srd">Rules Library</a>
            <a className="mkt-chip px-3 py-1" href="/srd/pathfinder2e">Pathfinder 2e SRD</a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}

