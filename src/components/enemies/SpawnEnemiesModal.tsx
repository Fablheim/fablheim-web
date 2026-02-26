import { useState } from 'react';
import { X, Loader2, Search, Skull } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useEnemyTemplates, useSpawnEnemies } from '@/hooks/useEnemyTemplates';
import type { EnemyTemplate, SpawnedEnemy, EnemyCategory } from '@/types/enemy-template';

interface SpawnEnemiesModalProps {
  open: boolean;
  onClose: () => void;
  onSpawn: (enemies: SpawnedEnemy[]) => void;
}

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

type NamingPattern = 'numeric' | 'alpha' | 'custom';

export function SpawnEnemiesModal({ open, onClose, onSpawn }: SpawnEnemiesModalProps) {
  const { data: templates, isLoading } = useEnemyTemplates();
  const spawnEnemies = useSpawnEnemies();

  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EnemyTemplate | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [namingPattern, setNamingPattern] = useState<NamingPattern>('numeric');

  if (!open) return null;

  function handleClose() {
    setSearch('');
    setSelectedTemplate(null);
    setQuantity(1);
    setNamingPattern('numeric');
    onClose();
  }

  function handleBack() {
    setSelectedTemplate(null);
    setQuantity(1);
    setNamingPattern('numeric');
  }

  async function handleSpawn() {
    if (!selectedTemplate) return;

    try {
      const enemies = await spawnEnemies.mutateAsync({
        templateId: selectedTemplate._id,
        body: { quantity, namingPattern },
      });
      onSpawn(enemies);
      toast.success(`Spawned ${quantity} ${selectedTemplate.name}`);
      handleClose();
    } catch {
      toast.error('Failed to spawn enemies');
    }
  }

  const filtered = templates?.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg border border-border border-t-2 border-t-brass/50 bg-card shadow-warm-lg tavern-card iron-brackets texture-parchment flex flex-col">
        {renderHeader()}
        {selectedTemplate ? renderSpawnForm() : renderTemplateList()}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between p-4 border-b border-[hsla(38,40%,30%,0.15)] shrink-0">
        <h2 className="font-['IM_Fell_English'] text-lg text-card-foreground">
          {selectedTemplate ? `Spawn: ${selectedTemplate.name}` : 'Add from Library'}
        </h2>
        <button type="button" onClick={handleClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  function renderTemplateList() {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-sm border border-input bg-input pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && (!filtered || filtered.length === 0) && (
            <div className="py-8 text-center">
              <Skull className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground font-['IM_Fell_English'] italic">
                {search ? 'No matching templates' : 'No templates yet — create one in the Enemy Library'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {filtered?.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => setSelectedTemplate(t)}
                className="w-full flex items-center gap-3 rounded-md border border-iron/30 bg-background/40 px-3 py-2 text-left transition-all hover:border-gold/40 hover:bg-accent/20"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: t.tokenColor }}
                >
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-['IM_Fell_English'] text-sm text-foreground truncate">{t.name}</span>
                    <span className={`shrink-0 rounded-md px-1 py-0.5 font-[Cinzel] text-[8px] uppercase tracking-wider ${CATEGORY_COLORS[t.category]}`}>
                      {t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                    {t.cr && <span>CR {t.cr}</span>}
                    <span>HP {t.hp.average}</span>
                    <span>AC {t.ac}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderSpawnForm() {
    const template = selectedTemplate!;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 rounded-md border border-iron/30 bg-background/30 px-3 py-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: template.tokenColor }}
          >
            {template.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-['IM_Fell_English'] text-sm text-foreground">{template.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {template.cr ? `CR ${template.cr} · ` : ''}HP {template.hp.average} · AC {template.ac}
            </p>
          </div>
        </div>

        <div>
          <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
            className="mt-1 w-24 rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground input-carved"
          />
        </div>

        <div>
          <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground mb-2">
            Naming Pattern
          </label>
          <div className="space-y-1.5">
            {renderRadio('numeric', `${template.name} 1, ${template.name} 2, ${template.name} 3...`)}
            {renderRadio('alpha', `${template.name} A, ${template.name} B, ${template.name} C...`)}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[hsla(38,40%,30%,0.15)]">
          <Button variant="secondary" onClick={handleBack}>Back</Button>
          <Button onClick={handleSpawn} disabled={spawnEnemies.isPending}>
            {spawnEnemies.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Spawn {quantity} {quantity > 1 ? 'Enemies' : 'Enemy'}
          </Button>
        </div>
      </div>
    );
  }

  function renderRadio(value: NamingPattern, label: string) {
    return (
      <label className="flex items-center gap-2 cursor-pointer rounded-md border border-iron/20 px-3 py-2 hover:bg-accent/20 transition-colors">
        <input
          type="radio"
          name="naming"
          value={value}
          checked={namingPattern === value}
          onChange={() => setNamingPattern(value)}
          className="accent-primary"
        />
        <span className="text-xs text-foreground">{label}</span>
      </label>
    );
  }
}
