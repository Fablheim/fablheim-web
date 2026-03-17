import { Home } from 'lucide-react';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { BROWSABLE_TYPES, ENTITY_TYPE_CONFIG } from './world-config';
import { useWorldExplorerContext } from './useWorldExplorerContext';
import type { WorldEntityType } from '@/types/campaign';

interface WorldRightPanelProps {
  campaignId: string;
}

export function WorldRightPanel({ campaignId }: WorldRightPanelProps) {
  const { navigation } = useWorldExplorerContext();
  const { data: allEntities } = useWorldEntities(campaignId);

  const entities = allEntities ?? [];
  const totalCount = entities.length;

  const countByType = (type: WorldEntityType) =>
    entities.filter((entity) => entity.type === type).length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderTypeList()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
              World Entities
            </p>
            <p className="mt-0.5 font-[Cinzel] text-sm text-[hsl(38,36%,86%)]">
              {totalCount} total
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigation?.goHome()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,62%)] transition hover:text-[hsl(38,24%,88%)]"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
        </div>
      </div>
    );
  }

  function renderTypeList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-1">
          {BROWSABLE_TYPES.map((type) => renderTypeButton(type))}
        </div>
      </div>
    );
  }

  function renderTypeButton(type: WorldEntityType) {
    const config = ENTITY_TYPE_CONFIG[type];
    const Icon = config.icon;
    const count = countByType(type);

    return (
      <button
        key={type}
        type="button"
        onClick={() => navigation?.goToType(type)}
        className="flex w-full items-center gap-2.5 rounded-[14px] border border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] px-2.5 py-2 text-left transition hover:border-[hsla(38,50%,58%,0.3)] hover:bg-[hsla(26,18%,14%,0.72)]"
      >
        <span style={{ color: config.color }}>
          <Icon className="h-4 w-4 shrink-0" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-[hsl(35,22%,86%)]">
          {config.pluralLabel}
        </span>
        <span className="shrink-0 rounded-full border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] px-1.5 py-0.5 text-[10px] text-[hsl(30,12%,60%)]">
          {count}
        </span>
      </button>
    );
  }
}
