import { ArrowRight } from 'lucide-react';
import type { WorldEntity } from '@/types/campaign';
import { TYPE_ACCENTS, TYPE_LABELS, TYPE_ICONS } from './world-constants';

interface EntityRowProps {
  entity: WorldEntity;
  onClick: () => void;
}

/** Compact row for NPCs and other entity types. */
export function EntityRow({ entity, onClick }: EntityRowProps) {
  const accent = TYPE_ACCENTS[entity.type];
  const Icon = TYPE_ICONS[entity.type];
  const role = (entity.typeData as Record<string, string>)?.role;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent/50"
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${accent.text}`} />
      <span className="min-w-0 flex-1 truncate font-[Cinzel] text-sm text-card-foreground">
        {entity.name}
      </span>
      {role && (
        <span className="shrink-0 text-xs italic text-muted-foreground">
          {role}
        </span>
      )}
      <span className={`shrink-0 rounded ${accent.bg} px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${accent.text}`}>
        {TYPE_LABELS[entity.type]}
      </span>
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brass" />
    </button>
  );
}
