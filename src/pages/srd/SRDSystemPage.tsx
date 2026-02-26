import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  ScrollText,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useSRDSystem, useSRDCategoryEntries, useSRDSearch } from '@/hooks/useSRD';

function renderNav(navigate: ReturnType<typeof useNavigate>, user: unknown) {
  return (
    <nav className="texture-wood sticky top-0 z-50 border-b border-gold bg-[hsl(24,18%,6%)]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-9 w-9 rounded-md shadow-glow-sm animate-candle" />
            <span className="font-['Cinzel_Decorative'] text-glow-gold text-xl font-bold text-[hsl(35,25%,92%)]">
              Fablheim
            </span>
          </button>
          {renderNavButtons(navigate, user)}
        </div>
      </div>
    </nav>
  );
}

function renderNavButtons(navigate: ReturnType<typeof useNavigate>, user: unknown) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" onClick={() => navigate('/srd')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        All Systems
      </Button>
      {user ? (
        <Button onClick={() => navigate('/app')}>
          Dashboard
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      ) : (
        <>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/register')}>Enter the Realm</Button>
        </>
      )}
    </div>
  );
}

function renderBreadcrumb(
  navigate: ReturnType<typeof useNavigate>,
  systemName: string,
  category?: string,
) {
  return (
    <div className="mb-6 flex items-center gap-2 text-sm text-[hsl(30,12%,55%)]">
      <button onClick={() => navigate('/srd')} className="hover:text-amber-400 transition-colors">
        SRD
      </button>
      <ChevronRight className="h-3 w-3" />
      {category ? (
        <>
          <button onClick={() => navigate(`/srd/${location.pathname.split('/')[2]}/browse`)} className="hover:text-amber-400 transition-colors">
            {systemName}
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[hsl(35,25%,92%)]">{category}</span>
        </>
      ) : (
        <span className="text-[hsl(35,25%,92%)]">{systemName}</span>
      )}
    </div>
  );
}

function renderSearchBar(
  searchQuery: string,
  setSearchQuery: (q: string) => void,
) {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,12%,45%)]" />
      <input
        type="text"
        placeholder="Search rules, spells, classes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input-carved w-full rounded-md border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,10%)] py-2.5 pl-10 pr-4 text-sm text-[hsl(35,25%,92%)] placeholder-[hsl(30,12%,40%)] transition-colors focus:border-amber-500/40 focus:outline-none"
      />
    </div>
  );
}

function renderSearchResults(
  system: string,
  searchData: { results: { title: string; category: string; snippet: string }[] } | undefined,
  isSearching: boolean,
  navigate: ReturnType<typeof useNavigate>,
) {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!searchData || searchData.results.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[hsl(30,12%,45%)]">
        No results found.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {searchData.results.map((result, i) => (
        <button
          key={`${result.category}-${result.title}-${i}`}
          onClick={() => navigate(`/srd/${system}/${encodeURIComponent(result.category)}/${encodeURIComponent(result.title)}`)}
          className="w-full rounded-md border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,10%)] p-3 text-left transition-all hover:border-amber-500/30"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="font-[Cinzel] text-sm font-semibold text-[hsl(35,25%,92%)]">
              {result.title}
            </span>
            <span className="text-xs text-[hsl(30,12%,45%)]">
              in {result.category}
            </span>
          </div>
          <p className="text-xs text-[hsl(30,12%,55%)] line-clamp-2">
            {result.snippet}
          </p>
        </button>
      ))}
    </div>
  );
}

function renderCategoryGrid(
  system: string,
  categories: { name: string; count: number }[],
  navigate: ReturnType<typeof useNavigate>,
) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat, index) => (
        <button
          key={cat.name}
          onClick={() => navigate(`/srd/${system}/browse/${encodeURIComponent(cat.name)}`)}
          className="animate-unfurl iron-brackets texture-parchment flex items-center gap-4 rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] p-4 text-left transition-all hover:border-amber-500/30"
          style={{ animationDelay: `${index * 0.04}s` }}
        >
          <FolderOpen className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <h3 className="font-[Cinzel] text-sm font-semibold text-[hsl(35,25%,92%)]">
              {cat.name}
            </h3>
            <p className="text-xs text-[hsl(30,12%,55%)]">
              {cat.count} {cat.count === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(30,12%,45%)]" />
        </button>
      ))}
    </div>
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
  const grouped = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const entry of entries) {
      const letter = entry[0]?.toUpperCase() || '#';
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)!.push(entry);
    }
    return groups;
  }, [entries]);

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([letter, items]) => (
        <div key={letter}>
          <h4 className="mb-2 font-[Cinzel] text-xs font-bold tracking-widest text-amber-500/70 uppercase">
            {letter}
          </h4>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((entry) => (
              <button
                key={entry}
                onClick={() => navigate(`/srd/${system}/${encodeURIComponent(category)}/${encodeURIComponent(entry)}`)}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm text-[hsl(35,20%,75%)] transition-colors hover:bg-amber-500/5 hover:text-[hsl(35,25%,92%)]"
              >
                <ScrollText className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,35%)]" />
                {entry}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderFooter() {
  return (
    <footer className="texture-wood relative border-t border-[hsl(24,14%,15%)] py-12">
      <div className="divider-ornate absolute top-0 right-0 left-0" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-8 w-8 rounded-md shadow-glow-sm" />
            <span className="font-['Cinzel_Decorative'] text-glow-gold font-semibold text-[hsl(35,25%,92%)]">
              Fablheim
            </span>
          </div>
          <p className="text-sm text-[hsl(30,12%,55%)]">
            &copy; 2026 Fablheim. Forged for Game Masters, by Game Masters.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function SRDSystemPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { system = '', category } = useParams<{ system: string; category?: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: systemData, isLoading } = useSRDSystem(system);
  const { data: categoryData } = useSRDCategoryEntries(
    system,
    category || '',
  );
  const { data: searchData, isFetching: isSearching } = useSRDSearch(
    system,
    searchQuery,
  );

  const isSearchActive = searchQuery.length >= 2;

  if (isLoading) {
    return (
      <div className="vignette grain-overlay flex min-h-screen items-center justify-center bg-[hsl(24,18%,6%)]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="vignette grain-overlay min-h-screen bg-[hsl(24,18%,6%)]">
      {renderNav(navigate, user)}

      <section className="relative py-12">
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {renderBreadcrumb(navigate, systemData?.name || system, category)}

          <h1 className="font-['IM_Fell_English'] mb-2 text-3xl font-bold text-[hsl(35,25%,92%)] sm:text-4xl">
            {category || systemData?.name || system}
          </h1>
          {!category && systemData && (
            <p className="mb-8 text-[hsl(30,12%,55%)]">
              {systemData.totalEntries} entries across{' '}
              {systemData.categories.length} categories
            </p>
          )}
          {category && categoryData && (
            <p className="mb-8 text-[hsl(30,12%,55%)]">
              {categoryData.entries.length}{' '}
              {categoryData.entries.length === 1 ? 'entry' : 'entries'}
            </p>
          )}

          {renderSearchBar(searchQuery, setSearchQuery)}

          {isSearchActive
            ? renderSearchResults(system, searchData, isSearching, navigate)
            : category && categoryData
              ? <EntryList system={system} category={category} entries={categoryData.entries} />
              : systemData && renderCategoryGrid(system, systemData.categories, navigate)}
        </div>
      </section>

      <div className="divider-ornate mx-auto max-w-3xl" />
      {renderFooter()}
    </div>
  );
}
