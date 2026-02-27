import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ChevronLeft, FolderOpen, Loader2, Search, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useSRDSearch } from '@/hooks/useSRD';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { quickStartConfigs } from './quickStartConfigs';
import type { QuickStartLink, QuickStartSection } from './quickStartConfigs';

function buildLinkUrl(system: string, link: QuickStartLink): string {
  if (link.type === 'category') {
    return `/srd/${system}/browse/${encodeURIComponent(link.category)}`;
  }
  return `/srd/${system}/${encodeURIComponent(link.category)}/${encodeURIComponent(link.entry!)}`;
}

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">{eyebrow}</p>
      <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-[color:var(--mkt-muted)]">{body}</p>
    </header>
  );
}

function renderSection(
  section: QuickStartSection,
  system: string,
  navigate: ReturnType<typeof useNavigate>,
) {
  const Icon = section.icon;
  return (
    <article key={section.title} className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-6 sm:p-7">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/25">
          <Icon className="h-5 w-5 text-[color:var(--mkt-accent)]" />
        </div>
        <div>
          <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">{section.title}</h3>
          <p className="text-sm text-[color:var(--mkt-muted)]">{section.description}</p>
        </div>
      </div>

      <ul className="space-y-2 text-sm">
        {section.links.map((link) => (
          <li key={link.label}>
            <button
              onClick={() => navigate(buildLinkUrl(system, link))}
              className="mkt-tab flex w-full items-center gap-3 rounded-md px-3 py-2 text-left"
            >
              {link.type === 'category' ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-[color:var(--mkt-accent)]" />
              ) : (
                <ScrollText className="h-4 w-4 shrink-0 text-[color:var(--mkt-muted)]" />
              )}
              <span className="flex-1 text-[color:var(--mkt-text)]">{link.label}</span>
              {link.badge && (
                <span className="rounded-full border border-[color:var(--mkt-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[color:var(--mkt-muted)]">
                  {link.badge}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function SRDQuickStartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { system = '' } = useParams<{ system: string }>();
  const [query, setQuery] = useState('');

  const config = quickStartConfigs[system];
  const { data: searchData, isFetching } = useSRDSearch(system, query);

  const searchResults = useMemo(() => searchData?.results ?? [], [searchData]);

  if (!config) {
    return (
      <MarketingPage>
        <MarketingNavbar
          user={user}
          links={[
            { label: 'Rules Library', to: '/srd', icon: <ChevronLeft className="mr-1 h-4 w-4" /> },
            { label: 'Home', to: '/' },
          ]}
        />
        <section className="mkt-section px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <article className="mkt-card rounded-xl p-8 text-center">
              <h1 className="font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">Rules guide not found</h1>
              <p className="mt-3 text-[color:var(--mkt-muted)]">This system does not have a quick guide yet.</p>
              <Button className="mt-5" variant="outline" onClick={() => navigate('/srd')}>Back to Rules Library</Button>
            </article>
          </div>
        </section>
        <MarketingFooter />
      </MarketingPage>
    );
  }

  return (
    <MarketingPage>
      <MarketingNavbar
        user={user}
        links={[
          { label: 'Rules Library', to: '/srd', icon: <ChevronLeft className="mr-1 h-4 w-4" /> },
          { label: 'How It Works', to: '/how-it-works' },
        ]}
      />

      <section className="mkt-section mkt-hero-stage relative px-4 pb-14 pt-14 sm:px-6 sm:pt-18 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <ScrollText className="h-3.5 w-3.5" />
            Rules Library guide
          </p>
          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.05] text-[color:var(--mkt-text)] sm:text-5xl">
            {config.displayName}
          </h1>
          <p className="mt-4 max-w-3xl text-[color:var(--mkt-muted)]">{config.tagline}</p>
          <p className="mt-2 max-w-3xl text-sm text-[color:var(--mkt-muted)]">System Reference Documents (SRDs), searchable by system.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate(`/srd/${system}/browse`)}>
              Browse full rules index
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section-surface px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mkt-card mkt-card-mounted rounded-xl p-5 sm:p-6">
            <label htmlFor="quick-rules-search" className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
              Search this system
            </label>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--mkt-muted)]" />
              <input
                id="quick-rules-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rules, spells, conditions..."
                className="mkt-input w-full py-2.5 pl-10 pr-3"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {query.trim().length >= 2 ? (
            <div>
              <SectionHeader
                eyebrow="Search Results"
                title={`Matches in ${config.displayName}`}
                body="Open entries directly or jump into a category for broader browsing."
              />

              {isFetching ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-[color:var(--mkt-accent)]" />
                </div>
              ) : searchResults.length === 0 ? (
                <article className="mkt-card rounded-xl p-6 text-center mt-6">
                  <p className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">No matching rules found</p>
                  <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">Try broader terms like "conditions" or "combat".</p>
                </article>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.category}:${result.title}`}
                      onClick={() => navigate(`/srd/${system}/${encodeURIComponent(result.category)}/${encodeURIComponent(result.title)}`)}
                      className="mkt-card h-full rounded-xl p-5 text-left transition-colors hover:border-[color:var(--mkt-accent)]/40"
                    >
                      <div className="flex h-full flex-col">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="rounded-full border border-[color:var(--mkt-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--mkt-muted)]">{result.category}</span>
                        </div>
                        <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">{result.title}</h3>
                        <p className="mt-2 flex-1 text-sm text-[color:var(--mkt-muted)] line-clamp-3">{result.snippet}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <SectionHeader
                eyebrow="Quick Start"
                title="Browse by guide section"
                body="Start with common paths, then drill into full category browse as needed."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2 items-stretch">
                {config.sections.map((section) => renderSection(section, system, navigate))}
              </div>
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}
