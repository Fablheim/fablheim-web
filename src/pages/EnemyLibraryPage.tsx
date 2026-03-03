import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Trash2, Search, Skull, BookOpen, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EnemyTemplateFormModal } from '@/components/enemies/EnemyTemplateFormModal';
import { useEnemyTemplates, useDeleteEnemyTemplate } from '@/hooks/useEnemyTemplates';
import {
  CATEGORY_LABELS,
  SYSTEM_LABELS,
  SCOPE_OPTIONS,
} from '@/lib/enemy-constants';
import type { EnemyTemplate, EnemyCategory } from '@/types/enemy-template';

const READABLE_CATEGORY_COLORS: Record<EnemyCategory, string> = {
  humanoid: 'bg-brass/22 text-[hsl(40,88%,74%)] border border-brass/35',
  beast: 'bg-forest/30 text-[hsl(145,55%,78%)] border border-forest/45',
  undead: 'bg-[hsl(270,28%,26%)] text-[hsl(270,62%,84%)] border border-[hsl(270,35%,45%)]',
  dragon: 'bg-blood/28 text-[hsl(0,85%,82%)] border border-blood/45',
  aberration: 'bg-[hsl(300,24%,24%)] text-[hsl(300,62%,82%)] border border-[hsl(300,35%,44%)]',
  construct: 'bg-iron/35 text-[hsl(32,24%,84%)] border border-iron/50',
  elemental: 'bg-[hsl(200,36%,24%)] text-[hsl(198,70%,84%)] border border-[hsl(200,44%,42%)]',
  fey: 'bg-[hsl(140,28%,24%)] text-[hsl(138,68%,84%)] border border-[hsl(140,36%,40%)]',
  fiend: 'bg-[hsl(0,42%,24%)] text-[hsl(0,88%,82%)] border border-[hsl(0,56%,44%)]',
  giant: 'bg-[hsl(40,30%,24%)] text-[hsl(42,80%,82%)] border border-[hsl(40,38%,44%)]',
  monstrosity: 'bg-primary/25 text-[hsl(41,90%,84%)] border border-primary/45',
  ooze: 'bg-[hsl(120,30%,22%)] text-[hsl(118,66%,82%)] border border-[hsl(120,38%,38%)]',
  plant: 'bg-[hsl(100,30%,22%)] text-[hsl(100,62%,82%)] border border-[hsl(100,38%,38%)]',
  custom: 'bg-muted/60 text-foreground border border-border',
};

const READABLE_SYSTEM_COLORS: Record<string, string> = {
  dnd5e: 'bg-blood/28 text-[hsl(0,85%,82%)] border border-blood/45',
  pathfinder2e: 'bg-[hsl(200,36%,24%)] text-[hsl(198,70%,84%)] border border-[hsl(200,44%,42%)]',
  daggerheart: 'bg-primary/25 text-[hsl(41,90%,84%)] border border-primary/45',
  fate: 'bg-[hsl(270,28%,26%)] text-[hsl(270,62%,84%)] border border-[hsl(270,35%,45%)]',
  custom: 'bg-iron/30 text-[hsl(32,24%,84%)] border border-iron/45',
};

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 900 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function getGridColumns(width: number) {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function getGridRows(height: number) {
  if (height < 820) return 2;
  if (height < 1040) return 3;
  return 4;
}

function formatAttackName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return name;
  return trimmed.replace(/^[a-z]/, (letter) => letter.toUpperCase());
}

