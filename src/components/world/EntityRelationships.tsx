import { Link2 } from 'lucide-react';
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
      <div className="divider-ornate mt-5 mb-4" />
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

      {Array.from(groups.entries()).map(([relType, entities]) => (
        <div key={relType} className="mt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {relType}
          </p>
          <div className="flex flex-wrap gap-2">
            {entities.map((linked) => {
              const Icon = TYPE_ICONS[linked.type];
              const accent = TYPE_ACCENTS[linked.type];
              return (
                <button
                  key={linked._id}
                  onClick={() => onViewEntity(linked)}
                  className={`inline-flex items-center gap-1.5 rounded-md ${accent.bg} px-2.5 py-1 text-xs transition-colors hover:ring-1 hover:ring-gold/40 ${accent.text}`}
                >
                  <Icon className="h-3 w-3" />
                  {linked.name}
                  <span className="font-[Cinzel] text-[9px] uppercase tracking-wider opacity-70">
                    {TYPE_LABELS[linked.type]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
