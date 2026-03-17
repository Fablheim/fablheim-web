import { Search } from 'lucide-react';
import { useAIToolsContext, categoryLabels } from './AIToolsContext';
import type { ToolCategory } from './AIToolsContext';

export function AIToolsRightPanel() {
  const {
    creditBalance,
    creditCosts,
    selectedTool,
    setSelectedTool,
    toolSearch,
    setToolSearch,
    groupedTools,
  } = useAIToolsContext();

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
        <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,56%)]">AI Tools</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-[Cinzel] text-sm text-[hsl(38,34%,88%)]">Creative Bench</p>
          {renderCreditBadge()}
        </div>
      </div>
    );
  }

  function renderCreditBadge() {
    const total = creditBalance?.total ?? 0;
    return (
      <span className="rounded-full border border-[hsla(42,42%,46%,0.28)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[hsl(42,72%,78%)]">
        {total} cr
      </span>
    );
  }

  function renderSearch() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.38)] px-3 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(30,12%,52%)]" />
          <input
            value={toolSearch}
            onChange={(event) => setToolSearch(event.target.value)}
            placeholder="Search tools..."
            className="w-full rounded-[14px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] py-2 pl-8 pr-3 text-xs text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]"
          />
        </div>
      </div>
    );
  }

  function renderList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {groupedTools.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">No tools match your search.</p>
        ) : (
          <div className="space-y-3">
            {groupedTools.map((group) => renderGroup(group))}
          </div>
        )}
      </div>
    );
  }

  function renderGroup(group: { id: ToolCategory; label: string; tools: typeof groupedTools[number]['tools'] }) {
    return (
      <div key={group.id}>
        <p className="px-1.5 pb-1 text-[9px] uppercase tracking-[0.2em] text-[hsl(30,12%,52%)]">
          {categoryLabels[group.id]}
        </p>
        <div className="space-y-1">
          {group.tools.map((tool) => renderToolButton(tool))}
        </div>
      </div>
    );
  }

  function renderToolButton(tool: typeof groupedTools[number]['tools'][number]) {
    const isSelected = selectedTool === tool.id;
    const cost = creditCosts?.[tool.creditKey] ?? 0;
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => setSelectedTool(tool.id)}
        className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
        }`}
      >
        {renderToolButtonTop(tool, cost)}
        {renderToolButtonDesc(tool)}
      </button>
    );
  }

  function renderToolButtonTop(tool: typeof groupedTools[number]['tools'][number], cost: number) {
    return (
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <tool.icon className="h-3.5 w-3.5 shrink-0 text-[hsl(42,72%,72%)]" />
          <p className="text-xs text-[hsl(35,24%,90%)]">{tool.label}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[hsla(32,24%,24%,0.38)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[hsl(42,60%,68%)]">
          {cost}cr
        </span>
      </div>
    );
  }

  function renderToolButtonDesc(tool: typeof groupedTools[number]['tools'][number]) {
    return (
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-[hsl(30,12%,52%)]">
        {tool.helper}
      </p>
    );
  }
}
