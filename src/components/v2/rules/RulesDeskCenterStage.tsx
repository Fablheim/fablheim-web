import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  Pin,
  PinOff,
  ScrollText,
  Search,
} from 'lucide-react';
import { useCampaign } from '@/hooks/useCampaigns';
import {
  useSRDCategoryEntries,
  useSRDEntry,
  useSRDSearch,
  useSRDSystem,
  useSRDSystems,
} from '@/hooks/useSRD';
import type { SRDSearchResult } from '@/api/srd';
import type { CampaignSystem } from '@/types/campaign';

interface RulesDeskCenterStageProps {
  campaignId: string;
}

type SourceFilter = 'all' | 'srd';

type PinnedRule = {
  system: string;
  category: string;
  entry: string;
  title: string;
};

type RecentRule = PinnedRule & { viewedAt: string };

const RULES_PINNED_STORAGE_KEY = 'fablheim:v2:pinned-rules';
const RULES_RECENT_STORAGE_KEY = 'fablheim:v2:recent-rules';

const panelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(22,24%,9%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(212,42%,58%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-4 font-[Cinzel] text-3xl text-[hsl(38,42%,90%)]">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-3 mt-8 font-[Cinzel] text-2xl text-[hsl(38,34%,86%)]">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-2 mt-6 font-[Cinzel] text-xl text-[hsl(38,30%,82%)]">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 leading-8 text-[hsl(32,18%,74%)]">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-5 list-disc space-y-2 pl-6 text-[hsl(32,18%,74%)]">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-5 list-decimal space-y-2 pl-6 text-[hsl(32,18%,74%)]">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-7">{children}</li>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-6 overflow-x-auto rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.72)]">
      <table className="min-w-full border-collapse text-left text-sm text-[hsl(32,18%,78%)]">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-[hsla(220,18%,12%,0.92)]">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="[&_tr:last-child]:border-b-0">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b border-[hsla(32,24%,24%,0.42)]">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-4 py-3 font-[Cinzel] text-xs uppercase tracking-[0.16em] text-[hsl(38,34%,86%)]">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-4 py-3 align-top leading-6 text-[hsl(32,18%,74%)]">{children}</td>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-5 rounded-r-2xl border-l-2 border-[hsla(212,42%,58%,0.52)] bg-[hsla(212,22%,14%,0.28)] px-4 py-3 italic text-[hsl(32,18%,72%)]">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-[hsla(24,18%,10%,0.84)] px-1.5 py-0.5 text-[hsl(38,74%,76%)]">{children}</code>
  ),
};

