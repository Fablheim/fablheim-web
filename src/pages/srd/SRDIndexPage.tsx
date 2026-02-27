import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
  BookOpenText,
  Heart,
  Loader2,
  ScrollText,
  Search,
  Swords,
  Target,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { srdApi } from '@/api/srd';
import { useSRDSystems } from '@/hooks/useSRD';
import { quickStartConfigs } from './quickStartConfigs';
import { Button } from '@/components/ui/Button';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';

const SYSTEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dnd5e: Swords,
  pathfinder2e: Target,
  fate: BookOpenText,
  daggerheart: Heart,
};

type SearchResultWithSystem = {
  systemId: string;
  systemName: string;
  title: string;
  category: string;
  snippet: string;
  score: number;
};

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">{eyebrow}</p>
      <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-[color:var(--mkt-muted)]">{body}</p>
    </header>
  );
}

function Hero() {
  return (
    <section className="mkt-section mkt-hero-stage relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsla(35,95%,60%,0.16)_0%,transparent_68%)]" />
        <div className="absolute right-0 top-14 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,hsla(16,82%,46%,0.13)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <ScrollText className="h-3.5 w-3.5" />
          Rules at your fingertips
        </p>
        <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.05] text-[color:var(--mkt-text)] sm:text-5xl lg:text-6xl">
          Rules Library
          <span className="gold-forged block">Search by system, stay in flow</span>
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-[color:var(--mkt-muted)] sm:text-lg">
          System Reference Documents (SRDs), searchable by system. Browse rules quickly during prep and live play.
          No login required.
        </p>
      </div>
    </section>
  );
}

