import { useCallback, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertCircle,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Heart,
  Loader2,
  ScrollText,
  Search,
  Swords,
  Target,
} from 'lucide-react';
import {
  useSRDSystems,
  useSRDSystem,
  useSRDCategoryEntries,
  useSRDEntry,
  useSRDSearch,
} from '@/hooks/useSRD';
import { useGetCampaignContext } from '@/hooks/useCampaignContext';
import { srdApi } from '@/api/srd';
import { quickStartConfigs } from '@/pages/srd/quickStartConfigs';
import type { QuickStartLink, QuickStartSection } from '@/pages/srd/quickStartConfigs';
import type { Components } from 'react-markdown';

// ── Types ───────────────────────────────────────────────────

type RulesView =
  | { screen: 'index' }
  | { screen: 'system'; system: string }
  | { screen: 'browse'; system: string; category?: string }
  | { screen: 'entry'; system: string; category: string; entry: string };

export interface RulesPanelProps {
  campaignId?: string;
  system?: string;
}

// ── Constants ───────────────────────────────────────────────

const SYSTEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dnd5e: Swords,
  pathfinder2e: Target,
  fate: BookOpenText,
  daggerheart: Heart,
};

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 font-[Cinzel] text-2xl text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 font-[Cinzel] text-xl text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 font-[Cinzel] text-lg text-foreground">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 leading-relaxed text-muted-foreground">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6 text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-primary/40 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded border border-border">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-muted/40 px-3 py-2 text-left font-[Cinzel] text-sm text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2 text-sm text-muted-foreground">{children}</td>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <pre className="my-4 overflow-x-auto rounded-md border border-border bg-muted/30 p-4">
          <code className="text-sm text-foreground">{children}</code>
        </pre>
      );
    }
    return <code className="rounded bg-muted/30 px-1.5 py-0.5 text-sm text-primary">{children}</code>;
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/40 hover:decoration-primary">
      {children}
    </a>
  ),
};

// ── Component ───────────────────────────────────────────────

export function RulesPanel({ campaignId, system: campaignSystem }: RulesPanelProps) {
  const initialView: RulesView =
    campaignSystem && campaignSystem !== 'custom'
      ? { screen: 'system', system: campaignSystem }
      : { screen: 'index' };

  const [view, setView] = useState<RulesView>(initialView);
  const [history, setHistory] = useState<RulesView[]>([]);

  // Campaign context for house rules
  const { data: campaignCtx } = useGetCampaignContext(campaignId ?? '');
  const houseRules = campaignCtx?.houseRules?.trim() || '';

  const navigateTo = useCallback(
    (next: RulesView) => {
      setHistory((prev) => [...prev, view]);
      setView(next);
    },
    [view],
  );

  const goBack = useCallback(() => {
    setHistory((prev) => {
      const stack = [...prev];
      const previous = stack.pop();
      if (previous) setView(previous);
      return stack;
    });
  }, []);

  function renderBreadcrumbs() {
    const crumbs: { label: string; onClick?: () => void }[] = [];

    if (view.screen !== 'index') {
      crumbs.push({
        label: 'Rules Library',
        onClick: () => {
          setHistory([]);
          setView({ screen: 'index' });
        },
      });
    } else {
      crumbs.push({ label: 'Rules Library' });
    }

    if (view.screen === 'system' || view.screen === 'browse' || view.screen === 'entry') {
      if (view.screen === 'system') {
        crumbs.push({ label: view.system });
      } else {
        crumbs.push({
          label: view.system,
          onClick: () => navigateTo({ screen: 'system', system: view.system }),
        });
      }
    }

    if (view.screen === 'browse' && view.category) {
      crumbs.push({ label: view.category });
    }

    if (view.screen === 'entry') {
      crumbs.push({
        label: view.category,
        onClick: () => navigateTo({ screen: 'browse', system: view.system, category: view.category }),
      });
      crumbs.push({ label: view.entry });
    }

    return (
      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {crumb.onClick && !isLast ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="rounded px-1 py-0.5 hover:bg-muted hover:text-foreground"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={isLast ? 'text-foreground' : ''}>{crumb.label}</span>
              )}
            </span>
          );
        })}
      </div>
    );
  }

  function renderHouseRules() {
    if (!houseRules) return null;
    return (
      <details className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary">
          <AlertCircle className="h-3.5 w-3.5" />
          House Rules
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{houseRules}</p>
      </details>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto">
        {renderHouseRulesSection()}
        {renderContent()}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        {history.length > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {renderBreadcrumbs()}
      </div>
    );
  }

  function renderHouseRulesSection() {
    if (!houseRules) return null;
    return <div className="px-3 pt-2">{renderHouseRules()}</div>;
  }

  function renderContent() {
    return (
      <div className="px-3 py-3">
        {view.screen === 'index' && <IndexView navigateTo={navigateTo} />}
        {view.screen === 'system' && <SystemView system={view.system} navigateTo={navigateTo} />}
        {view.screen === 'browse' && (
          <BrowseView system={view.system} category={view.category} navigateTo={navigateTo} />
        )}
        {view.screen === 'entry' && (
          <EntryView
            system={view.system}
            category={view.category}
            entry={view.entry}
            navigateTo={navigateTo}
          />
        )}
      </div>
    );
  }
}

