import { FolderOpen, Pin, Search } from 'lucide-react';
import { useRulesContext } from './RulesContext';
import { extractRuleTitle } from './RulesContext';

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(212,42%,58%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

export function RulesRightPanel() {
  const ctx = useRulesContext();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderSearch()}
      {renderNav()}
    </div>
  );

  function renderSearch() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(212,18%,56%)]" />
          <input
            value={ctx.query}
            onChange={(event) => ctx.setQuery(event.target.value)}
            placeholder="Search rules…"
            className={`${inputClass} pl-9`}
          />
        </label>
      </div>
    );
  }

  function renderNav() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-3">
          {renderPinnedSection()}
          {renderRecentSection()}
          {renderCategoriesSection()}
        </div>
      </div>
    );
  }

  function renderPinnedSection() {
    if (ctx.pinnedForSystem.length === 0) return null;
    return (
      <div>
        {renderSectionHeader(<Pin className="h-3.5 w-3.5" />, 'Pinned', ctx.pinnedForSystem.length)}
        <div className="mt-1.5 space-y-1">
          {ctx.pinnedForSystem.map((rule) => (
            <button
              key={`${rule.system}:${rule.entry}`}
              type="button"
              onClick={() => ctx.openRule(rule)}
              className={ruleButtonClass(ctx.activeEntryPath === rule.entry)}
            >
              <p className="truncate text-xs text-[hsl(35,24%,90%)]">{rule.title}</p>
              <p className="mt-0.5 truncate text-[10px] text-[hsl(30,12%,52%)]">{rule.category}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderRecentSection() {
    if (ctx.recentForSystem.length === 0) return null;
    return (
      <div>
        {renderSectionHeader(null, 'Recent', ctx.recentForSystem.length)}
        <div className="mt-1.5 space-y-1">
          {ctx.recentForSystem.map((rule) => (
            <button
              key={`${rule.system}:${rule.entry}:${rule.viewedAt}`}
              type="button"
              onClick={() => ctx.openRule(rule)}
              className={ruleButtonClass(ctx.activeEntryPath === rule.entry)}
            >
              <p className="truncate text-xs text-[hsl(35,24%,90%)]">{rule.title}</p>
              <p className="mt-0.5 truncate text-[10px] text-[hsl(30,12%,52%)]">
                {rule.category}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderCategoriesSection() {
    if (ctx.systemCategories.length === 0) return null;
    return (
      <div>
        {renderSectionHeader(<FolderOpen className="h-3.5 w-3.5" />, 'Categories', ctx.systemCategories.length)}
        <div className="mt-1.5 space-y-1">
          {ctx.systemCategories.map((cat) => renderCategoryItem(cat))}
        </div>
      </div>
    );
  }

  function renderCategoryItem(cat: { name: string; count: number }) {
    const isOpen = ctx.openCategories.includes(cat.name);
    const isSelected = ctx.selectedCategory === cat.name;

    return (
      <div key={cat.name}>
        <button
          type="button"
          onClick={() => ctx.toggleCategory(cat.name)}
          className={`flex w-full items-center justify-between gap-2 rounded-[14px] px-2.5 py-1.5 text-left transition ${
            isSelected
              ? 'bg-[hsla(212,42%,58%,0.1)] text-[hsl(38,34%,88%)]'
              : 'text-[hsl(30,14%,66%)] hover:bg-[hsla(24,18%,12%,0.72)] hover:text-[hsl(38,30%,84%)]'
          }`}
        >
          <span className="truncate font-[Cinzel] text-[13px]">{cat.name}</span>
          <span className="shrink-0 text-[10px] text-[hsl(30,12%,52%)]">{cat.count}</span>
        </button>
        {isOpen && isSelected && ctx.categoryEntries.length > 0 && (
          <div className="ml-3 mt-1 border-l border-[hsla(32,24%,24%,0.42)] pl-2.5 space-y-0.5">
            {ctx.categoryEntries.map((entry) => {
              const entryTitle = extractRuleTitle(entry);
              const isActive = ctx.activeEntryPath?.endsWith(entry) ?? false;
              return (
                <button
                  key={entry}
                  type="button"
                  onClick={() => ctx.selectEntry(entry, cat.name, entryTitle)}
                  className={ruleButtonClass(isActive)}
                >
                  <p className="truncate text-xs">{entryTitle}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderSectionHeader(icon: React.ReactNode, label: string, count: number) {
    return (
      <div className="flex items-center gap-1.5 px-1 pb-0.5 text-[hsl(30,12%,56%)]">
        {icon}
        <p className="flex-1 text-[10px] uppercase tracking-[0.12em]">{label}</p>
        <span className="text-[10px]">{count}</span>
      </div>
    );
  }
}

function ruleButtonClass(active: boolean) {
  return `block w-full rounded-[12px] border px-2.5 py-1.5 text-left transition ${
    active
      ? 'border-[hsla(212,42%,58%,0.36)] bg-[hsla(212,42%,58%,0.08)] text-[hsl(38,34%,88%)]'
      : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] text-[hsl(32,18%,74%)] hover:border-[hsla(38,50%,58%,0.3)]'
  }`;
}
