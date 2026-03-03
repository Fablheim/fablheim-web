import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';

const now = [
  'Beta hardening across prep/live/recap workflows',
  'Battle map polish for smoother grid and token interactions',
  'Multi-system end-to-end quality coverage',
];

const next = [
  'Marketing and rules route performance improvements',
  'WebSocket scale guardrails such as Redis-backed rate limiting',
  'More quality-of-life improvements in session flow and recap handling',
];

const later = [
  'Fog of war',
  'Advanced lighting',
  'Marketplace concepts',
];

export default function RoadmapPage() {
  const { user } = useAuth();

  return (
    <MarketingPage>
      <SEO
        title="Fablheim Roadmap | Public Product Direction"
        description="See what Fablheim is focusing on now, next, and later for campaign management and session runner improvements."
        canonicalPath="/roadmap"
      />

      <MarketingNavbar
        user={user}
        links={[
          { label: 'Home', to: '/' },
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'Pricing', to: '/pricing' },
        ]}
      />

      <section className="mkt-section mkt-hero-stage px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Public roadmap</p>
          <h1 className="mt-2 font-['IM_Fell_English'] text-4xl text-[color:var(--mkt-text)] sm:text-5xl">
            Product Direction
          </h1>
        </div>
      </section>

      <section className="mkt-section mkt-section-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          <article className="mkt-card mkt-card-mounted rounded-xl p-5">
            <h2 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Now</h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              {now.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="mkt-card rounded-xl p-5">
            <h2 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Next</h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              {next.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="mkt-card mkt-card-mounted rounded-xl p-5">
            <h2 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Later</h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              {later.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}

