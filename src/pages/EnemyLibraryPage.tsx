import { useState } from 'react';
import { Plus, Loader2, Trash2, Search, Skull, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { EnemyTemplateFormModal } from '@/components/enemies/EnemyTemplateFormModal';
import { useEnemyTemplates, useDeleteEnemyTemplate } from '@/hooks/useEnemyTemplates';
import type { EnemyTemplate, EnemyCategory } from '@/types/enemy-template';

const CATEGORY_LABELS: Record<EnemyCategory, string> = {
  humanoid: 'Humanoid',
  beast: 'Beast',
  undead: 'Undead',
  dragon: 'Dragon',
  aberration: 'Aberration',
  construct: 'Construct',
  elemental: 'Elemental',
  fey: 'Fey',
  fiend: 'Fiend',
  giant: 'Giant',
  monstrosity: 'Monstrosity',
  ooze: 'Ooze',
  plant: 'Plant',
  custom: 'Custom',
};

const SYSTEM_LABELS: Record<string, string> = {
  dnd5e: 'D&D 5e',
  pathfinder2e: 'PF2e',
  daggerheart: 'Daggerheart',
  fate: 'Fate',
  custom: 'Custom',
};

const SYSTEM_COLORS: Record<string, string> = {
  dnd5e: 'bg-blood/20 text-blood',
  pathfinder2e: 'bg-[hsl(200,40%,20%)] text-[hsl(200,50%,65%)]',
  daggerheart: 'bg-primary/15 text-primary',
  fate: 'bg-[hsl(270,30%,20%)] text-[hsl(270,40%,70%)]',
  custom: 'bg-iron/20 text-muted-foreground',
};

const CATEGORY_COLORS: Record<EnemyCategory, string> = {
  humanoid: 'bg-brass/20 text-brass',
  beast: 'bg-forest/20 text-[hsl(150,50%,55%)]',
  undead: 'bg-[hsl(270,30%,20%)] text-[hsl(270,40%,70%)]',
  dragon: 'bg-blood/20 text-blood',
  aberration: 'bg-[hsl(300,30%,20%)] text-[hsl(300,40%,65%)]',
  construct: 'bg-iron/30 text-muted-foreground',
  elemental: 'bg-[hsl(200,40%,20%)] text-[hsl(200,50%,65%)]',
  fey: 'bg-[hsl(140,30%,20%)] text-[hsl(140,50%,65%)]',
  fiend: 'bg-blood/30 text-[hsl(0,60%,55%)]',
  giant: 'bg-brass/15 text-brass',
  monstrosity: 'bg-primary/15 text-primary',
  ooze: 'bg-forest/15 text-[hsl(120,40%,55%)]',
  plant: 'bg-forest/20 text-[hsl(100,50%,55%)]',
  custom: 'bg-muted text-muted-foreground',
};

export function EnemyLibraryPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EnemyTemplate | null>(null);

  const filters = categoryFilter ? { category: categoryFilter } : undefined;
  const { data: templates, isLoading } = useEnemyTemplates(filters);
  const deleteTemplate = useDeleteEnemyTemplate();

  const filtered = templates?.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (systemFilter && t.system !== systemFilter) return false;
    return true;
  });

  function handleEdit(template: EnemyTemplate) {
    setEditingTemplate(template);
    setShowModal(true);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('Delete this enemy template?')) return;
    deleteTemplate.mutate(id, {
      onSuccess: () => toast.success('Template deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingTemplate(null);
  }

  return (
    <PageContainer
      title="Enemy Library"
      subtitle="Reusable enemy templates for your encounters"
      actions={
        <Button onClick={() => { setEditingTemplate(null); setShowModal(true); }}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Template
        </Button>
      }
    >
      {renderFilters()}
      {renderContent()}

      <EnemyTemplateFormModal
        open={showModal}
        onClose={handleCloseModal}
        template={editingTemplate}
      />
    </PageContainer>
  );

  function renderFilters() {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search enemies..."
            className="w-full rounded-sm border border-input bg-input pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground input-carved font-[Cinzel] text-xs uppercase tracking-wider"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={systemFilter}
          onChange={(e) => setSystemFilter(e.target.value)}
          className="rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground input-carved font-[Cinzel] text-xs uppercase tracking-wider"
        >
          <option value="">All Systems</option>
          {Object.entries(SYSTEM_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
    );
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
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
      <div className="rounded-lg border-2 border-dashed border-gold/20 bg-card/20 p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Skull className="h-6 w-6 text-primary/60" />
        </div>
        <h3 className="font-['IM_Fell_English'] text-lg text-foreground">
          {search || categoryFilter || systemFilter ? 'No matching enemies' : 'No enemy templates yet'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground font-['IM_Fell_English'] italic">
          {search || categoryFilter || systemFilter
            ? 'Try adjusting your search or filters'
            : 'Create your first enemy template to build a reusable bestiary'}
        </p>
      </div>
    );
  }

  function renderGrid() {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered!.map((template) => (
          <div
            key={template._id}
            className="group relative rounded-lg border border-iron/30 bg-card/40 p-4 transition-all hover:border-gold/40 hover:shadow-glow-sm texture-leather cursor-pointer"
            onClick={() => handleEdit(template)}
          >
            {renderCardContent(template)}
          </div>
        ))}
      </div>
    );
  }

  function renderCardContent(template: EnemyTemplate) {
    return (
      <>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: template.tokenColor }}
            >
              {template.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-['IM_Fell_English'] text-sm font-semibold text-foreground line-clamp-1">
              {template.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleEdit(template); }}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => handleDelete(e, template._id)}
              className="rounded p-1 text-muted-foreground hover:text-blood hover:bg-blood/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${CATEGORY_COLORS[template.category]}`}>
            {CATEGORY_LABELS[template.category]}
          </span>
          {template.system && template.system !== 'custom' && (
            <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${SYSTEM_COLORS[template.system] ?? SYSTEM_COLORS.custom}`}>
              {SYSTEM_LABELS[template.system] ?? template.system}
            </span>
          )}
          {template.cr && (
            <span className="text-[10px] text-muted-foreground">CR {template.cr}</span>
          )}
          <span className="text-[10px] text-muted-foreground capitalize">{template.size}</span>
        </div>

        <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>HP {template.hp.average}{template.hp.formula ? ` (${template.hp.formula})` : ''}</span>
          <span>AC {template.ac}</span>
          {template.initiativeBonus != null && (
            <span>Init {template.initiativeBonus >= 0 ? '+' : ''}{template.initiativeBonus}</span>
          )}
        </div>

        {template.attacks.length > 0 && (
          <div className="mt-2 text-[10px] text-muted-foreground line-clamp-1">
            {template.attacks.map((a) => a.name).join(', ')}
          </div>
        )}

        {template.tags.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {template.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-accent/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-[9px] text-muted-foreground">+{template.tags.length - 3}</span>
            )}
          </div>
        )}
      </>
    );
  }
}
