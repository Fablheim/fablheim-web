import { X, Pencil, Trash2, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSystemDefinition } from '@/hooks/useSystems';
import type { CharacterListItem } from './CharacterCard';
import type { SystemDefinition } from '@/types/system';

interface CharacterDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: CharacterListItem | null;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  campaignSystem?: string;
}

function computeModifier(value: number, formula: string | null): string | null {
  if (!formula) return null;
  if (formula === 'floor((value - 10) / 2)') {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
  return null;
}

export function CharacterDetailModal({ open, onClose, item, canEdit, onEdit, onDelete, campaignSystem }: CharacterDetailModalProps) {
  const { data: systemDef } = useSystemDefinition(campaignSystem ?? 'dnd5e');

  if (!open || !item) return null;

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

        {item.kind === 'pc' ? (
          <PCDetail
            item={item}
            canEdit={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
            systemDef={systemDef}
          />
        ) : (
          <NPCDetail
            item={item}
            canEdit={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}

function PCDetail({
  item,
  canEdit,
  onEdit,
  onDelete,
  systemDef,
}: {
  item: Extract<CharacterListItem, { kind: 'pc' }>;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  systemDef?: SystemDefinition;
}) {
  const char = item.data;
  const classRace = [char.race, char.class].filter(Boolean).join(' ') || 'Adventurer';

  // Build stat label lookup from system definition
  const statLabels: Record<string, string> = {};
  if (systemDef) {
    for (const s of systemDef.stats) statLabels[s.key] = s.abbreviation;
  }

  // Build passive score label lookup from system definition
  const passiveLabels: Record<string, string> = {};
  if (systemDef) {
    for (const p of systemDef.passiveScores) passiveLabels[p.key] = p.label;
  }

  const statKeys = systemDef ? systemDef.stats.map((s) => s.key) : Object.keys(char.stats ?? {});
  const hasPassiveScores = systemDef ? systemDef.passiveScores.length > 0 : !!char.passiveScores;
  const cols = statKeys.length <= 6 ? 6 : statKeys.length <= 9 ? statKeys.length : 6;

  return (
    <>
      {renderHeader()}
      {renderBadges()}
      {renderActions()}
      {renderStats()}
      {renderPassiveScores()}
      {renderBackstory()}
    </>
  );

  function renderHeader() {
    return (
      <div className="flex items-start gap-4 pr-8">
        <div className="flex-1">
          <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground">{char.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{classRace}</p>
        </div>
        {char.level != null && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blood/60 bg-blood/90 font-[Cinzel] text-sm font-bold text-parchment shadow-lg">
            {char.level}
          </div>
        )}
      </div>
    );
  }

  function renderBadges() {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-forest/15 px-2 py-0.5 text-xs text-[hsl(150,50%,55%)]">
          <Shield className="h-3 w-3" />
          Player Character
        </span>
        {item.ownerName && (
          <span className="font-[Cinzel] text-[10px] tracking-wider text-muted-foreground">
            Played by {item.ownerName}
          </span>
        )}
      </div>
    );
  }

  function renderActions() {
    if (!canEdit) return null;
    return (
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
    );
  }

  function renderStats() {
    if (!char.stats || Object.keys(char.stats).length === 0) return null;
    const formula = systemDef?.statModifierFormula ?? null;

    return (
      <>
        <div className="divider-ornate mt-5 mb-4" />
        <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          {systemDef ? 'Stats' : 'Ability Scores'}
        </p>
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {statKeys.map((key) => {
            const val = char.stats?.[key];
            if (val === undefined) return <div key={key} />;
            const mod = computeModifier(val, formula);
            return (
              <div key={key} className="flex flex-col items-center rounded-md bg-background/40 p-2 texture-leather">
                <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                  {statLabels[key] || key.toUpperCase()}
                </span>
                {mod ? (
                  <>
                    <span className="mt-1 text-lg font-bold text-foreground">{mod}</span>
                    <span className="text-xs text-muted-foreground">{val}</span>
                  </>
                ) : (
                  <span className="mt-1 text-lg font-bold text-foreground">{val}</span>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderPassiveScores() {
    if (!hasPassiveScores || !char.passiveScores) return null;
    const entries = systemDef
      ? systemDef.passiveScores.map((p) => [p.label, (char.passiveScores as Record<string, number>)?.[p.key]] as const)
      : Object.entries(char.passiveScores).map(([k, v]) => [k, v] as const);

    return (
      <>
        <div className="divider-ornate mt-5 mb-4" />
        <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Passive Scores
        </p>
        <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(entries.length, 3)}, minmax(0, 1fr))` }}>
          {entries.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between rounded-md bg-background/40 px-3 py-2">
              <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <span className="text-sm font-semibold text-foreground">{val}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderBackstory() {
    if (!char.backstory) return null;
    return (
      <>
        <div className="divider-ornate mt-5 mb-4" />
        <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Backstory
        </p>
        <p className="whitespace-pre-wrap font-['IM_Fell_English'] text-sm italic leading-relaxed text-muted-foreground">
          {char.backstory}
        </p>
      </>
    );
  }
}

function NPCDetail({
  item,
  canEdit,
  onEdit,
  onDelete,
}: {
  item: Extract<CharacterListItem, { kind: 'npc' }>;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const entity = item.data;
  const typeLabel = entity.type === 'npc' ? 'NPC' : 'Minor NPC';
  const isHidden = entity.visibility === 'dm-only';

  return (
    <>
      {/* Header */}
      <div className="pr-8">
        <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground">{entity.name}</h2>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-brass/20 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-brass">
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
    </>
  );
}