// ── Sub-views (separate components to isolate hook calls) ───

function IndexView({ navigateTo }: { navigateTo: (v: RulesView) => void }) {
  const { data, isLoading, error } = useSRDSystems();
  const systems = data?.systems ?? [];
  const [query, setQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState('all');

  const selectedSystemIds = useMemo(
    () => (systemFilter === 'all' ? systems.map((s) => s.id) : [systemFilter]),
    [systemFilter, systems],
  );

  const systemNameMap = useMemo(
    () => new Map(systems.map((s) => [s.id, s.name])),
    [systems],
  );

  const searchQueries = useQueries({
    queries: selectedSystemIds.map((systemId) => ({
      queryKey: ['srd', 'public-search', systemId, query],
      queryFn: () => srdApi.search(systemId, query.trim(), 16),
      enabled: query.trim().length >= 2,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isSearching = searchQueries.some((q) => q.isFetching);

  const results = useMemo(() => {
    const merged: { systemId: string; systemName: string; title: string; category: string; snippet: string; score: number }[] = [];
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
    return merged.sort((a, b) => b.score - a.score).slice(0, 48);
  }, [searchQueries, selectedSystemIds, systemNameMap]);

  return (
    <div className="space-y-4">
      {renderSearchBar()}
      {query.trim().length >= 2 ? renderSearchResults() : renderSystemCards()}
    </div>
  );

  function renderSearchBar() {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rules, spells, conditions..."
            className="w-full rounded-md border border-border bg-input py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={systemFilter}
          onChange={(e) => setSystemFilter(e.target.value)}
          className="w-full rounded-md border border-border bg-input px-2.5 py-1.5 text-sm text-foreground"
        >
          <option value="all">All systems</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
    );
  }

  function renderSearchResults() {
    if (isSearching) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }
    if (results.length === 0) {
      return (
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-sm font-medium text-foreground">No matching rules found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try broader terms or switch systems.</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {results.length} results
        </p>
        {results.map((result) => (
          <button
            key={`${result.systemId}:${result.category}:${result.title}`}
            type="button"
            onClick={() =>
              navigateTo({ screen: 'entry', system: result.systemId, category: result.category, entry: result.title })
            }
            className="w-full rounded-md border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {result.systemName}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {result.category}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{result.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{result.snippet}</p>
          </button>
        ))}
      </div>
    );
  }

  function renderSystemCards() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-sm font-medium text-foreground">Rules Library unavailable</p>
          <p className="mt-1 text-xs text-muted-foreground">Please refresh shortly.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Systems</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {systems.map((sys) => {
            const Icon = SYSTEM_ICONS[sys.id] ?? ScrollText;
            return (
              <button
                key={sys.id}
                type="button"
                onClick={() => navigateTo({ screen: 'system', system: sys.id })}
                className="rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-2 font-[Cinzel] text-base text-foreground">{sys.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sys.totalEntries} entries &middot; {sys.categories.length} categories
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}

function SystemView({
  system,
  navigateTo,
}: {
  system: string;
  navigateTo: (v: RulesView) => void;
}) {
  const config = quickStartConfigs[system];
  const { data: systemData } = useSRDSystem(system);
  const [query, setQuery] = useState('');
  const { data: searchData, isFetching } = useSRDSearch(system, query);
  const searchResults = useMemo(() => searchData?.results ?? [], [searchData]);
  const systemName = systemData?.name ?? system;

  return (
    <div className="space-y-4">
      {renderSystemHeader()}
      {renderSystemSearch()}
      {query.trim().length >= 2 ? renderSystemSearchResults() : renderQuickStartOrBrowse()}
    </div>
  );

  function renderSystemHeader() {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[Cinzel] text-lg text-foreground">{systemName}</h2>
          {config && <p className="text-xs text-muted-foreground">{config.tagline}</p>}
        </div>
        <button
          type="button"
          onClick={() => navigateTo({ screen: 'browse', system })}
          className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Browse all
        </button>
      </div>
    );
  }

  function renderSystemSearch() {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${systemName}...`}
          className="w-full rounded-md border border-border bg-input py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    );
  }

  function renderSystemSearchResults() {
    if (isFetching) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }
    if (searchResults.length === 0) {
      return (
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-sm font-medium text-foreground">No matching rules found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try broader terms.</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {searchResults.length} results
        </p>
        {searchResults.map((result) => (
          <button
            key={`${result.category}:${result.title}`}
            type="button"
            onClick={() =>
              navigateTo({ screen: 'entry', system, category: result.category, entry: result.title })
            }
            className="w-full rounded-md border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="mb-1 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {result.category}
            </span>
            <p className="text-sm font-medium text-foreground">{result.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{result.snippet}</p>
          </button>
        ))}
      </div>
    );
  }

  function renderQuickStartOrBrowse() {
    if (!config) {
      return renderCategoryBrowseFallback();
    }
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Start</p>
        {config.sections.map((section) => renderQuickStartSection(section))}
      </div>
    );
  }

  function renderQuickStartSection(section: QuickStartSection) {
    const Icon = section.icon;
    return (
      <div key={section.title} className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
            <p className="text-[11px] text-muted-foreground">{section.description}</p>
          </div>
        </div>
        <ul className="space-y-1">
          {section.links.map((link) => renderQuickStartLink(link))}
        </ul>
      </div>
    );
  }

  function renderQuickStartLink(link: QuickStartLink) {
    const handleClick = () => {
      if (link.type === 'category') {
        navigateTo({ screen: 'browse', system, category: link.category });
      } else {
        navigateTo({ screen: 'entry', system, category: link.category, entry: link.entry! });
      }
    };
    return (
      <li key={link.label}>
        <button
          type="button"
          onClick={handleClick}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
        >
          {link.type === 'category' ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <ScrollText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1 text-foreground">{link.label}</span>
          {link.badge && (
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {link.badge}
            </span>
          )}
        </button>
      </li>
    );
  }

  function renderCategoryBrowseFallback() {
    if (!systemData) return null;
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {systemData.categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => navigateTo({ screen: 'browse', system, category: cat.name })}
              className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <FolderOpen className="h-4 w-4 text-primary" />
              <p className="mt-1.5 text-sm font-medium text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.count} entries</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
}

function BrowseView({
  system,
  category,
  navigateTo,
}: {
  system: string;
  category?: string;
  navigateTo: (v: RulesView) => void;
}) {
  const { data: systemData, isLoading: systemLoading } = useSRDSystem(system);
  const { data: categoryData, isLoading: categoryLoading } = useSRDCategoryEntries(
    system,
    category || '',
  );

  const isLoading = category ? categoryLoading : systemLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (category && categoryData) {
    return renderEntryList();
  }

  return renderCategoryGrid();

  function renderEntryList() {
    const entries = categoryData!.entries;
    const grouped = useMemo(() => {
      const groups = new Map<string, string[]>();
      for (const entry of entries) {
        const letter = entry[0]?.toUpperCase() || '#';
        if (!groups.has(letter)) groups.set(letter, []);
        groups.get(letter)!.push(entry);
      }
      return Array.from(groups.entries());
    }, [entries]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {entries.length} entries in {category}
          </p>
        </div>
        {grouped.map(([letter, items]) => (
          <div key={letter}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {letter}
            </h3>
            <div className="grid gap-1 sm:grid-cols-2">
              {items.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => navigateTo({ screen: 'entry', system, category: category!, entry })}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <ScrollText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{entry}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderCategoryGrid() {
    if (!systemData) return null;
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {systemData.categories.length} categories
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {systemData.categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => navigateTo({ screen: 'browse', system, category: cat.name })}
              className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <FolderOpen className="h-4 w-4 text-primary" />
              <p className="mt-1.5 text-sm font-medium text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.count} entries</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
}

function EntryView({
  system,
  category,
  entry,
  navigateTo,
}: {
  system: string;
  category: string;
  entry: string;
  navigateTo: (v: RulesView) => void;
}) {
  const entryPath = category === 'General' ? entry : `${category}/${entry}`;
  const { data: entryData, isLoading } = useSRDEntry(system, entryPath);
  const { data: categoryData } = useSRDCategoryEntries(system, category);

  const prevNext = useMemo(() => {
    const list = categoryData?.entries ?? [];
    const currentIndex = list.indexOf(entry);
    if (currentIndex < 0) return { prev: null as string | null, next: null as string | null };
    return {
      prev: currentIndex > 0 ? list[currentIndex - 1] : null,
      next: currentIndex < list.length - 1 ? list[currentIndex + 1] : null,
    };
  }, [categoryData?.entries, entry]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderEntryContent()}
      {renderPrevNext()}
    </div>
  );

  function renderEntryContent() {
    if (!entryData?.content) {
      return (
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">Entry not found.</p>
        </div>
      );
    }
    return (
      <article className="rounded-lg border border-border bg-card/50 p-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {entryData.content}
        </ReactMarkdown>
      </article>
    );
  }

  function renderPrevNext() {
    if (!prevNext.prev && !prevNext.next) return null;
    return (
      <div className="flex items-center justify-between border-t border-border pt-3">
        {prevNext.prev ? (
          <button
            type="button"
            onClick={() => navigateTo({ screen: 'entry', system, category, entry: prevNext.prev! })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {prevNext.prev}
          </button>
        ) : (
          <div />
        )}
        {prevNext.next ? (
          <button
            type="button"
            onClick={() => navigateTo({ screen: 'entry', system, category, entry: prevNext.next! })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {prevNext.next}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div />
        )}
      </div>
    );
  }
}
