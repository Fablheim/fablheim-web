import { Pencil, Trash2, Eye, EyeOff, MapPin, CheckCircle2 } from 'lucide-react';
import type { WorldEntity } from '@/types/campaign';
import { TYPE_ACCENTS, TYPE_LABELS, TYPE_ICONS } from './world-constants';

interface EntityCardProps {
  entity: WorldEntity;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function EntityCard({ entity, canEdit, onEdit, onDelete, onClick }: EntityCardProps) {
  const accent = TYPE_ACCENTS[entity.type];
  const TypeIcon = TYPE_ICONS[entity.type];
  const typeLabel = TYPE_LABELS[entity.type];
  const isHidden = entity.visibility === 'dm-only';

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-lg border border-border border-l-4 ${accent.border} bg-card p-5 tavern-card texture-leather transition-all duration-200 hover:border-gold hover:shadow-glow hover-lift`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeIcon className={`h-4 w-4 shrink-0 ${accent.text}`} />
            <h3 className="truncate font-[Cinzel] font-semibold text-card-foreground">
              {entity.name}
            </h3>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
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
        {canEdit && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-glow-sm"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-glow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Location parent breadcrumb */}
      {entity.parentEntityId && typeof entity.parentEntityId === 'object' && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{entity.parentEntityId.name}</span>
        </div>
      )}

      {/* Quest status + progress */}
      {entity.type === 'quest' && entity.questStatus && (
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${
            entity.questStatus === 'completed' ? 'bg-forest/20 text-[hsl(150,50%,55%)]' :
            entity.questStatus === 'in_progress' ? 'bg-brass/20 text-brass' :
            entity.questStatus === 'failed' ? 'bg-blood/20 text-blood' :
            'bg-gold/20 text-gold'
          }`}>
            {entity.questStatus === 'completed' && <CheckCircle2 className="h-3 w-3" />}
            {entity.questStatus.replace('_', ' ')}
          </span>
          {entity.objectives && entity.objectives.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {entity.objectives.filter((o) => o.completed).length}/{entity.objectives.length} objectives
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {entity.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {entity.description}
        </p>
      )}

      {/* Tags */}
      {entity.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entity.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded bg-background/40 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {entity.tags.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{entity.tags.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
