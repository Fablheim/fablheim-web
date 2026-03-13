import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Unplug } from 'lucide-react';
import { useUnassignedEntities } from '@/hooks/useWorldEntities';
import type { WorldEntityType } from '@/types/campaign';
import { ENTITY_TYPE_CONFIG, BROWSABLE_TYPES } from './world-config';
import { EntityListItem } from './EntityListItem';
import type { WorldNavigation } from './WorldCenterStage';

interface WorldUnassignedProps {
  campaignId: string;
  isDM: boolean;
  nav: WorldNavigation;
}

export function WorldUnassigned({ campaignId, nav }: WorldUnassignedProps) {
  const { data: entities, isLoading } = useUnassignedEntities(campaignId);
  const [filterType, setFilterType] = useState<WorldEntityType | null>(null);

  const grouped = useMemo(() => {
    const groups: Partial<Record<WorldEntityType, typeof entities>> = {};
    for (const e of entities ?? []) {
      if (!groups[e.type]) groups[e.type] = [];
      groups[e.type]!.push(e);
    }
    return groups;
  }, [entities]);

  const visibleTypes = useMemo(
    () => BROWSABLE_TYPES.filter((t) => (grouped[t]?.length ?? 0) > 0),
    [grouped],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {renderHeader()}
      {renderFilters()}
      {renderContent()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[hsla(32,26%,26%,0.4)] px-4 py-3">
        <button
          type="button"
          onClick={nav.goBack}
          className="flex h-6 w-6 items-center justify-center rounded text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          aria-label="Back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <Unplug className="h-4 w-4 text-[hsl(38,60%,50%)]" />
        <h2
          className="text-[13px] font-medium text-[hsl(35,24%,92%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Unassigned
        </h2>
        <span className="text-[11px] text-[hsl(30,12%,58%)]">
          {entities?.length ?? 0}
        </span>
        <button
          type="button"
          onClick={() =>
            nav.openCreate({
              defaultType: filterType ?? undefined,
              title: 'Create unassigned world entity',
              subtitle:
                'Start something loose on purpose. It will stay in the world inbox until you place or connect it later.',
            })
          }
          className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-full border border-[hsla(38,60%,52%,0.3)] bg-[hsla(38,70%,46%,0.08)] px-2.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(38,82%,63%)] transition-colors hover:bg-[hsla(38,70%,46%,0.14)]"
        >
          <Plus className="h-3 w-3" />
          Create
        </button>
      </div>
    );
  }

  function renderFilters() {
    if (visibleTypes.length <= 1) return null;
    return (
      <div className="flex shrink-0 gap-1 border-b border-[hsla(32,26%,26%,0.25)] px-4 py-2">
        <FilterChip
          label="All"
          active={filterType === null}
          onClick={() => setFilterType(null)}
        />
        {visibleTypes.map((type) => (
          <FilterChip
            key={type}
            label={ENTITY_TYPE_CONFIG[type].pluralLabel}
            count={grouped[type]?.length}
            active={filterType === type}
            onClick={() => setFilterType(type)}
          />
        ))}
      </div>
    );
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-[hsl(30,14%,40%)]">Loading…</p>
        </div>
      );
    }

    if (!entities?.length) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-[hsl(30,14%,40%)]">
            Everything is assigned!
          </p>
        </div>
      );
    }

    const typesToShow = filterType ? [filterType] : visibleTypes;

    return (
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="mx-auto w-full max-w-[840px] space-y-4">
          {typesToShow.map((type) => {
            const items = grouped[type];
            if (!items?.length) return null;
            const config = ENTITY_TYPE_CONFIG[type];
            return (
              <section key={type}>
                <h4 className="mb-1 px-2 text-[11px] uppercase tracking-[0.06em] text-[hsl(30,12%,58%)]">
                  {config.pluralLabel}
                </h4>
                <div className="space-y-0.5">
                  {items.map((entity) => (
                    <EntityListItem
                      key={entity._id}
                      entity={entity}
                      nav={nav}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[11px] transition-colors ${
        active
          ? 'bg-[hsl(38,92%,50%)]/15 text-[hsl(38,90%,55%)]'
          : 'text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]'
      }`}
    >
      {label}
      {count != null && (
        <span className="ml-1 opacity-60">{count}</span>
      )}
    </button>
  );
}
