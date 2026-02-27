import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FolderOpen, Loader2, Search, ScrollText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSRDCategoryEntries, useSRDSearch, useSRDSystem } from '@/hooks/useSRD';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">{eyebrow}</p>
      <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-[color:var(--mkt-muted)]">{body}</p>
    </header>
  );
}

function EntryList({
  system,
  category,
  entries,
}: {
  system: string;
  category: string;
  entries: string[];
}) {
  const navigate = useNavigate();

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const entry of entries) {
      const letter = entry[0]?.toUpperCase() || '#';
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)!.push(entry);
    }
    return Array.from(groups.entries());
  }, [entries]);

  return (
    <div className="space-y-6">
      {groupedEntries.map(([letter, grouped]) => (
        <div key={letter}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">{letter}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.map((entry) => (
              <button
                key={entry}
                onClick={() => navigate(`/srd/${system}/${encodeURIComponent(category)}/${encodeURIComponent(entry)}`)}
                className="mkt-tab flex items-center gap-2 rounded-md px-3 py-2 text-left"
              >
                <ScrollText className="h-4 w-4 shrink-0 text-[color:var(--mkt-muted)]" />
                <span className="text-sm text-[color:var(--mkt-text)]">{entry}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SRDSystemPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { system = '', category } = useParams<{ system: string; category?: string }>();

  const [query, setQuery] = useState('');
  const { data: systemData, isLoading } = useSRDSystem(system);
  const { data: categoryData } = useSRDCategoryEntries(system, category || '');
  const { data: searchData, isFetching } = useSRDSearch(system, query);

  const systemName = systemData?.name ?? system;
  const isSearchActive = query.trim().length >= 2;

  if (isLoading) {
    return (
      <MarketingPage>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--mkt-accent)]" />
        </div>
      </MarketingPage>
    );
  }

  return (
    <MarketingPage>
      <MarketingNavbar
        user={user}
        links={[
          { label: 'Rules Library', to: '/srd', icon: <ChevronLeft className="mr-1 h-4 w-4" /> },
          { label: 'Home', to: '/' },
        ]}
      />

      <section className="mkt-section mkt-hero-stage relative px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
            <button onClick={() => navigate('/srd')} className="mkt-tab px-2 py-1">Rules Library</button>
            <ChevronRight className="h-3 w-3" />
            <span>{systemName}</span>
            {category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{category}</span>
              </>
            )}
          </div>

          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.05] text-[color:var(--mkt-text)] sm:text-5xl">
            {category || systemName}
          </h1>
          <p className="mt-3 text-[color:var(--mkt-muted)]">
            System Reference Documents (SRDs), searchable by system.
          </p>
        </div>
      </section>

      <section className="mkt-section mkt-section-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mkt-card mkt-card-mounted rounded-xl p-5 sm:p-6">
            <label htmlFor="system-search" className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
              Search this system
            </label>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--mkt-muted)]" />
              <input
                id="system-search"
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
          {isSearchActive ? (
            <div>
              <SectionHeader
                eyebrow="Search Results"
                title={`Matches in ${systemName}`}
                body="Open entries directly or switch to category browsing."
              />

              {isFetching ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-[color:var(--mkt-accent)]" />
                </div>
              ) : !searchData || searchData.results.length === 0 ? (
                <article className="mkt-card rounded-xl p-6 text-center mt-6">
                  <p className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">No matching rules found</p>
                  <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">Try broader terms or open a category.</p>
                </article>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {searchData.results.map((result) => (
                    <button
                      key={`${result.category}:${result.title}`}
                      onClick={() => navigate(`/srd/${system}/${encodeURIComponent(result.category)}/${encodeURIComponent(result.title)}`)}
                      className="mkt-card h-full rounded-xl p-5 text-left transition-colors hover:border-[color:var(--mkt-accent)]/40"
                    >
                      <div className="flex h-full flex-col">
                        <span className="mb-3 rounded-full border border-[color:var(--mkt-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--mkt-muted)] w-fit">{result.category}</span>
                        <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">{result.title}</h3>
                        <p className="mt-2 flex-1 text-sm text-[color:var(--mkt-muted)] line-clamp-3">{result.snippet}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : category && categoryData ? (
            <div>
              <SectionHeader
                eyebrow="Entries"
                title={`${categoryData.entries.length} entries`}
                body="Browse alphabetically and open any rule entry."
              />
              <div className="mkt-card mkt-card-mounted rounded-xl p-5 sm:p-6 mt-6">
                <EntryList system={system} category={category} entries={categoryData.entries} />
              </div>
            </div>
          ) : (
            <div>
              <SectionHeader
                eyebrow="Categories"
                title="Browse by category"
                body="Start broad, then drill into specific entries."
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                {systemData?.categories.map((categoryItem) => (
                  <button
                    key={categoryItem.name}
                    onClick={() => navigate(`/srd/${system}/browse/${encodeURIComponent(categoryItem.name)}`)}
                    className="mkt-card mkt-card-mounted h-full rounded-xl p-5 text-left transition-colors hover:border-[color:var(--mkt-accent)]/40"
                  >
                    <div className="flex h-full flex-col">
                      <FolderOpen className="h-5 w-5 text-[color:var(--mkt-accent)]" />
                      <h3 className="mt-3 font-[Cinzel] text-lg text-[color:var(--mkt-text)]">{categoryItem.name}</h3>
                      <p className="mt-1 text-sm text-[color:var(--mkt-muted)]">{categoryItem.count} entries</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}
