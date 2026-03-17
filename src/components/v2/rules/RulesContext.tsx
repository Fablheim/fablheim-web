import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useCampaign } from '@/hooks/useCampaigns';
import {
  useSRDCategoryEntries,
  useSRDEntry,
  useSRDSearch,
  useSRDSystem,
  useSRDSystems,
} from '@/hooks/useSRD';
import type { CampaignSystem } from '@/types/campaign';

// ── Storage ────────────────────────────────────────────────────────────────────

const RULES_PINNED_STORAGE_KEY = 'fablheim:v2:pinned-rules';
const RULES_RECENT_STORAGE_KEY = 'fablheim:v2:recent-rules';

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type SourceFilter = 'all' | 'srd';

export type PinnedRule = {
  system: string;
  category: string;
  entry: string;
  title: string;
};

export type RecentRule = PinnedRule & { viewedAt: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildEntryPath(category: string, entry: string) {
  return category === 'General' ? entry : `${category}/${entry}`;
}

export function extractRuleSlug(entry: string) {
  return entry.split('/').pop() ?? entry;
}

export function extractRuleTitle(entry: string) {
  return (
    extractRuleSlug(entry)
      ?.replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase()) ?? entry
  );
}

function normalizeCampaignSystem(system?: CampaignSystem) {
  if (!system || system === 'custom') return null;
  return system;
}

// ── Context value ──────────────────────────────────────────────────────────────

interface RulesContextValue {
  campaignId: string;

  // System selection
  systems: Array<{ id: string; name: string }>;
  selectedSystem: string;
  systemName: string;
  systemCategories: Array<{ name: string; count: number }>;
  setSelectedSystemId: (id: string) => void;

  // Category / entry selection
  selectedCategory: string;
  openCategories: string[];
  selectedEntryPath: string | null;
  selectedEntryTitle: string | null;
  activeEntryPath: string | null;
  activeEntryTitle: string | null;
  categoryEntries: string[];
  entryContent: string;
  isEntryLoading: boolean;
  relatedRules: string[];
  setSelectedCategory: (category: string | null) => void;
  setOpenCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
  selectEntry: (entry: string, category: string, title: string) => void;

  // Search
  query: string;
  sourceFilter: SourceFilter;
  isSearching: boolean;
  searchResults: ReturnType<typeof useSRDSearch>['data'] extends { results: infer R } | undefined ? R : never[];
  setQuery: (query: string) => void;
  setSourceFilter: (filter: SourceFilter) => void;

  // Pinned / recent
  pinnedRules: PinnedRule[];
  recentRules: RecentRule[];
  pinnedForSystem: PinnedRule[];
  recentForSystem: RecentRule[];
  isPinned: boolean;
  togglePin: () => void;
  openRule: (rule: PinnedRule) => void;

  // System change (resets everything)
  changeSystem: (system: string) => void;
}

const RulesContext = createContext<RulesContextValue | null>(null);

