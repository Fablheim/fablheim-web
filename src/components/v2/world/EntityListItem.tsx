import { ChevronRight } from 'lucide-react';
import type { WorldEntity } from '@/types/campaign';
import { ENTITY_TYPE_CONFIG } from './world-config';
import type { WorldNavigation } from './WorldCenterStage';
import { formatWorldEntityContext } from './world-ui';

interface EntityListItemProps {
  entity: WorldEntity;
  nav: WorldNavigation;
  /** Show parent location name if available */
  showParent?: boolean;
  /** Show relationship type when rendering in a related-entities context */
  relationshipLabel?: string;
  /** Show child count badge */
  childCount?: number;
}

export function EntityListItem({
  entity,
  nav,
  showParent,
  relationshipLabel,
  childCount,
}: EntityListItemProps) {
  const config = ENTITY_TYPE_CONFIG[entity.type];
  const Icon = config.icon;
  const parentName = resolveParentName(entity);

  return (
    <button
      type="button"
      onClick={() => nav.goToDetail(entity._id)}
      className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[hsl(24,20%,15%)]"
    >
      {renderIcon()}
      {renderContent()}
      {renderTrailing()}
    </button>
  );

  function renderIcon() {
    return (
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: `${config.color}15`, color: config.color }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
    );
  }

  function renderContent() {
    return (
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">
          {entity.name}
        </p>
        {renderSubtext()}
      </div>
    );
  }

  function renderSubtext() {
    const parts: string[] = [];
    if (relationshipLabel) parts.push(relationshipLabel.replace(/_/g, ' '));
    parts.push(formatWorldEntityContext(entity));
    if (showParent && parentName) parts.push(`in ${parentName}`);

    return (
      <p className="truncate text-[11px] text-[hsl(30,12%,58%)]">
        {parts.join(' · ')}
      </p>
    );
  }

  function renderTrailing() {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        {childCount != null && childCount > 0 && (
          <span className="text-[10px] text-[hsl(30,12%,58%)]">
            {childCount}
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-[hsl(30,12%,58%)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    );
  }
}

function resolveParentName(entity: WorldEntity): string | null {
  if (!entity.parentEntityId) return null;
  if (typeof entity.parentEntityId === 'object') {
    return entity.parentEntityId.name;
  }
  return null;
}
