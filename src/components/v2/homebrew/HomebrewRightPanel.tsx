import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  useHomebrewContext,
  CATEGORY_LABELS,
  CATEGORY_BADGE_CLASSES,
} from './HomebrewContext';
import type { HomebrewCategory } from './HomebrewContext';

type CategoryFilter = 'all' | HomebrewCategory;

const CATEGORY_ORDER: HomebrewCategory[] = ['race', 'class', 'subclass', 'background', 'feat', 'other'];

export function HomebrewRightPanel() {
  const {
    templates,
    selectedTemplateId,
    isCreating,
    setSelectedTemplateId,
    setIsCreating,
    setWorkspaceMode,
    startCreate,
  } = useHomebrewContext();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredGrouped = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = templates.filter((t) => {
      if (normalizedQuery) {
        const matches =
          t.name.toLowerCase().includes(normalizedQuery) ||
          (t.description ?? '').toLowerCase().includes(normalizedQuery) ||
          (t.tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedQuery));
        if (!matches) return false;
      }
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });

    const groups = new Map<HomebrewCategory, typeof templates>();
    for (const t of filtered) {
      const current = groups.get(t.category) ?? [];
      current.push(t);
      groups.set(t.category, current);
    }

    return CATEGORY_ORDER
      .filter((cat) => groups.has(cat))
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        items: groups.get(cat)!,
      }));
  }, [templates, query, categoryFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderSearch()}
      {renderList()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {renderCountPill(String(templates.length), 'Total', 'text-[hsl(42,78%,78%)]')}
          </div>
          <button type="button" onClick={startCreate} className={btnClass(true)}>
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </div>
    );
  }

  function renderCountPill(value: string, label: string, tone: string) {
    return (
      <div className="rounded-full border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] px-2 py-1 text-center">
        <p className={`text-[11px] font-medium ${tone}`}>{value}</p>
        <p className="text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">{label}</p>
      </div>
    );
  }

  function renderSearch() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(30,12%,42%)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(24,18%,10%,0.92)] py-1.5 pl-8 pr-3 text-[11px] text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,10%,44%)] outline-none transition focus:border-[hsla(42,64%,58%,0.58)]"
          />
        </div>
        {renderFilterPills()}
      </div>
    );
  }

  function renderFilterPills() {
    const filters: Array<[CategoryFilter, string]> = [
      ['all', 'All'],
      ['race', 'Races'],
      ['class', 'Classes'],
      ['subclass', 'Subclasses'],
      ['background', 'Backgrounds'],
      ['feat', 'Feats'],
      ['other', 'Other'],
    ];
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategoryFilter(value)}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] transition ${
              categoryFilter === value
                ? 'border-[hsla(42,64%,58%,0.62)] bg-[hsla(40,70%,52%,0.16)] text-[hsl(42,82%,78%)]'
                : 'border-[hsla(32,24%,26%,0.62)] text-[hsl(30,12%,60%)] hover:border-[hsla(42,40%,46%,0.42)] hover:text-[hsl(38,24%,82%)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  function renderList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {filteredGrouped.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">
            {templates.length === 0
              ? 'No homebrew templates yet. Create the first one.'
              : 'No templates match this filter.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredGrouped.map((group) => renderGroup(group))}
          </div>
        )}
      </div>
    );
  }

  function renderGroup(group: { category: HomebrewCategory; label: string; items: typeof templates }) {
    return (
      <div
        key={group.category}
        className="rounded-[16px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] p-2"
      >
        <p className="px-1.5 pb-1.5 font-[Cinzel] text-xs text-[hsl(38,32%,86%)]">
          {group.label}
        </p>
        <div className="space-y-1">
          {group.items.map((template) => renderTemplateButton(template))}
        </div>
      </div>
    );
  }

  function renderTemplateButton(template: (typeof templates)[number]) {
    const isSelected = selectedTemplateId === template._id && !isCreating;
    return (
      <button
        key={template._id}
        type="button"
        onClick={() => {
          setIsCreating(false);
          setWorkspaceMode('view');
          setSelectedTemplateId(template._id);
        }}
        className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
        }`}
      >
        {renderTemplateButtonContent(template)}
      </button>
    );
  }

  function renderTemplateButtonContent(template: (typeof templates)[number]) {
    return (
      <>
        <div className="flex items-start justify-between gap-1.5">
          <p className="truncate text-xs text-[hsl(35,24%,90%)]">{template.name}</p>
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${CATEGORY_BADGE_CLASSES[template.category]}`}>
            {CATEGORY_LABELS[template.category]}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-[hsl(30,12%,52%)]">
          {template.traits?.length ?? 0} traits · {template.features?.length ?? 0} features
        </p>
      </>
    );
  }
}

function btnClass(accent = false) {
  return `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] transition ${
    accent
      ? 'border-[hsla(42,72%,52%,0.38)] bg-[hsla(42,72%,42%,0.14)] text-[hsl(42,78%,80%)] hover:border-[hsla(42,72%,60%,0.46)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}
