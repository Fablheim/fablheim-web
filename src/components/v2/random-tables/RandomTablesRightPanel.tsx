import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FilePlus2, Search } from 'lucide-react';
import type { RandomTable, RandomTableSourceType } from '@/types/random-table';
import { useRandomTablesContext } from './RandomTablesContext';

type SourceFilter = 'all' | RandomTableSourceType;

const sourceMeta: Record<RandomTableSourceType, { label: string; accent: string }> = {
  srd: { label: 'SRD', accent: 'text-[hsl(201,52%,76%)] border-[hsla(201,42%,58%,0.28)] bg-[hsla(201,42%,26%,0.12)]' },
  campaign: { label: 'Campaign', accent: 'text-[hsl(42,78%,76%)] border-[hsla(42,72%,52%,0.28)] bg-[hsla(42,72%,42%,0.12)]' },
  custom: { label: 'Custom', accent: 'text-[hsl(153,42%,72%)] border-[hsla(153,42%,52%,0.28)] bg-[hsla(153,42%,26%,0.12)]' },
};

export function RandomTablesRightPanel() {
  const { tables, selectedTableId, workspaceMode, setSelectedTableId, setWorkspaceMode, startCreate } =
    useRandomTablesContext();

  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const visibleTables = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tables.filter((t) => {
      if (sourceFilter !== 'all' && t.sourceType !== sourceFilter) return false;
      if (!q) return true;
      return `${t.name} ${t.category} ${t.description} ${t.sourceLabel}`.toLowerCase().includes(q);
    });
  }, [tables, query, sourceFilter]);

  const categories = useMemo(() => {
    const grouped = new Map<string, RandomTable[]>();
    for (const table of visibleTables) {
      const key = table.category || 'Unsorted';
      const current = grouped.get(key) ?? [];
      current.push(table);
      grouped.set(key, current);
    }
    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [visibleTables]);

  useEffect(() => {
    if (categories.length === 0) return;
    setOpenCategories((current) => {
      const next = { ...current };
      for (const { category } of categories) {
        if (!(category in next)) next[category] = true;
      }
      return next;
    });
  }, [categories]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderList()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Table Library</p>
          <button type="button" onClick={startCreate} className={btnClass(true)}>
            <FilePlus2 className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-[14px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.68)] px-2.5 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,50%)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full bg-transparent text-xs text-[hsl(38,24%,88%)] outline-none placeholder:text-[hsl(30,12%,42%)]"
          />
        </label>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {(['all', 'srd', 'campaign', 'custom'] as SourceFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSourceFilter(value)}
              className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                sourceFilter === value
                  ? 'border-[hsla(42,72%,52%,0.4)] bg-[hsla(42,72%,42%,0.14)] text-[hsl(42,78%,78%)]'
                  : 'border-[hsla(32,24%,24%,0.48)] bg-[hsla(24,18%,10%,0.56)] text-[hsl(30,12%,58%)] hover:text-[hsl(38,24%,88%)]'
              }`}
            >
              {value === 'all' ? 'All' : sourceMeta[value].label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {categories.length === 0 ? (
          <div className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">No tables match.</div>
        ) : (
          <div className="space-y-1.5">
            {categories.map(({ category, items }) => renderCategory(category, items))}
          </div>
        )}
      </div>
    );
  }

  function renderCategory(category: string, items: RandomTable[]) {
    const isOpen = openCategories[category] ?? true;
    return (
      <div
        key={category}
        className="rounded-[16px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] px-1.5 py-1.5"
      >
        <button
          type="button"
          onClick={() => setOpenCategories((c) => ({ ...c, [category]: !isOpen }))}
          className="flex w-full items-center gap-2 rounded-[12px] px-2 py-1.5 text-left hover:bg-[hsla(32,24%,18%,0.26)]"
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,58%)]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,58%)]" />
          )}
          <span className="truncate font-[Cinzel] text-xs text-[hsl(38,32%,86%)]">{category}</span>
          <span className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,62%)]">
            {items.length}
          </span>
        </button>

        {isOpen && (
          <div className="mt-0.5 space-y-0.5 pl-4">
            {items.map((table) => renderTableRow(table))}
          </div>
        )}
      </div>
    );
  }

  function renderTableRow(table: RandomTable) {
    const isSelected = selectedTableId === table._id && workspaceMode === 'view';
    return (
      <button
        key={table._id}
        type="button"
        onClick={() => {
          setWorkspaceMode('view');
          setSelectedTableId(table._id);
        }}
        className={`flex w-full items-start gap-2 rounded-[12px] px-2.5 py-2 text-left transition ${
          isSelected
            ? 'bg-[hsla(42,72%,42%,0.14)]'
            : 'hover:bg-[hsla(32,24%,18%,0.22)]'
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-[hsl(38,24%,88%)]">{table.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${sourceMeta[table.sourceType].accent}`}
            >
              {table.sourceLabel}
            </span>
            <span className="text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,52%)]">
              {table.diceExpression}
            </span>
          </div>
        </div>
      </button>
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