export function useRulesContext() {
  const ctx = useContext(RulesContext);
  if (!ctx) throw new Error('useRulesContext must be used within RulesProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function RulesProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: systemsData } = useSRDSystems();

  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategoryState] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [selectedEntryPath, setSelectedEntryPath] = useState<string | null>(null);
  const [selectedEntryTitle, setSelectedEntryTitle] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [pinnedRules, setPinnedRules] = useState<PinnedRule[]>(() =>
    readStoredJson(RULES_PINNED_STORAGE_KEY, []),
  );
  const [recentRules, setRecentRules] = useState<RecentRule[]>(() =>
    readStoredJson(RULES_RECENT_STORAGE_KEY, []),
  );

  const preferredSystem = normalizeCampaignSystem(campaign?.system);
  const selectedSystem =
    selectedSystemId ?? preferredSystem ?? systemsData?.systems[0]?.id ?? '';

  const { data: systemMeta } = useSRDSystem(selectedSystem);

  const currentCategory =
    selectedCategory && systemMeta?.categories.some((c) => c.name === selectedCategory)
      ? selectedCategory
      : '';

  const { data: categoryData } = useSRDCategoryEntries(
    selectedSystem,
    query.trim() ? '' : currentCategory,
  );
  const { data: searchData, isFetching: isSearching } = useSRDSearch(selectedSystem, query.trim());

  const categoryEntries = useMemo(() => categoryData?.entries ?? [], [categoryData?.entries]);
  const fallbackEntry =
    !query.trim() && currentCategory && categoryEntries.length > 0 ? categoryEntries[0] : null;
  const activeEntryPath =
    selectedEntryPath ?? (fallbackEntry ? buildEntryPath(currentCategory, fallbackEntry) : null);
  const activeEntryTitle =
    selectedEntryTitle ?? (fallbackEntry ? extractRuleTitle(fallbackEntry) : null);

  const { data: entryData, isLoading: isEntryLoading } = useSRDEntry(
    selectedSystem,
    activeEntryPath ?? '',
  );

  const visibleResults = useMemo(
    () => (sourceFilter === 'all' || sourceFilter === 'srd' ? searchData?.results ?? [] : []),
    [searchData?.results, sourceFilter],
  );

  const pinnedForSystem = useMemo(
    () => pinnedRules.filter((r) => r.system === selectedSystem),
    [pinnedRules, selectedSystem],
  );

  const recentForSystem = useMemo(
    () => recentRules.filter((r) => r.system === selectedSystem).slice(0, 4),
    [recentRules, selectedSystem],
  );

  const relatedRules = useMemo(() => {
    if (!activeEntryPath || !categoryEntries.length) return [];
    return categoryEntries
      .filter((entry) => buildEntryPath(currentCategory, entry) !== activeEntryPath)
      .slice(0, 6);
  }, [activeEntryPath, categoryEntries, currentCategory]);

  const isPinned = Boolean(
    activeEntryPath &&
      pinnedRules.some((r) => r.system === selectedSystem && r.entry === activeEntryPath),
  );

  useEffect(() => {
    window.localStorage.setItem(RULES_PINNED_STORAGE_KEY, JSON.stringify(pinnedRules));
  }, [pinnedRules]);

  useEffect(() => {
    window.localStorage.setItem(RULES_RECENT_STORAGE_KEY, JSON.stringify(recentRules));
  }, [recentRules]);

  function recordRecentRule(rule: PinnedRule) {
    setRecentRules((current) => {
      const next: RecentRule[] = [
        { ...rule, viewedAt: new Date().toISOString() },
        ...current.filter((item) => !(item.system === rule.system && item.entry === rule.entry)),
      ].slice(0, 12);
      return next;
    });
  }

  function selectEntry(entry: string, category: string, title: string) {
    const entryPath = buildEntryPath(category, entry);
    setSelectedCategoryState(category);
    setSelectedEntryPath(entryPath);
    setSelectedEntryTitle(title);
    recordRecentRule({ system: selectedSystem, category, entry: entryPath, title });
  }

  function openRule(rule: PinnedRule) {
    setSelectedCategoryState(rule.category);
    setSelectedEntryPath(rule.entry);
    setSelectedEntryTitle(rule.title);
    recordRecentRule(rule);
  }

  function toggleCategory(category: string) {
    const isOpen = openCategories.includes(category);
    const nextOpen = !isOpen;
    setOpenCategories(
      nextOpen
        ? openCategories.includes(category)
          ? openCategories
          : [...openCategories, category]
        : openCategories.filter((c) => c !== category),
    );
    setSelectedCategoryState(nextOpen ? category : null);
    setSelectedEntryPath(null);
    setSelectedEntryTitle(null);
  }

  function togglePin() {
    if (!activeEntryPath) return;
    const title = activeEntryTitle ?? extractRuleTitle(activeEntryPath);
    setPinnedRules((current) => {
      const exists = current.some(
        (r) => r.system === selectedSystem && r.entry === activeEntryPath,
      );
      if (exists) {
        return current.filter(
          (r) => !(r.system === selectedSystem && r.entry === activeEntryPath),
        );
      }
      return [
        { system: selectedSystem, category: currentCategory, entry: activeEntryPath, title },
        ...current,
      ].slice(0, 16);
    });
  }

  function changeSystem(system: string) {
    setSelectedSystemId(system);
    setSelectedCategoryState(null);
    setOpenCategories([]);
    setSelectedEntryPath(null);
    setSelectedEntryTitle(null);
    setQuery('');
  }

  const value: RulesContextValue = {
    campaignId,
    systems: systemsData?.systems ?? [],
    selectedSystem,
    systemName: systemMeta?.name ?? selectedSystem,
    systemCategories: systemMeta?.categories ?? [],
    setSelectedSystemId,
    selectedCategory: currentCategory,
    openCategories,
    selectedEntryPath,
    selectedEntryTitle,
    activeEntryPath,
    activeEntryTitle,
    categoryEntries,
    entryContent: entryData?.content ?? '',
    isEntryLoading,
    relatedRules,
    setSelectedCategory: setSelectedCategoryState,
    setOpenCategories,
    toggleCategory,
    selectEntry,
    query,
    sourceFilter,
    isSearching,
    searchResults: visibleResults,
    setQuery,
    setSourceFilter,
    pinnedRules,
    recentRules,
    pinnedForSystem,
    recentForSystem,
    isPinned,
    togglePin,
    openRule,
    changeSystem,
  };

  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>;
}