export function EnemyLibraryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewport, setViewport] = useState(getViewportSize);

  const filters: { category?: string; scope?: string } = {};
  if (categoryFilter) filters.category = categoryFilter;
  if (scopeFilter !== 'all') filters.scope = scopeFilter;
  const { data: templates, isLoading } = useEnemyTemplates(filters);
  const deleteTemplate = useDeleteEnemyTemplate();

  const filtered = useMemo(() => {
    return templates?.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (systemFilter && t.system !== systemFilter) return false;
      return true;
    });
  }, [templates, search, systemFilter]);

  useEffect(() => {
    function onResize() {
      setViewport(getViewportSize());
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const pageSize = useMemo(() => {
    const columns = getGridColumns(viewport.width);
    const rows = getGridRows(viewport.height);
    return columns * rows;
  }, [viewport.height, viewport.width]);

  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filtered?.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleCardClick(template: EnemyTemplate) {
    navigate(`/app/enemies/${template._id}`, {
      state: { filters, search, systemFilter },
    });
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeleteConfirmId(id);
  }

  function confirmDelete() {
    if (!deleteConfirmId) return;
    deleteTemplate.mutate(deleteConfirmId, {
      onSuccess: () => { toast.success('Template deleted'); setDeleteConfirmId(null); },
      onError: () => toast.error('Failed to delete'),
    });
  }

  function handleCloseModal() {
    setShowModal(false);
  }

  return (
    <div className="app-page flex h-full flex-col bg-background">
      {renderHeader()}
      <div className="flex flex-1 flex-col overflow-hidden px-6 py-3 texture-parchment">
        {renderFilters()}
        {renderContent()}
      </div>
      {renderFooter()}

      <EnemyTemplateFormModal
        open={showModal}
        onClose={handleCloseModal}
      />
      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Delete Template"
        description="This enemy template will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
        isPending={deleteTemplate.isPending}
      />
    </div>
  );

  function renderHeader() {
    return (
      <div className="app-page-header flex items-center justify-between px-6 py-4 texture-parchment">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-['IM_Fell_English'] tracking-wide text-carved">
            Enemy Library
          </h1>
          <p className="mt-0.5 text-base text-muted-foreground font-['IM_Fell_English']">
            Reusable enemy templates for your encounters
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Template
        </Button>
      </div>
    );
  }

  function renderFilters() {
    return (
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {renderScopeToggle()}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search enemies..."
            className="w-full rounded-sm border border-input bg-input pl-8 pr-3 py-2 text-base text-foreground placeholder:text-muted-foreground input-carved"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground input-carved font-[Cinzel] uppercase tracking-wider"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={systemFilter}
          onChange={(e) => { setSystemFilter(e.target.value); setPage(1); }}
          className="rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground input-carved font-[Cinzel] uppercase tracking-wider"
        >
          <option value="">All Systems</option>
          {Object.entries(SYSTEM_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
    );
  }

  function renderScopeToggle() {
    return (
      <div className="flex overflow-hidden rounded-sm border border-input shadow-inset-warm">
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setScopeFilter(opt.value); setPage(1); }}
            className={`px-3 py-2 text-sm font-[Cinzel] uppercase tracking-wider transition-colors ${
              scopeFilter === opt.value
                ? 'bg-primary/24 text-[hsl(42,95%,82%)] border-primary/30'
                : 'bg-input text-foreground/80 hover:text-foreground hover:bg-accent/45'
            } ${opt.value !== 'all' ? 'border-l border-input' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!filtered || filtered.length === 0) {
      return renderEmptyState();
    }

    return renderGrid();
  }

  function renderEmptyState() {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Skull className="h-6 w-6 text-primary/60" />
          </div>
          <h3 className="font-['IM_Fell_English'] text-xl text-foreground">
            {search || categoryFilter || systemFilter ? 'No matching enemies' : 'No enemy templates yet'}
          </h3>
          <p className="mt-1 text-base text-muted-foreground font-['IM_Fell_English'] italic">
            {search || categoryFilter || systemFilter
              ? 'Try adjusting your search or filters'
              : 'Create your first enemy template to build a reusable bestiary'}
          </p>
        </div>
      </div>
    );
  }

  function renderGrid() {
    return (
      <div className="grid content-start grid-cols-1 auto-rows-max gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedItems!.map((template) => (
          <div
            key={template._id}
            className="group mkt-card mkt-card-mounted relative flex cursor-pointer flex-col rounded-xl px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-gold/70 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
            onClick={() => handleCardClick(template)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(template);
              }
            }}
          >
            {renderCardContent(template)}
          </div>
        ))}
      </div>
    );
  }

  function renderFooter() {
    if (!filtered || filtered.length === 0 || totalPages <= 1) {
      if (filtered && filtered.length > 0) {
        return (
          <div className="flex items-center justify-center border-t border-border px-6 py-1.5 texture-parchment">
            <span className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'enemy' : 'enemies'}
            </span>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="flex items-center justify-center gap-1.5 border-t border-border px-6 py-1.5 texture-parchment">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => setPage(safePage - 1)}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {pageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p as number)}
              className={`min-w-[28px] rounded px-1.5 py-0.5 font-[Cinzel] text-xs transition-colors ${
                safePage === p
                  ? 'bg-primary/24 text-[hsl(42,95%,82%)]'
                  : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => setPage(safePage + 1)}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <span className="ml-2 text-xs text-muted-foreground">
          {filtered!.length} {filtered!.length === 1 ? 'enemy' : 'enemies'}
        </span>
      </div>
    );
  }

  function pageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (safePage > 3) pages.push('...');
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  function renderCardContent(template: EnemyTemplate) {
    const isGlobal = !!template.isGlobal;
    const attackPreview = template.attacks
      .slice(0, 2)
      .map((a) => formatAttackName(a.name))
      .join(' • ');

    return (
      <>
        <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-brass/55 to-transparent" />

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brass/35 bg-black/20 text-[8px] font-bold text-white shadow-inset-warm"
              style={{ backgroundColor: template.tokenColor }}
            >
              {template.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="truncate font-['IM_Fell_English'] text-lg font-semibold text-[color:var(--mkt-text)] text-carved">
              {template.name}
            </h3>
            {isGlobal && (
              <span className="flex shrink-0 items-center gap-0.5 rounded-md border border-brass/35 bg-brass/22 px-1.5 py-0.5 text-xs font-[Cinzel] uppercase tracking-wider text-[color:var(--mkt-accent)]">
                <BookOpen className="h-2 w-2" />
                SRD
              </span>
            )}
          </div>
          {!isGlobal && (
            <button
              type="button"
              onClick={(e) => handleDelete(e, template._id)}
              className="rounded p-0.5 text-[color:var(--mkt-muted)] opacity-0 transition-all hover:bg-blood/10 hover:text-blood group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[11px] uppercase tracking-wider ${READABLE_CATEGORY_COLORS[template.category]}`}>
            {CATEGORY_LABELS[template.category]}
          </span>
          {template.system && template.system !== 'custom' && (
            <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[11px] uppercase tracking-wider ${READABLE_SYSTEM_COLORS[template.system] ?? READABLE_SYSTEM_COLORS.custom}`}>
              {SYSTEM_LABELS[template.system] ?? template.system}
            </span>
          )}
        </div>

        <div className="mt-1.5 grid grid-cols-4 gap-1">
          <div className="rounded border border-[color:var(--mkt-border)]/70 bg-black/20 px-1 py-1 text-center">
            <p className="font-[Cinzel] text-base font-semibold leading-none text-[color:var(--mkt-text)]">
              {template.hp.average}
            </p>
            <p className="mt-0.5 font-[Cinzel] text-[11px] uppercase tracking-wide text-[color:var(--mkt-muted)]">HP</p>
          </div>
          <div className="rounded border border-[color:var(--mkt-border)]/70 bg-black/20 px-1 py-1 text-center">
            <p className="font-[Cinzel] text-base font-semibold leading-none text-[color:var(--mkt-text)]">
              {template.ac}
            </p>
            <p className="mt-0.5 font-[Cinzel] text-[11px] uppercase tracking-wide text-[color:var(--mkt-muted)]">AC</p>
          </div>
          <div className="rounded border border-[color:var(--mkt-border)]/70 bg-black/20 px-1 py-1 text-center">
            <p className="font-[Cinzel] text-base font-semibold leading-none text-[color:var(--mkt-text)]">
              {template.initiativeBonus != null
                ? `${template.initiativeBonus >= 0 ? '+' : ''}${template.initiativeBonus}`
                : '0'}
            </p>
            <p className="mt-0.5 font-[Cinzel] text-[11px] uppercase tracking-wide text-[color:var(--mkt-muted)]">Init</p>
          </div>
          <div className="rounded border border-[color:var(--mkt-border)]/70 bg-black/20 px-1 py-1 text-center">
            <p className="font-[Cinzel] text-base font-semibold leading-none text-[color:var(--mkt-text)]">
              {template.cr || '-'}
            </p>
            <p className="mt-0.5 font-[Cinzel] text-[11px] uppercase tracking-wide text-[color:var(--mkt-muted)]">CR</p>
          </div>
        </div>

        {template.attacks.length > 0 && (
          <div className="mt-1 rounded border border-[color:var(--mkt-border)]/60 bg-black/15 px-1.5 py-1 text-sm text-[color:var(--mkt-muted)] truncate">
            {attackPreview}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm text-[color:var(--mkt-muted)] capitalize">
            {template.size}
          </div>
          <div className="inline-flex items-center gap-1 rounded-md border border-brass/30 bg-brass/12 px-1.5 py-0.5 text-xs font-[Cinzel] uppercase tracking-wide text-[color:var(--mkt-accent)] transition-all group-hover:border-brass/60 group-hover:bg-brass/24 group-hover:text-[hsl(42,95%,86%)]">
            Details
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </>
    );
  }
}