export default function SRDIndexPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useSRDSystems();

  const systems = data?.systems ?? [];
  const [query, setQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const selectedSystemIds = useMemo(
    () => (systemFilter === 'all' ? systems.map((s) => s.id) : [systemFilter]),
    [systemFilter, systems],
  );

  const systemNameMap = useMemo(
    () => new Map(systems.map((s) => [s.id, s.name])),
    [systems],
  );

  const activeCategories = useMemo(() => {
    if (systemFilter === 'all') {
      const categories = new Set<string>();
      for (const system of systems) {
        for (const category of system.categories) categories.add(category.name);
      }
      return Array.from(categories).sort((a, b) => a.localeCompare(b));
    }
    return systems.find((s) => s.id === systemFilter)?.categories.map((c) => c.name) ?? [];
  }, [systemFilter, systems]);

  useEffect(() => {
    if (categoryFilter === 'all') return;
    if (!activeCategories.includes(categoryFilter)) setCategoryFilter('all');
  }, [activeCategories, categoryFilter]);

  const searchQueries = useQueries({
    queries: selectedSystemIds.map((systemId) => ({
      queryKey: ['srd', 'public-search', systemId, query],
      queryFn: () => srdApi.search(systemId, query.trim(), 16),
      enabled: query.trim().length >= 2,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isSearching = searchQueries.some((queryState) => queryState.isFetching);

  const results = useMemo(() => {
    const merged: SearchResultWithSystem[] = [];
    for (let i = 0; i < selectedSystemIds.length; i += 1) {
      const systemId = selectedSystemIds[i];
      const dataForSystem = searchQueries[i]?.data;
      if (!dataForSystem) continue;
      for (const result of dataForSystem.results) {
        merged.push({
          systemId,
          systemName: systemNameMap.get(systemId) ?? systemId,
          title: result.title,
          category: result.category,
          snippet: result.snippet,
          score: result.score,
        });
      }
    }
    const filtered =
      categoryFilter === 'all'
        ? merged
        : merged.filter((result) => result.category === categoryFilter);

    return filtered.sort((a, b) => b.score - a.score).slice(0, 48);
  }, [searchQueries, selectedSystemIds, systemNameMap, categoryFilter]);

  const quickStartSystems = useMemo(
    () => systems.filter((system) => Boolean(quickStartConfigs[system.id])),
    [systems],
  );

  return (
    <MarketingPage>
      <MarketingNavbar
        user={user}
        links={[
          { label: 'Home', to: '/' },
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
        ]}
      />

      <Hero />

      <section className="mkt-section mkt-section-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-5 sm:p-6">
            <label htmlFor="rules-search" className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
              Search rules
            </label>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_13rem_13rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--mkt-muted)]" />
                <input
                  id="rules-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search rules, spells, conditions..."
                  className="mkt-input w-full py-2.5 pl-10 pr-3"
                />
              </div>

              <label className="sr-only" htmlFor="rules-system-filter">System filter</label>
              <select
                id="rules-system-filter"
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value)}
                className="mkt-input py-2.5"
              >
                <option value="all">All systems</option>
                {systems.map((system) => (
                  <option key={system.id} value={system.id}>{system.name}</option>
                ))}
              </select>

              <label className="sr-only" htmlFor="rules-category-filter">Category filter</label>
              <select
                id="rules-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mkt-input py-2.5"
              >
                <option value="all">All categories</option>
                {activeCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {query.trim().length < 2 ? (
            <div className="space-y-12">
              <div>
                <SectionHeader
                  eyebrow="Systems"
                  title="Start with a ruleset"
                  body="Pick a system tile to browse categories, entries, and quick guides."
                />
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[color:var(--mkt-accent)]" />
                  </div>
                ) : error ? (
                  <article className="mkt-card rounded-xl p-6 text-center">
                    <p className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Rules Library unavailable</p>
                    <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">The rules service may still be starting. Please refresh shortly.</p>
                  </article>
                ) : (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                    {systems.map((system) => {
                      const Icon = SYSTEM_ICONS[system.id] ?? ScrollText;
                      return (
                        <button
                          key={system.id}
                          onClick={() => navigate(`/srd/${system.id}`)}
                          className="mkt-card mkt-card-mounted h-full rounded-xl p-5 text-left transition-colors hover:border-[color:var(--mkt-accent)]/40"
                        >
                          <div className="flex h-full flex-col">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/25">
                              <Icon className="h-5 w-5 text-[color:var(--mkt-accent)]" />
                            </div>
                            <p className="mt-4 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">{system.name}</p>
                            <p className="mt-2 text-sm text-[color:var(--mkt-muted)] line-clamp-2">{system.totalEntries} entries across {system.categories.length} categories</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <SectionHeader
                  eyebrow="Quick Guides"
                  title="Quick Start paths"
                  body="Use curated quick-start sections for the systems that currently have guide mappings."
                />
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {quickStartSystems.length === 0 ? (
                    <article className="mkt-card rounded-xl p-5">
                      <p className="text-sm text-[color:var(--mkt-muted)]">Quick Start guides are being prepared.</p>
                    </article>
                  ) : (
                    quickStartSystems.map((system) => (
                      <article key={system.id} className="mkt-card rounded-xl p-5 h-full flex flex-col">
                        <p className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">{system.name}</p>
                        <p className="mt-2 flex-1 text-sm text-[color:var(--mkt-muted)] line-clamp-3">
                          {quickStartConfigs[system.id].tagline}
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4 self-start"
                          onClick={() => navigate(`/srd/${system.id}`)}
                        >
                          Open guide
                        </Button>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <SectionHeader
                eyebrow="Search Results"
                title="Rules lookup"
                body="Instant, forgiving search across your selected systems."
              />

              {isSearching ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-7 w-7 animate-spin text-[color:var(--mkt-accent)]" />
                </div>
              ) : results.length === 0 ? (
                <article className="mkt-card rounded-xl p-6 text-center mt-6">
                  <p className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">No matching rules found</p>
                  <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">Try broader terms, switch systems, or clear filters.</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button variant="outline" onClick={() => setCategoryFilter('all')}>Reset category</Button>
                    <Button variant="outline" onClick={() => setSystemFilter('all')}>All systems</Button>
                  </div>
                </article>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {results.map((result) => (
                    <button
                      key={`${result.systemId}:${result.category}:${result.title}`}
                      onClick={() => navigate(`/srd/${result.systemId}/${encodeURIComponent(result.category)}/${encodeURIComponent(result.title)}`)}
                      className="mkt-card h-full rounded-xl p-5 text-left transition-colors hover:border-[color:var(--mkt-accent)]/45"
                    >
                      <div className="flex h-full flex-col">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="mkt-chip px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">{result.systemName}</span>
                          <span className="rounded-full border border-[color:var(--mkt-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--mkt-muted)]">{result.category}</span>
                        </div>
                        <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">{result.title}</h3>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--mkt-muted)] line-clamp-3">{result.snippet}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mkt-section px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mkt-card mkt-card-mounted border-medieval rounded-xl p-6 sm:p-8 text-center">
            <h2 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">Rules Library, built for momentum</h2>
            <p className="mt-2 text-[color:var(--mkt-muted)]">Look up mechanics in seconds without leaving your campaign flow.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={() => navigate('/register')} className="shimmer-gold">Enter the Realm</Button>
              <Button variant="outline" onClick={() => navigate('/how-it-works')}>See How It Works</Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}
