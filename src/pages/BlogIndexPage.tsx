import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { blogSchema } from '@/seo/schema';

const clusters = [
  'Prep workflow guides for busy GMs',
  'Combat flow and initiative control playbooks',
  'Recap continuity tactics for long campaigns',
  'Multi-system setup tips (D&D 5e, PF2e, Fate Core, Daggerheart)',
];

export default function BlogIndexPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <MarketingPage>
      <SEO
        title="Fablheim Blog | GM Guides and Playbooks"
        description="Practical TTRPG guides for prep, live session control, recap continuity, and multi-system game mastering."
        canonicalPath="/blog"
      />
      <JsonLd
        data={blogSchema({
          name: 'Fablheim GM Guides and Playbooks',
          path: '/blog',
          description: 'Practical guides for running tabletop sessions with less tool juggling.',
        })}
      />

      <MarketingNavbar
        user={user}
        links={[
          { label: 'Home', to: '/' },
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'Pricing', to: '/pricing' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <section className="mkt-section mkt-hero-stage px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Blog</p>
          <h1 className="mt-2 font-['IM_Fell_English'] text-4xl text-[color:var(--mkt-text)] sm:text-5xl">
            GM Guides and Playbooks
          </h1>
          <p className="mt-4 max-w-3xl text-[color:var(--mkt-muted)]">
            This hub will publish practical guides for prep, live play, and recap continuity.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">Upcoming content clusters</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {clusters.map((cluster) => (
              <article key={cluster} className="mkt-card rounded-xl p-5">
                <p className="text-[color:var(--mkt-muted)]">{cluster}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate('/how-it-works')}>See Workflow</Button>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}

