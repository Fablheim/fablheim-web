import { X, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TYPE_LABELS, TYPE_ACCENTS, TYPE_ICONS, TYPE_DATA_FIELDS } from './world-constants';
import { EntityRelationships } from './EntityRelationships';
import type { WorldEntity } from '@/types/campaign';

interface EntityDetailModalProps {
  open: boolean;
  onClose: () => void;
  entity: WorldEntity | null;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  allEntities: WorldEntity[];
  onViewEntity: (entity: WorldEntity) => void;
  onLinkEntity: () => void;
}

export function EntityDetailModal({
  open,
  onClose,
  entity,
  canEdit,
  onEdit,
  onDelete,
  allEntities,
  onViewEntity,
  onLinkEntity,
}: EntityDetailModalProps) {
  if (!open || !entity) return null;

  const accent = TYPE_ACCENTS[entity.type];
  const TypeIcon = TYPE_ICONS[entity.type];
  const typeLabel = TYPE_LABELS[entity.type];
  const isHidden = entity.visibility === 'dm-only';
  const fields = TYPE_DATA_FIELDS[entity.type] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="pr-8">
          <div className="flex items-center gap-2">
            <TypeIcon className={`h-5 w-5 ${accent.text}`} />
            <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground">{entity.name}</h2>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md ${accent.bg} px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider ${accent.text}`}>
              {typeLabel}
            </span>
            {isHidden ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-arcane/15 px-1.5 py-0.5 text-[10px] text-arcane">
                <EyeOff className="h-3 w-3" />
                GM Only
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-forest/15 px-1.5 py-0.5 text-[10px] text-[hsl(150,50%,55%)]">
                <Eye className="h-3 w-3" />
                Public
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}

        {/* Description */}
        {entity.description && (
          <>
            <div className="divider-ornate mt-5 mb-4" />
            <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              Description
            </p>
            <p className="whitespace-pre-wrap font-['IM_Fell_English'] text-sm italic leading-relaxed text-muted-foreground">
              {entity.description}
            </p>
          </>
        )}

        {/* Type-specific fields */}
        {fields.length > 0 && entity.typeData && Object.keys(entity.typeData).length > 0 && (
          <>
            <div className="divider-ornate mt-5 mb-4" />
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              {typeLabel} Details
            </p>
            <div className="space-y-3">
              {fields.map((field) => {
                const value = entity.typeData?.[field.key];
                if (!value) return null;
                return (
                  <div key={field.key}>
                    <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                      {field.label}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground">{String(value)}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tags */}
        {entity.tags.length > 0 && (
          <>
            <div className="divider-ornate mt-5 mb-4" />
            <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-background/40 px-2.5 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Related Entities */}
        <EntityRelationships
          entity={entity}
          allEntities={allEntities}
          onViewEntity={onViewEntity}
          canEdit={canEdit}
          onLinkEntity={onLinkEntity}
        />
      </div>
    </div>
  );
}
