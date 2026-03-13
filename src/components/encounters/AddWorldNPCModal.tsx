import { useState, useMemo } from 'react';
import { X, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { WorldEntity } from '@/types/campaign';
import type { EncounterNPC } from '@/types/encounter';

interface AddWorldNPCModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (npc: EncounterNPC) => void;
  campaignId: string;
  existingGroups?: string[];
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved';

function parseNumber(val: unknown, fallback: number): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
  }
  return fallback;
}

function parseCrValue(val: unknown): number | undefined {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;

  if (trimmed.includes('/')) {
    const [numeratorText, denominatorText] = trimmed.split('/');
    const numerator = Number(numeratorText);
    const denominator = Number(denominatorText);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractStatsFromStatBlock(text: string): { hp?: number; ac?: number; initBonus?: number; cr?: number } {
  const hpMatch = text.match(/HP[:\s]+(\d+)/i);
  const acMatch = text.match(/AC[:\s]+(\d+)/i);
  const dexMatch = text.match(/DEX\s+\d+\s*\(([+-]\d+)\)/i);
  const crMatch = text.match(/\b(?:CR|Challenge)\s*[:\s]+(\d+(?:\/\d+)?(?:\.\d+)?)/i);
  return {
    hp: hpMatch ? parseInt(hpMatch[1], 10) : undefined,
    ac: acMatch ? parseInt(acMatch[1], 10) : undefined,
    initBonus: dexMatch ? parseInt(dexMatch[1], 10) : undefined,
    cr: crMatch ? parseCrValue(crMatch[1]) : undefined,
  };
}

export function AddWorldNPCModal({ open, onClose, onAdd, campaignId, existingGroups }: AddWorldNPCModalProps) {
  const { data: entities } = useWorldEntities(campaignId);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WorldEntity | null>(null);
  const [count, setCount] = useState(1);
  const [hp, setHp] = useState('');
  const [ac, setAc] = useState('');
  const [cr, setCr] = useState('');
  const [initBonus, setInitBonus] = useState('');
  const [group, setGroup] = useState('');

  const npcs = useMemo(() => {
    if (!entities) return [];
    return entities.filter((e) => e.type === 'npc' || e.type === 'npc_minor');
  }, [entities]);

  const filtered = useMemo(() => {
    if (!search.trim()) return npcs;
    const q = search.toLowerCase();
    return npcs.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [npcs, search]);

  if (!open) return null;

  function handleClose() {
    setSearch('');
    setSelected(null);
    setCount(1);
    setHp('');
    setAc('');
    setCr('');
    setInitBonus('');
    setGroup('');
    onClose();
  }

  function handleSelect(entity: WorldEntity) {
    setSelected(entity);
    const td = entity.typeData ?? {};
    // Try typeData fields first, then parse from statBlock text
    const statBlockText = String(td.statBlock ?? '');
    const parsed = statBlockText ? extractStatsFromStatBlock(statBlockText) : {};
    setHp(String(parseNumber(td.hp, parsed.hp ?? 10)));
    setAc(String(parseNumber(td.ac, parsed.ac ?? 10)));
    setCr(String(parseCrValue(td.cr) ?? parsed.cr ?? 0));
    setInitBonus(String(parseNumber(td.initiativeBonus, parsed.initBonus ?? 0)));
  }

  function handleAdd() {
    if (!selected) return;
    const encounterNPC: EncounterNPC = {
      name: selected.name,
      count,
      cr: parseFloat(cr) || 0,
      hp: parseInt(hp, 10) || 10,
      ac: parseInt(ac, 10) || 10,
      initiativeBonus: parseInt(initBonus, 10) || 0,
      statBlock: String(selected.typeData?.statBlock ?? ''),
      tactics: selected.typeData?.tactics ? String(selected.typeData.tactics) : undefined,
      ...(group.trim() ? { group: group.trim() } : {}),
    };
    onAdd(encounterNPC);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg border border-border border-t-2 border-t-brass/50 bg-card shadow-warm-lg tavern-card iron-brackets texture-parchment flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[hsla(38,40%,30%,0.15)] shrink-0">
          <h2 className="font-['IM_Fell_English'] text-lg text-card-foreground">
            {selected ? `Add: ${selected.name}` : 'Add World NPC'}
          </h2>
          <button type="button" onClick={handleClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {selected ? renderForm() : renderList()}
      </div>
    </div>
  );

  function renderList() {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search world NPCs..."
              className="w-full rounded-sm border border-input bg-input pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <User className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground font-['IM_Fell_English'] italic">
                {search ? 'No matching NPCs' : 'No NPCs in this campaign yet'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((npc) => (
              <button
                key={npc._id}
                type="button"
                onClick={() => handleSelect(npc)}
                className="w-full flex items-center gap-3 rounded-md border border-iron/30 bg-background/40 px-3 py-2 text-left transition-all hover:border-gold/40 hover:bg-accent/20"
              >
                <div className="h-7 w-7 rounded-full bg-brass/20 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-brass" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-['IM_Fell_English'] text-sm text-foreground truncate">{npc.name}</span>
                    <span className="shrink-0 rounded-md px-1 py-0.5 font-[Cinzel] text-[8px] uppercase tracking-wider bg-brass/15 text-brass">
                      {npc.type === 'npc_minor' ? 'Minor' : 'NPC'}
                    </span>
                  </div>
                  {npc.typeData?.role && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{String(npc.typeData.role)}</p>
                  )}
                  {npc.typeData?.statBlock && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">Has stat block</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderForm() {
    return (
      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-3 rounded-md border border-iron/30 bg-background/30 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-brass/20 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-brass" />
          </div>
          <div className="min-w-0">
            <p className="font-['IM_Fell_English'] text-sm text-foreground truncate">{selected!.name}</p>
            {selected!.typeData?.role && (
              <p className="text-[10px] text-muted-foreground truncate">{String(selected!.typeData.role)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">HP</label>
            <input type="number" min={1} value={hp} onChange={(e) => setHp(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">AC</label>
            <input type="number" min={0} value={ac} onChange={(e) => setAc(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">CR</label>
            <input type="number" min={0} step={0.25} value={cr} onChange={(e) => setCr(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">Init Bonus</label>
            <input type="number" value={initBonus} onChange={(e) => setInitBonus(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">Quantity</label>
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
            className={inputClass + ' w-24'}
          />
        </div>

        <div>
          <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">Group (optional)</label>
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="e.g. Guards, Boss adds..."
            maxLength={50}
            list="world-npc-groups"
            className={inputClass}
          />
          {existingGroups && existingGroups.length > 0 && (
            <datalist id="world-npc-groups">
              {existingGroups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          )}
        </div>

        {selected!.typeData?.statBlock && (
          <div>
            <label className="block font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground mb-1">Stat Block Preview</label>
            <pre className="rounded-md border border-iron/20 bg-background/40 p-2 text-[10px] text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
              {String(selected!.typeData.statBlock)}
            </pre>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[hsla(38,40%,30%,0.15)]">
          <Button variant="secondary" onClick={() => setSelected(null)}>Back</Button>
          <Button onClick={handleAdd}>
            Add to Encounter
          </Button>
        </div>
      </div>
    );
  }
}
