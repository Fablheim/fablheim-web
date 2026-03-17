import { CheckCircle2, Lock, Search, Sparkles, XCircle } from 'lucide-react';
import { useModulesContext } from './ModulesContext';
import type { BrowserFilter, DerivedStatus } from './ModulesContext';

export function ModulesRightPanel() {
  const {
    search,
    setSearch,
    filter,
    setFilter,
    librarySections,
    customModules,
    effectiveSelectedNode,
    setSelectedNode,
  } = useModulesContext();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderSearchFilter()}
      {renderList()}
    </div>
  );

  function renderSearchFilter() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(30,12%,52%)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search modules, tags..."
            className="w-full rounded-[14px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] py-2 pl-8 pr-3 text-xs text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]"
          />
        </div>
        {renderFilterPills()}
      </div>
    );
  }

  function renderFilterPills() {
    const filters: Array<{ value: BrowserFilter; label: string }> = [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'available', label: 'Available' },
      { value: 'blocked', label: 'Blocked' },
    ];
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] transition ${
              filter === f.value
                ? 'border-[hsla(42,62%,56%,0.44)] bg-[hsla(40,48%,22%,0.32)] text-[hsl(42,76%,84%)]'
                : 'border-[hsla(32,24%,22%,0.68)] text-[hsl(30,12%,58%)] hover:border-[hsla(42,42%,46%,0.38)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    );
  }

  function renderList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {librarySections.length === 0 && !customModules?.length ? (
          <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">No modules match your search.</p>
        ) : (
          <div className="space-y-3">
            {librarySections.map((section) => renderSection(section))}
            {customModules?.length ? renderCustomSection() : null}
          </div>
        )}
      </div>
    );
  }

  function renderSection(section: typeof librarySections[number]) {
    return (
      <div key={section.id}>
        <p className="px-1.5 pb-1 text-[9px] uppercase tracking-[0.2em] text-[hsl(30,12%,52%)]">
          {section.label}
        </p>
        <div className="space-y-1">
          {section.items.map(({ module, status }) => renderModuleButton(module.id, 'module', module.name, status.kind, module.description))}
        </div>
      </div>
    );
  }

  function renderCustomSection() {
    return (
      <div>
        <p className="px-1.5 pb-1 text-[9px] uppercase tracking-[0.2em] text-[hsl(30,12%,52%)]">
          Campaign Add-ons
        </p>
        <div className="space-y-1">
          {(customModules ?? []).map((module) =>
            renderModuleButton(module._id, 'custom', module.name, null, module.description || 'Custom campaign module'),
          )}
        </div>
      </div>
    );
  }

  function renderModuleButton(id: string, kind: 'module' | 'custom', name: string, status: DerivedStatus | null, description: string) {
    const isSelected =
      effectiveSelectedNode?.kind === kind && effectiveSelectedNode.id === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setSelectedNode({ kind, id })}
        className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
        }`}
      >
        {renderModuleButtonTop(name, status)}
        {renderModuleButtonDesc(description)}
      </button>
    );
  }

  function renderModuleButtonTop(name: string, status: DerivedStatus | null) {
    return (
      <div className="flex items-start justify-between gap-1.5">
        <p className="truncate text-xs text-[hsl(35,24%,90%)]">{name}</p>
        {status ? <StatusIcon status={status} /> : null}
      </div>
    );
  }

  function renderModuleButtonDesc(description: string) {
    return (
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-[hsl(30,12%,52%)]">
        {description}
      </p>
    );
  }
}

function StatusIcon({ status }: { status: DerivedStatus }) {
  const map = {
    active: { Icon: CheckCircle2, className: 'text-emerald-400' },
    required: { Icon: Lock, className: 'text-amber-400' },
    available: { Icon: Sparkles, className: 'text-sky-400' },
    blocked: { Icon: XCircle, className: 'text-rose-400' },
  } as const;
  const entry = map[status];
  const Icon = entry.Icon;
  return <Icon className={`h-3 w-3 shrink-0 ${entry.className}`} />;
}
