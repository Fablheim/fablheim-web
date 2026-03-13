import { useState, useRef } from 'react';
import { Link2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TYPE_ICONS, TYPE_ACCENTS, TYPE_LABELS } from './world-constants';
import type { WorldEntity } from '@/types/campaign';

interface EntityRelationshipsProps {
  entity: WorldEntity;
  allEntities: WorldEntity[];
  onViewEntity: (entity: WorldEntity) => void;
  canEdit: boolean;
  onLinkEntity: () => void;
}

export function EntityRelationships({
  entity,
  allEntities,
  onViewEntity,
  canEdit,
  onLinkEntity,
}: EntityRelationshipsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (entity.relatedEntities.length === 0 && !canEdit) return null;

  const entityMap = new Map(allEntities.map((e) => [e._id, e]));

  // Group by relationship type
  const groups = new Map<string, WorldEntity[]>();
  for (const rel of entity.relatedEntities) {
    const linked = entityMap.get(rel.entityId);
    if (!linked) continue;
    const existing = groups.get(rel.relationshipType) ?? [];
    existing.push(linked);
    groups.set(rel.relationshipType, existing);
  }

  return (
    <>
      <div className="divider-ornate mb-4 mt-5" />
      <div className="flex items-center justify-between">
        <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Related Entities
        </p>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={onLinkEntity}>
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            Link
          </Button>
        )}
      </div>

      {groups.size === 0 && entity.relatedEntities.length === 0 && (
        <p className="mt-2 text-sm italic text-muted-foreground">No linked entities</p>
      )}

      {/* Two-column layout: relationship type on left, entities on right */}
      <div className="mt-3 space-y-3">
        {Array.from(groups.entries()).map(([relType, entities]) => (
          <div key={relType} className="flex gap-3">
            <div className="w-24 shrink-0 pt-1.5">
              <p className="text-right font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {relType}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                {entities.map((linked) => (
                  <EntityPill
                    key={linked._id}
                    entity={linked}
                    allEntities={allEntities}
                    isHovered={hoveredId === linked._id}
                    onMouseEnter={() => setHoveredId(linked._id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onViewEntity(linked)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Entity Pill with Hover Preview ─────────────────────────

function EntityPill({
  entity,
  allEntities,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  entity: WorldEntity;
  allEntities: WorldEntity[];
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const Icon = TYPE_ICONS[entity.type];
  const accent = TYPE_ACCENTS[entity.type];
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`inline-flex items-center gap-1.5 rounded-md ${accent.bg} px-2.5 py-1 text-xs transition-colors hover:ring-1 hover:ring-gold/40 ${accent.text}`}
      >
        <Icon className="h-3 w-3" />
        {entity.name}
        <span className="font-[Cinzel] text-[9px] uppercase tracking-wider opacity-70">
          {TYPE_LABELS[entity.type]}
        </span>
      </button>

      {/* Hover preview tooltip */}
      {isHovered && (
        <EntityPreviewTooltip entity={entity} allEntities={allEntities} />
      )}
    </div>
  );
}

function EntityPreviewTooltip({
  entity,
  allEntities,
}: {
  entity: WorldEntity;
  allEntities: WorldEntity[];
}) {
  const Icon = TYPE_ICONS[entity.type];
  const accent = TYPE_ACCENTS[entity.type];
  const role = (entity.typeData as Record<string, string>)?.role;

  // Resolve parent location name
  const parentId = entity.parentEntityId
    ? typeof entity.parentEntityId === 'string'
      ? entity.parentEntityId
      : entity.parentEntityId._id
    : null;
  const parentEntity = parentId ? allEntities.find((e) => e._id === parentId) : null;

  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${accent.text}`} />
        <span className="truncate font-[Cinzel] text-sm font-semibold text-card-foreground">
          {entity.name}
        </span>
      </div>
      <span className={`mt-1 inline-block rounded ${accent.bg} px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${accent.text}`}>
        {TYPE_LABELS[entity.type]}
      </span>
      {role && (
        <p className="mt-1 text-xs italic text-muted-foreground">{role}</p>
      )}
      {parentEntity && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Located in {parentEntity.name}
        </p>
      )}
      {entity.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {entity.description}
        </p>
      )}
      <p className="mt-2 flex items-center gap-1 text-[10px] text-brass">
        Click to view
        <ArrowRight className="h-2.5 w-2.5" />
      </p>
    </div>
  );
}
