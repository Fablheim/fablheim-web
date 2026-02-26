import { X, Pencil, Trash2, Eye, EyeOff, MapPin, CheckCircle2, Circle, Target, Clock, CheckCheck, XCircle } from 'lucide-react';
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

        {/* Location parent breadcrumb */}
        {entity.parentEntityId && typeof entity.parentEntityId === 'object' && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-[Cinzel] uppercase tracking-wider">Located in:</span>
            <button
              onClick={() => {
                const parent = allEntities.find((e) => e._id === (entity.parentEntityId as any)._id);
                if (parent) onViewEntity(parent);
              }}
              className="text-brass hover:underline"
            >
              {(entity.parentEntityId as any).name}
            </button>
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

        {/* Quest details */}
        {entity.type === 'quest' && (
          <>
            <div className="divider-ornate mt-5 mb-4" />
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
              Quest Details
            </p>
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Status:</span>
                {(() => {
                  const s = entity.questStatus ?? 'available';
                  const config: Record<string, { icon: typeof Target; color: string; bg: string; label: string }> = {
                    available: { icon: Target, color: 'text-gold', bg: 'bg-gold/20', label: 'Available' },
                    in_progress: { icon: Clock, color: 'text-brass', bg: 'bg-brass/20', label: 'In Progress' },
                    completed: { icon: CheckCheck, color: 'text-[hsl(150,50%,55%)]', bg: 'bg-forest/20', label: 'Completed' },
                    failed: { icon: XCircle, color: 'text-blood', bg: 'bg-blood/20', label: 'Failed' },
                  };
                  const c = config[s] ?? config.available;
                  const Icon = c.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-md ${c.bg} px-2 py-0.5 text-xs ${c.color}`}>
                      <Icon className="h-3 w-3" />
                      {c.label}
                    </span>
                  );
                })()}
              </div>

              {/* Quest giver */}
              {entity.questGiver && (
                <div>
                  <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Quest Giver: </span>
                  {typeof entity.questGiver === 'object' ? (
                    <button
                      onClick={() => {
                        const npc = allEntities.find((e) => e._id === (entity.questGiver as any)._id);
                        if (npc) onViewEntity(npc);
                      }}
                      className="text-sm text-brass hover:underline"
                    >
                      {entity.questGiver.name}
                    </button>
                  ) : (
                    <span className="text-sm text-foreground">{entity.questGiver}</span>
                  )}
                </div>
              )}

              {/* Rewards */}
              {entity.rewards && (
                <div>
                  <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Rewards: </span>
                  <span className="text-sm text-foreground">{entity.rewards}</span>
                </div>
              )}

              {/* Objectives */}
              {entity.objectives && entity.objectives.length > 0 && (
                <div>
                  <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                    Objectives ({entity.objectives.filter((o) => o.completed).length}/{entity.objectives.length})
                  </p>
                  <ul className="space-y-1">
                    {entity.objectives.map((obj) => (
                      <li key={obj.id} className="flex items-center gap-2 text-sm">
                        {obj.completed ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(150,50%,55%)]" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={obj.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}>
                          {obj.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {/* Location children */}
        {(entity.type === 'location' || entity.type === 'location_detail') && (() => {
          const children = allEntities.filter(
            (e) =>
              (typeof e.parentEntityId === 'string' && e.parentEntityId === entity._id) ||
              (typeof e.parentEntityId === 'object' && e.parentEntityId?._id === entity._id),
          );
          if (children.length === 0) return null;
          return (
            <>
              <div className="divider-ornate mt-5 mb-4" />
              <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
                Sub-locations ({children.length})
              </p>
              <div className="space-y-1.5">
                {children.map((child) => (
                  <button
                    key={child._id}
                    onClick={() => onViewEntity(child)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50 transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[hsl(150,50%,55%)]" />
                    <span className="text-foreground">{child.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {TYPE_LABELS[child.type]}
                    </span>
                  </button>
                ))}
              </div>
            </>
          );
        })()}

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
