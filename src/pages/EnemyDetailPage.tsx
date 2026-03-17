import { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  Trash2,
  BookOpen,
  Swords,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EnemyTemplateFormModal } from '@/components/enemies/EnemyTemplateFormModal';
import {
  useEnemyTemplate,
  useEnemyTemplates,
  useCreateEnemyTemplate,
  useDeleteEnemyTemplate,
} from '@/hooks/useCreatureTemplates';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SYSTEM_LABELS,
  SYSTEM_COLORS,
  SYSTEM_STATS,
} from '@/lib/enemy-constants';
import type { EnemyTemplate } from '@/types/creature-template';

interface NavState {
  filters?: { category?: string; scope?: string };
  search?: string;
  systemFilter?: string;
}

export function EnemyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as NavState | null;

  const { data: template, isLoading, error } = useEnemyTemplate(id);
  const { data: allTemplates } = useEnemyTemplates(navState?.filters);
  const createTemplate = useCreateEnemyTemplate();
  const deleteTemplate = useDeleteEnemyTemplate();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filtered = useMemo(() => {
    if (!allTemplates || !navState) return null;
    return allTemplates.filter((t) => {
      if (navState.search && !t.name.toLowerCase().includes(navState.search.toLowerCase())) return false;
      if (navState.systemFilter && t.system !== navState.systemFilter) return false;
      return true;
    });
  }, [allTemplates, navState]);

  const currentIndex = filtered?.findIndex((t) => t._id === id) ?? -1;
  const prevTemplate = currentIndex > 0 ? filtered![currentIndex - 1] : null;
  const nextTemplate = filtered && currentIndex < filtered.length - 1 ? filtered[currentIndex + 1] : null;

  function navigateTo(t: EnemyTemplate) {
    navigate(`/app/enemies/${t._id}`, { state: navState, replace: true });
  }

  async function handleDuplicate() {
    if (!template) return;
    const { _id, userId, isGlobal, srdSource, createdAt, updatedAt, ...rest } = template;
    try {
      await createTemplate.mutateAsync({
        ...rest,
        name: `${template.name} (Copy)`,
        source: template.source || srdSource,
      });
      toast.success('Duplicated to your library');
    } catch {
      toast.error('Failed to duplicate template');
    }
  }

  function handleDelete() {
    if (!template || template.isGlobal) return;
    setShowDeleteConfirm(true);
  }

  function confirmDelete() {
    if (!template) return;
    deleteTemplate.mutate(template._id, {
      onSuccess: () => {
        toast.success('Template deleted');
        setShowDeleteConfirm(false);
        navigate('/app/enemies');
      },
      onError: () => toast.error('Failed to delete'),
    });
  }

  if (isLoading) {
    return (
      <div className="app-page flex h-full flex-col bg-background">
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="app-page flex h-full flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground font-['IM_Fell_English']">Enemy template not found</p>
          <Button variant="secondary" onClick={() => navigate('/app/enemies')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const isGlobal = !!template.isGlobal;

  return (
    <div className="app-page flex h-full flex-col bg-background">
      {renderTopBar()}
      <div className="flex-1 overflow-auto px-4 py-4 sm:px-6 texture-parchment">
        <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-4 lg:flex-row lg:gap-5">
          {renderLeftColumn()}
          {renderRightColumn()}
        </div>
      </div>
      {renderPrevNext()}

      <EnemyTemplateFormModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        template={template}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Template"
        description="This enemy template will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isPending={deleteTemplate.isPending}
      />
    </div>
  );

  function renderTopBar() {
    return (
      <div className="app-page-header flex items-center justify-between px-4 py-2 sm:px-6 texture-parchment">
        <Button variant="ghost" onClick={() => navigate('/app/enemies')} className="h-8 text-xs">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Library
        </Button>
        <div className="hidden min-w-0 flex-1 px-4 text-center md:block">
          <p className="truncate font-['IM_Fell_English'] text-base text-foreground text-carved">
            {template?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGlobal && (
            <Button
              variant="secondary"
              onClick={handleDuplicate}
              disabled={createTemplate.isPending}
              className="h-8 text-xs"
            >
              <Copy className="mr-1 h-3.5 w-3.5" />
              Duplicate
            </Button>
          )}
          {!isGlobal && (
            <>
              <Button variant="secondary" onClick={() => setShowEditModal(true)} className="h-8 text-xs">
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="h-8 text-xs text-muted-foreground hover:text-blood"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderLeftColumn() {
    const t = template!;
    const stats = SYSTEM_STATS[t.system ?? 'custom'];
    const speedParts: string[] = [`${t.speed?.walk ?? 30} ft`];
    if (t.speed?.fly) speedParts.push(`fly ${t.speed.fly}`);
    if (t.speed?.swim) speedParts.push(`swim ${t.speed.swim}`);
    if (t.speed?.climb) speedParts.push(`climb ${t.speed.climb}`);
    if (t.speed?.burrow) speedParts.push(`burrow ${t.speed.burrow}`);

    return (
      <div className="w-full lg:w-[46%]">
        <div className="app-card tavern-card texture-parchment h-full space-y-4 rounded-lg border border-iron/30 p-4 sm:p-5">
        {/* Identity */}
        <div className="flex items-start gap-3 border-b border-brass/20 pb-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brass/35 text-lg font-bold text-white shadow-warm"
            style={{ backgroundColor: t.tokenColor }}
          >
            {t.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-['IM_Fell_English'] text-2xl font-bold text-foreground text-carved">
              {t.name}
            </h1>
            <p className="text-xs text-muted-foreground capitalize italic">
              {t.size} {CATEGORY_LABELS[t.category]}
            </p>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${CATEGORY_COLORS[t.category]}`}>
            {CATEGORY_LABELS[t.category]}
          </span>
          {t.system && t.system !== 'custom' && (
            <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${SYSTEM_COLORS[t.system] ?? SYSTEM_COLORS.custom}`}>
              {SYSTEM_LABELS[t.system] ?? t.system}
            </span>
          )}
          {t.cr && (
            <span className="rounded-md bg-iron/20 px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
              CR {t.cr}
            </span>
          )}
          {isGlobal && (
            <span className="flex items-center gap-0.5 rounded-md bg-brass/15 px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-brass">
              <BookOpen className="h-2.5 w-2.5" />
              SRD
            </span>
          )}
        </div>

        {/* Combat stats — horizontal */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded border border-iron/30 bg-card/55 px-2 py-2 text-center shadow-inset-warm">
            <p className="font-[Cinzel] text-lg font-bold text-foreground leading-none">{t.ac}</p>
            <p className="font-[Cinzel] text-[8px] uppercase tracking-wider text-muted-foreground">AC</p>
          </div>
          <div className="rounded border border-iron/30 bg-card/55 px-2 py-2 text-center shadow-inset-warm">
            <p className="font-[Cinzel] text-lg font-bold text-foreground leading-none">{t.hp.average}</p>
            <p className="font-[Cinzel] text-[8px] uppercase tracking-wider text-muted-foreground">
              {t.hp.formula ? `HP (${t.hp.formula})` : 'HP'}
            </p>
          </div>
          <div className="rounded border border-iron/30 bg-card/55 px-2 py-2 text-center shadow-inset-warm">
            <p className="font-[Cinzel] text-lg font-bold text-foreground leading-none">{t.speed?.walk ?? 30}</p>
            <p className="font-[Cinzel] text-[8px] uppercase tracking-wider text-muted-foreground">Speed</p>
          </div>
          <div className="rounded border border-iron/30 bg-card/55 px-2 py-2 text-center shadow-inset-warm">
            <p className="font-[Cinzel] text-lg font-bold text-foreground leading-none">
              {(t.initiativeBonus ?? 0) >= 0 ? '+' : ''}{t.initiativeBonus ?? 0}
            </p>
            <p className="font-[Cinzel] text-[8px] uppercase tracking-wider text-muted-foreground">Init</p>
          </div>
        </div>

        {/* Extra speed types */}
        {speedParts.length > 1 && (
          <p className="-mt-1 rounded border border-iron/20 bg-card/35 px-2 py-1 text-[10px] text-muted-foreground">
            Speed: {speedParts.join(', ')}
          </p>
        )}

        {/* Ability scores */}
        {stats && t.abilities && (
          <div>
            <p className="mb-1.5 border-b border-blood/30 pb-0.5 font-['IM_Fell_English'] text-sm text-foreground">
              Ability Scores
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {stats.map((s) => {
                const score = t.abilities![s.key] ?? 10;
                const mod = Math.floor((score - 10) / 2);
                const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                return (
                  <div key={s.key} className="rounded border border-iron/30 bg-card/60 py-1.5 text-center">
                    <p className="font-[Cinzel] text-[8px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="font-[Cinzel] text-base font-bold leading-tight text-foreground">{score}</p>
                    <p className="font-[Cinzel] text-[10px] text-brass">{modStr}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {t.tags.length > 0 && (
          <div className="rounded border border-iron/20 bg-card/35 p-2">
            <p className="mb-1 font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-1">
            {t.tags.map((tag) => (
              <span key={tag} className="rounded bg-accent/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {tag}
              </span>
            ))}
            </div>
          </div>
        )}

        {/* Source */}
        {(t.source || t.srdSource) && (
          <p className="rounded border border-iron/20 bg-card/35 px-2 py-1 text-[10px] text-muted-foreground italic font-['IM_Fell_English']">
            Source: {t.source || t.srdSource}
          </p>
        )}
      </div>
      </div>
    );
  }

  function renderRightColumn() {
    const t = template!;
    const hasAttacks = t.attacks.length > 0;
    const hasTraits = t.traits.length > 0;

    if (!hasAttacks && !hasTraits && !t.notes) {
      return (
        <div className="flex w-full items-center justify-center rounded-lg border border-dashed border-iron/20 bg-card/20 py-16 lg:w-[54%]">
          <p className="text-sm text-muted-foreground font-['IM_Fell_English'] italic">
            No attacks, traits, or notes
          </p>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col gap-3 lg:w-[54%] lg:overflow-y-auto lg:pr-1">
        {hasAttacks && renderAttacks()}
        {hasTraits && renderTraits()}
        {t.notes && renderNotes()}
      </div>
    );
  }

  function renderAttacks() {
    const t = template!;
    return (
      <div className="app-card tavern-card rounded-lg border border-iron/30 p-3 sm:p-4">
        <p className="mb-2 flex items-center gap-1.5 border-b border-blood/30 pb-1 font-['IM_Fell_English'] text-sm text-foreground">
          <Swords className="h-3.5 w-3.5 text-blood/70" />
          Attacks
        </p>
        <div className="space-y-2">
          {t.attacks.map((atk, i) => (
            <div key={i} className="rounded border border-iron/20 bg-card/45 px-3 py-2 shadow-inset-warm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-['IM_Fell_English'] text-sm font-semibold text-foreground">
                  {atk.name}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {atk.bonus >= 0 ? '+' : ''}{atk.bonus} to hit{atk.range ? ` | ${atk.range}` : ''}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{atk.damage}</p>
              {atk.description && (
                <p className="mt-0.5 text-xs text-muted-foreground italic">{atk.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderTraits() {
    const t = template!;
    return (
      <div className="app-card tavern-card rounded-lg border border-iron/30 p-3 sm:p-4">
        <p className="mb-2 border-b border-blood/30 pb-1 font-['IM_Fell_English'] text-sm text-foreground">
          Traits & Abilities
        </p>
        <div className="space-y-2">
          {t.traits.map((trait, i) => (
            <div key={i} className="rounded border border-iron/20 bg-card/45 px-3 py-2 shadow-inset-warm">
              <span className="font-['IM_Fell_English'] text-sm font-semibold text-foreground">
                {trait.name}.
              </span>{' '}
              <span className="text-xs text-muted-foreground">{trait.description}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderNotes() {
    return (
      <div className="app-card tavern-card rounded-lg border border-iron/30 p-3 sm:p-4">
        <p className="mb-2 border-b border-blood/30 pb-1 font-['IM_Fell_English'] text-sm text-foreground">
          Notes
        </p>
        <div className="rounded border border-iron/20 bg-card/45 px-3 py-2 shadow-inset-warm">
          <p className="whitespace-pre-wrap text-xs text-muted-foreground">{template!.notes}</p>
        </div>
      </div>
    );
  }

  function renderPrevNext() {
    if (!filtered || currentIndex < 0) return null;

    return (
      <div className="flex items-center justify-between border-t border-border px-4 py-1.5 sm:px-6 texture-parchment">
        <button
          type="button"
          disabled={!prevTemplate}
          onClick={() => prevTemplate && navigateTo(prevTemplate)}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline max-w-[140px] truncate">{prevTemplate?.name ?? 'Previous'}</span>
        </button>
        <span className="text-[10px] text-muted-foreground">
          {currentIndex + 1} / {filtered.length}
        </span>
        <button
          type="button"
          disabled={!nextTemplate}
          onClick={() => nextTemplate && navigateTo(nextTemplate)}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <span className="hidden sm:inline max-w-[140px] truncate">{nextTemplate?.name ?? 'Next'}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
}
