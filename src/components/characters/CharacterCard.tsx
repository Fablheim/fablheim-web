import { Pencil, Trash2, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import type { Character, WorldEntity } from '@/types/campaign';

export type CharacterListItem =
  | { kind: 'pc'; data: Character; ownerName?: string }
  | { kind: 'npc'; data: WorldEntity };

interface CharacterCardProps {
  item: CharacterListItem;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function CharacterCard({ item, canEdit, onEdit, onDelete, onClick }: CharacterCardProps) {
  if (item.kind === 'pc') {
    return (
      <PCCard
        character={item.data}
        ownerName={item.ownerName}
        canEdit={canEdit}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
      />
    );
  }

  return (
    <NPCCard
      entity={item.data}
      canEdit={canEdit}
      onEdit={onEdit}
      onDelete={onDelete}
      onClick={onClick}
    />
  );
}

function PCCard({
  character,
  ownerName,
  canEdit,
  onEdit,
  onDelete,
  onClick,
}: {
  character: Character;
  ownerName?: string;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const classRace = [character.race, character.class].filter(Boolean).join(' ') || 'Adventurer';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group mkt-card mkt-card-mounted relative cursor-pointer rounded-lg border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
    >
      {/* Level badge — only shown for systems with levels */}
      {character.level != null && (
        <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-blood/60 bg-blood/90 font-[Cinzel] text-xs font-bold text-parchment shadow-lg">
          {character.level}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between pr-8">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-[Cinzel] font-semibold text-card-foreground">
            {character.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{classRace}</p>
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

      {/* Stats preview — iterates whatever stats the character has */}
      {character.stats && Object.keys(character.stats).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(character.stats).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center rounded bg-background/40 px-1.5 py-1">
              <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">{key}</span>
              <span className="text-xs font-medium text-foreground">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-md bg-forest/15 px-2 py-0.5 text-xs text-[hsl(150,50%,55%)]">
          <Shield className="h-3 w-3" />
          Player Character
        </span>
        <div className="inline-flex items-center gap-1 rounded-md border border-brass/30 bg-brass/12 px-1.5 py-0.5 text-[10px] font-[Cinzel] uppercase tracking-wide text-[color:var(--mkt-accent)] transition-all group-hover:border-brass/60 group-hover:bg-brass/24">
          Details
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
      {ownerName && (
        <p className="mt-1 text-right font-[Cinzel] text-[10px] tracking-wider text-muted-foreground">{ownerName}</p>
      )}
    </div>
  );
}

function NPCCard({
  entity,
  canEdit,
  onEdit,
  onDelete,
  onClick,
}: {
  entity: WorldEntity;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const typeLabel = entity.type === 'npc' ? 'NPC' : 'Minor NPC';
  const isHidden = entity.visibility === 'dm-only';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group mkt-card mkt-card-mounted cursor-pointer rounded-lg border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-[Cinzel] font-semibold text-card-foreground">
            {entity.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-brass/20 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-brass">
              {typeLabel}
            </span>
            {isHidden && (
              <span className="inline-flex items-center gap-1 rounded-md bg-arcane/15 px-1.5 py-0.5 text-[10px] text-arcane">
                <EyeOff className="h-3 w-3" />
                GM Only
              </span>
            )}
            {!isHidden && (
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

      <div className="mt-3 flex justify-end">
        <span className="inline-flex items-center gap-1 rounded-md border border-brass/30 bg-brass/12 px-1.5 py-0.5 text-[10px] font-[Cinzel] uppercase tracking-wide text-[color:var(--mkt-accent)] transition-all group-hover:border-brass/60 group-hover:bg-brass/24">
          Details
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}