export function RulesDeskCenterStage({ campaignId }: RulesDeskCenterStageProps) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: systemsData } = useSRDSystems();
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [selectedEntryPath, setSelectedEntryPath] = useState<string | null>(null);
  const [selectedEntryTitle, setSelectedEntryTitle] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [pinnedRules, setPinnedRules] = useState<PinnedRule[]>(() => readStoredJson(RULES_PINNED_STORAGE_KEY, []));
  const [recentRules, setRecentRules] = useState<RecentRule[]>(() => readStoredJson(RULES_RECENT_STORAGE_KEY, []));

  const preferredSystem = normalizeCampaignSystem(campaign?.system);
  const selectedSystem =
    selectedSystemId
    ?? preferredSystem
    ?? systemsData?.systems[0]?.id
    ?? '';

  const { data: systemMeta } = useSRDSystem(selectedSystem);

  const currentCategory =
    selectedCategory && systemMeta?.categories.some((category) => category.name === selectedCategory)
      ? selectedCategory
      : '';

  const { data: categoryData } = useSRDCategoryEntries(selectedSystem, query.trim() ? '' : currentCategory);
  const { data: searchData, isFetching: isSearching } = useSRDSearch(selectedSystem, query.trim());
  const recordRecentRule = (rule: { system: string; category: string; entry: string; title: string }) => {
    setRecentRules((current) => {
      const next: RecentRule[] = [
        {
          ...rule,
          viewedAt: new Date().toISOString(),
        },
        ...current.filter((item) => !(item.system === rule.system && item.entry === rule.entry)),
      ].slice(0, 12);
      return next;
    });
  };

  const categoryEntries = useMemo(() => categoryData?.entries ?? [], [categoryData?.entries]);
  const fallbackEntry = !query.trim() && currentCategory && categoryEntries.length > 0 ? categoryEntries[0] : null;
  const activeEntryPath = selectedEntryPath ?? (fallbackEntry ? buildEntryPath(currentCategory, fallbackEntry) : null);
  const activeEntryTitle = selectedEntryTitle ?? (fallbackEntry ? extractRuleTitle(fallbackEntry) : null);
  const { data: entryData, isLoading: isEntryLoading } = useSRDEntry(selectedSystem, activeEntryPath ?? '');
  const visibleResults = useMemo(
    () => (sourceFilter === 'all' || sourceFilter === 'srd' ? searchData?.results ?? [] : []),
    [searchData?.results, sourceFilter],
  );

  const pinnedForSystem = useMemo(
    () => pinnedRules.filter((rule) => rule.system === selectedSystem),
    [pinnedRules, selectedSystem],
  );

  const recentForSystem = useMemo(
    () => recentRules.filter((rule) => rule.system === selectedSystem).slice(0, 4),
    [recentRules, selectedSystem],
  );

  const relatedRules = useMemo(() => {
    if (!activeEntryPath || !categoryEntries.length) return [];
    return categoryEntries
      .filter((entry) => buildEntryPath(currentCategory, entry) !== activeEntryPath)
      .slice(0, 6);
  }, [activeEntryPath, categoryEntries, currentCategory]);

  useEffect(() => {
    window.localStorage.setItem(RULES_PINNED_STORAGE_KEY, JSON.stringify(pinnedRules));
  }, [pinnedRules]);

  useEffect(() => {
    window.localStorage.setItem(RULES_RECENT_STORAGE_KEY, JSON.stringify(recentRules));
  }, [recentRules]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(212,40%,24%,0.12),transparent_30%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(22,22%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">Rules Desk</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
            Rules Reference
          </h2>
          <RulesOverview
            selectedSystem={systemMeta?.name ?? 'Loading…'}
            categories={systemMeta?.categories.length ?? 0}
            pinnedCount={pinnedForSystem.length}
            recentCount={recentForSystem.length}
          />
        </div>
        <p className="mt-2 max-w-2xl text-xs text-[hsl(30,14%,62%)]">
          Quick SRD lookup for live play and prep, with pinned rules kept close at hand.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[272px_minmax(0,1fr)]">
          <aside className={`${panelClass} min-h-0 overflow-hidden`}>
            <RulesExplorer
              systems={systemsData?.systems ?? []}
              selectedSystem={selectedSystem}
              selectedCategory={currentCategory}
              openCategories={openCategories}
              query={query}
              sourceFilter={sourceFilter}
              categories={systemMeta?.categories ?? []}
              categoryEntries={categoryEntries}
              searchResults={visibleResults}
              isSearching={isSearching}
              activeEntryPath={activeEntryPath}
              onSystemChange={(system) => {
                setSelectedSystemId(system);
                setSelectedCategory(null);
                setOpenCategories([]);
                setSelectedEntryPath(null);
                setSelectedEntryTitle(null);
                setQuery('');
              }}
              onCategoryToggle={(category, nextOpen) => {
                setOpenCategories((current) =>
                  nextOpen
                    ? (current.includes(category) ? current : [...current, category])
                    : current.filter((item) => item !== category),
                );
              }}
              onCategorySelect={(category, nextOpen) => {
                setSelectedCategory(nextOpen ? category : null);
                setSelectedEntryPath(null);
                setSelectedEntryTitle(null);
              }}
              onQueryChange={setQuery}
              onSourceFilterChange={setSourceFilter}
              onSelectEntry={(entry, category, title) => {
                const entryPath = buildEntryPath(category, entry);
                setSelectedCategory(category);
                setSelectedEntryPath(entryPath);
                setSelectedEntryTitle(title);
                recordRecentRule({ system: selectedSystem, category, entry: entryPath, title });
              }}
            />
          </aside>

          <section className={`${panelClass} min-h-0 overflow-hidden`}>
            <RuleWorkspace
              selectedSystem={selectedSystem}
              selectedSystemName={systemMeta?.name ?? selectedSystem}
              category={currentCategory}
              categoryEntries={categoryEntries}
              entryPath={activeEntryPath}
              entryTitle={activeEntryTitle}
              entryContent={entryData?.content ?? ''}
              isLoading={isEntryLoading}
              pinned={Boolean(
                activeEntryPath && pinnedRules.some((rule) => rule.system === selectedSystem && rule.entry === activeEntryPath),
              )}
              pinnedRules={pinnedForSystem}
              recentRules={recentForSystem}
              onOpenRule={(rule) => {
                setSelectedCategory(rule.category);
                setSelectedEntryPath(rule.entry);
                setSelectedEntryTitle(rule.title);
                recordRecentRule(rule);
              }}
              relatedRules={relatedRules}
              onOpenRelatedRule={(entry) => {
                const title = extractRuleTitle(entry);
                const entryPath = buildEntryPath(category, entry);
                setSelectedEntryPath(entryPath);
                setSelectedEntryTitle(title);
                recordRecentRule({ system: selectedSystem, category, entry: entryPath, title });
              }}
              onTogglePin={() => {
                if (!activeEntryPath) return;
                const title = activeEntryTitle ?? extractRuleTitle(activeEntryPath);
                setPinnedRules((current) => {
                  const exists = current.some((rule) => rule.system === selectedSystem && rule.entry === activeEntryPath);
                  if (exists) {
                    return current.filter((rule) => !(rule.system === selectedSystem && rule.entry === activeEntryPath));
                  }
                  return [
                    { system: selectedSystem, category: currentCategory, entry: activeEntryPath, title },
                    ...current,
                  ].slice(0, 16);
                });
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function RulesOverview({
  selectedSystem,
  categories,
  pinnedCount,
  recentCount,
}: {
  selectedSystem: string;
  categories: number;
  pinnedCount: number;
  recentCount: number;
}) {
  const cards = [
    { label: 'Shelf', value: selectedSystem },
    { label: 'Categories', value: String(categories) },
    { label: 'Pinned', value: String(pinnedCount) },
    { label: 'Recent', value: String(recentCount) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1.5"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">{card.label}</span>
          <span className="ml-2 font-[Cinzel] text-sm text-[hsl(38,40%,88%)]">{card.value}</span>
        </div>
      ))}
    </div>
  );
}

function RulesExplorer({
  systems,
  selectedSystem,
  selectedCategory,
  openCategories,
  query,
  sourceFilter,
  categories,
  categoryEntries,
  searchResults,
  isSearching,
  activeEntryPath,
  onSystemChange,
  onCategoryToggle,
  onCategorySelect,
  onQueryChange,
  onSourceFilterChange,
  onSelectEntry,
}: {
  systems: Array<{ id: string; name: string }>;
  selectedSystem: string;
  selectedCategory: string;
  openCategories: string[];
  query: string;
  sourceFilter: SourceFilter;
  categories: Array<{ name: string; count: number }>;
  categoryEntries: string[];
  searchResults: SRDSearchResult[];
  isSearching: boolean;
  activeEntryPath: string | null;
  onSystemChange: (system: string) => void;
  onCategoryToggle: (category: string, nextOpen: boolean) => void;
  onCategorySelect: (category: string, nextOpen: boolean) => void;
  onQueryChange: (query: string) => void;
  onSourceFilterChange: (filter: SourceFilter) => void;
  onSelectEntry: (entry: string, category: string, title: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Rules Explorer</p>
        <h3 className="mt-1 font-['IM_Fell_English'] text-2xl text-[hsl(38,36%,88%)]">Codex Shelf</h3>
        <div className="mt-4 space-y-3">
          <select
            value={selectedSystem}
            onChange={(event) => onSystemChange(event.target.value)}
            className={inputClass}
          >
            {systems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </select>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(212,18%,56%)]" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search combat, conditions, spells..."
              className={`${inputClass} pl-10`}
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSourceFilterChange('all')}
              className={filterChipClass(sourceFilter === 'all')}
            >
              All Sources
            </button>
            <button
              type="button"
              onClick={() => onSourceFilterChange('srd')}
              className={filterChipClass(sourceFilter === 'srd')}
            >
              SRD
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {!query.trim() && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Codex Tree</p>
              <div className="mt-3 space-y-1">
                {categories.map((category) => {
                  const isOpen = openCategories.includes(category.name);
                  const isSelectedCategory = selectedCategory === category.name;

                  return (
                    <div key={category.name} className="rounded-[14px]">
                      <button
                        type="button"
                        onClick={() => {
                          const nextOpen = !isOpen;
                          onCategoryToggle(category.name, nextOpen);
                          onCategorySelect(category.name, nextOpen);
                        }}
                        className={`flex w-full items-center gap-2 rounded-[14px] px-2.5 py-2 text-left transition ${
                          isSelectedCategory
                            ? 'bg-[hsla(212,42%,58%,0.1)] text-[hsl(38,34%,88%)]'
                            : 'text-[hsl(30,14%,66%)] hover:bg-[hsla(24,18%,12%,0.72)] hover:text-[hsl(38,30%,84%)]'
                        }`}
                      >
                        <span className="text-[hsl(212,24%,66%)]">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                        <FolderOpen className="h-4 w-4 text-[hsl(212,34%,74%)]" />
                        <div>
                          <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{category.name}</p>
                          <p className="text-xs text-[hsl(30,14%,56%)]">{category.count} entries</p>
                        </div>
                      </button>

                      {isOpen && isSelectedCategory && categoryEntries.length > 0 && (
                        <div className="ml-5 mt-1 border-l border-[hsla(32,24%,24%,0.42)] pl-3">
                          {categoryEntries.map((entry) => {
                            const isActiveRule = activeEntryPath === buildEntryPath(selectedCategory, entry);
                            return (
                              <button
                                key={entry}
                                type="button"
                                onClick={() => onSelectEntry(entry, selectedCategory, extractRuleTitle(entry))}
                                className={`flex w-full items-center gap-2 rounded-[12px] px-2 py-1.5 text-left transition ${
                                  isActiveRule
                                    ? 'bg-[hsla(212,42%,58%,0.1)] text-[hsl(38,34%,88%)]'
                                    : 'text-[hsl(32,18%,74%)] hover:bg-[hsla(24,18%,12%,0.72)]'
                                }`}
                              >
                                <ScrollText className="h-3.5 w-3.5 text-[hsl(212,24%,66%)]" />
                                <span className="text-sm">{extractRuleTitle(entry)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">
                {query.trim() ? 'Search Results' : 'Rules'}
              </p>
              {!query.trim() && selectedCategory && (
                <span className="text-[11px] uppercase tracking-[0.16em] text-[hsl(30,12%,58%)]">
                  {selectedCategory}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1">
              {query.trim() ? (
                <>
                  {isSearching && (
                    <div className="rounded-[14px] px-3 py-3 text-sm text-[hsl(30,14%,56%)]">
                      Searching the codex…
                    </div>
                  )}
                  {!isSearching && !searchResults.length && (
                    <div className="rounded-[14px] px-3 py-3 text-sm text-[hsl(30,14%,56%)]">
                      No matching SRD rules for that search yet.
                    </div>
                  )}
                  {searchResults.map((result) => (
                    <button
                      key={`${result.category}:${result.title}`}
                      type="button"
                      onClick={() => onSelectEntry(result.title, result.category, result.title)}
                      className="w-full rounded-[14px] px-2.5 py-2.5 text-left transition hover:bg-[hsla(24,18%,12%,0.72)]"
                    >
                      <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{result.title}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
                        {result.category} · SRD
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[hsl(30,14%,58%)]">{result.snippet}</p>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {!categoryEntries.length && (
                    <div className="rounded-[14px] px-3 py-3 text-sm text-[hsl(30,14%,56%)]">
                      Choose a category to browse entries.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleWorkspace({
  selectedSystem,
  selectedSystemName,
  category,
  categoryEntries,
  entryPath,
  entryTitle,
  entryContent,
  isLoading,
  pinned,
  pinnedRules,
  recentRules,
  onOpenRule,
  relatedRules,
  onOpenRelatedRule,
  onTogglePin,
}: {
  selectedSystem: string;
  selectedSystemName: string;
  category: string;
  categoryEntries: string[];
  entryPath: string | null;
  entryTitle: string | null;
  entryContent: string;
  isLoading: boolean;
  pinned: boolean;
  pinnedRules: PinnedRule[];
  recentRules: RecentRule[];
  onOpenRule: (rule: PinnedRule) => void;
  relatedRules: string[];
  onOpenRelatedRule: (entry: string) => void;
  onTogglePin: () => void;
}) {
  if (!entryPath) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <ReaderUtilities pinnedRules={pinnedRules} recentRules={recentRules} onOpenRule={onOpenRule} />
        <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Rule Viewer</p>
          <h3 className="mt-2 font-['IM_Fell_English'] text-3xl text-[hsl(38,40%,90%)]">
            {category ? `${category} shelf open.` : 'Open a rule from the codex.'}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[hsl(30,14%,58%)]">
            {category
              ? `Browse the entries in ${category}, then open the rule you want in the explorer.`
              : 'Search for a mechanic, browse a category, or revisit something pinned for faster in-session lookup.'}
          </p>

          {categoryEntries.length > 0 && (
            <div className="mt-6 border-t border-[hsla(32,24%,24%,0.42)] pt-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Shelf Snapshot</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryEntries.slice(0, 10).map((entry) => (
                  <span
                    key={entry}
                    className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1.5 text-xs text-[hsl(212,34%,74%)]"
                  >
                    {extractRuleTitle(entry)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <ReaderUtilities pinnedRules={pinnedRules} recentRules={recentRules} onOpenRule={onOpenRule} />

      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[linear-gradient(180deg,hsla(34,18%,13%,0.96)_0%,hsla(28,14%,9%,0.98)_100%)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Rule Workspace</p>
            <h3 className="mt-1 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,40%,90%)]">
              {entryTitle ?? extractRuleTitle(entryPath)}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <WorkspaceBadge label={category || 'Reference'} />
              <WorkspaceBadge label={selectedSystemName} />
              <WorkspaceBadge label="SRD" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onTogglePin}
              className="inline-flex items-center gap-2 rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(212,34%,74%)]"
            >
              {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              {pinned ? 'Unpin' : 'Pin Rule'}
            </button>
            <a
              href={`/srd/${selectedSystem}/${encodeURIComponent(category)}/${encodeURIComponent(extractRuleSlug(entryPath))}`}
              className="inline-flex items-center gap-2 rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(212,34%,74%)]"
            >
              <ExternalLink className="h-4 w-4" />
              Open SRD Page
            </a>
          </div>
        </div>

        <div className="px-6 py-6">
          {isLoading ? (
            <div className="text-sm text-[hsl(30,14%,58%)]">Loading rule text…</div>
          ) : (
            <article className="max-w-none [&_.contains-task-list]:pl-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {entryContent}
              </ReactMarkdown>
            </article>
          )}

          {relatedRules.length > 0 && (
            <div className="mt-8 border-t border-[hsla(32,24%,24%,0.42)] pt-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Related Rules</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedRules.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => onOpenRelatedRule(entry)}
                    className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1.5 text-xs text-[hsl(212,34%,74%)]"
                  >
                    {extractRuleTitle(entry)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReaderUtilities({
  pinnedRules,
  recentRules,
  onOpenRule,
}: {
  pinnedRules: PinnedRule[];
  recentRules: RecentRule[];
  onOpenRule: (rule: PinnedRule) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <details className="min-w-[240px] flex-1 rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-4 py-3">
        <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
          Pinned Rules
          <span className="ml-2 font-[Cinzel] text-sm normal-case text-[hsl(38,34%,86%)]">{pinnedRules.length}</span>
        </summary>
        <div className="mt-3 space-y-2">
          {pinnedRules.length ? pinnedRules.map((rule) => (
            <button
              key={`${rule.system}:${rule.entry}`}
              type="button"
              onClick={() => onOpenRule(rule)}
              className="w-full rounded-[16px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.82)] px-3 py-3 text-left transition hover:border-[hsla(212,24%,34%,0.42)]"
            >
              <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{rule.title}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{rule.category}</p>
            </button>
          )) : (
            <p className="text-sm text-[hsl(30,14%,56%)]">Pin the rules your table reaches for often.</p>
          )}
        </div>
      </details>

      <details className="min-w-[240px] flex-1 rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-4 py-3">
        <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
          Recent Lookups
          <span className="ml-2 font-[Cinzel] text-sm normal-case text-[hsl(38,34%,86%)]">{recentRules.length}</span>
        </summary>
        <div className="mt-3 space-y-2">
          {recentRules.length ? recentRules.map((rule) => (
            <button
              key={`${rule.system}:${rule.entry}:${rule.viewedAt}`}
              type="button"
              onClick={() => onOpenRule(rule)}
              className="w-full rounded-[16px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.82)] px-3 py-3 text-left transition hover:border-[hsla(212,24%,34%,0.42)]"
            >
              <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{rule.title}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
                {rule.category} · {formatRecent(rule.viewedAt)}
              </p>
            </button>
          )) : (
            <p className="text-sm text-[hsl(30,14%,56%)]">Recent rules will show up here as you use the desk.</p>
          )}
        </div>
      </details>
    </div>
  );
}

function WorkspaceBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1 text-xs text-[hsl(212,34%,74%)]">
      {label}
    </span>
  );
}

function filterChipClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition ${
    active
      ? 'border border-[hsla(212,42%,58%,0.36)] bg-[hsla(212,42%,58%,0.1)] text-[hsl(212,52%,78%)]'
      : 'border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.7)] text-[hsl(30,12%,58%)]'
  }`;
}

function normalizeCampaignSystem(system?: CampaignSystem) {
  if (!system || system === 'custom') return null;
  return system;
}

function buildEntryPath(category: string, entry: string) {
  return category === 'General' ? entry : `${category}/${entry}`;
}

function extractRuleSlug(entry: string) {
  return entry.split('/').pop() ?? entry;
}

function extractRuleTitle(entry: string) {
  return extractRuleSlug(entry)
    ?.replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase()) ?? entry;
}

function formatRecent(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
