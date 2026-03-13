import { ArrowLeft, Plus } from 'lucide-react';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { WorldEntityType } from '@/types/campaign';
import { ENTITY_TYPE_CONFIG } from './world-config';
import { EntityListItem } from './EntityListItem';
import type { WorldNavigation } from './WorldCenterStage';

interface WorldTypeRosterProps {
  campaignId: string;
  isDM: boolean;
  entityType: WorldEntityType;
  nav: WorldNavigation;
}

export function WorldTypeRoster({
  campaignId,
  entityType,
  nav,
}: WorldTypeRosterProps) {
  const config = ENTITY_TYPE_CONFIG[entityType];
  const { data: entities, isLoading } = useWorldEntities(campaignId, entityType);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {renderHeader()}
      {renderContent()}
    </div>
  );

  function renderHeader() {
    const Icon = config.icon;
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
        <div
          className="flex h-7 w-7 items-center justify-center rounded"
          style={{ backgroundColor: `${config.color}15`, color: config.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2
          className="text-[13px] font-medium text-[hsl(35,24%,92%)]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {config.pluralLabel}
        </h2>
        {entities && (
          <span className="text-[11px] text-[hsl(30,12%,58%)]">
            {entities.length}
          </span>
        )}
        <button
          type="button"
          onClick={() =>
            nav.openCreate({
              defaultType: entityType,
              title: `Create ${config.label.toLowerCase()}`,
              subtitle: `Start a new ${config.label.toLowerCase()} from this roster. Add placement or a first connection only if it helps right now.`,
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
            No {config.pluralLabel.toLowerCase()} yet
          </p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="mx-auto w-full max-w-[840px] space-y-0.5">
          {entities.map((entity) => (
            <EntityListItem
              key={entity._id}
              entity={entity}
              nav={nav}
              showParent
            />
          ))}
        </div>
      </div>
    );
  }
}
