import { type FormEvent, useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useCreateEnemyTemplate, useUpdateEnemyTemplate } from '@/hooks/useCreatureTemplates';
import { SYSTEM_STATS } from '@/lib/enemy-constants';
import type {
  EnemyTemplate,
  EnemyCategory,
  EnemySize,
  EnemyAttack,
  EnemyTrait,
} from '@/types/creature-template';

interface EnemyTemplateFormModalProps {
  open: boolean;
  onClose: () => void;
  template?: EnemyTemplate | null;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

const CATEGORIES: { value: EnemyCategory; label: string }[] = [
  { value: 'humanoid', label: 'Humanoid' },
  { value: 'beast', label: 'Beast' },
  { value: 'undead', label: 'Undead' },
  { value: 'dragon', label: 'Dragon' },
  { value: 'aberration', label: 'Aberration' },
  { value: 'construct', label: 'Construct' },
  { value: 'elemental', label: 'Elemental' },
  { value: 'fey', label: 'Fey' },
  { value: 'fiend', label: 'Fiend' },
  { value: 'giant', label: 'Giant' },
  { value: 'monstrosity', label: 'Monstrosity' },
  { value: 'ooze', label: 'Ooze' },
  { value: 'plant', label: 'Plant' },
  { value: 'custom', label: 'Custom' },
];

const SIZES: { value: EnemySize; label: string }[] = [
  { value: 'tiny', label: 'Tiny' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'huge', label: 'Huge' },
  { value: 'gargantuan', label: 'Gargantuan' },
];

const SYSTEMS: { value: string; label: string }[] = [
  { value: 'dnd5e', label: 'D&D 5e' },
  { value: 'pathfinder2e', label: 'Pathfinder 2e' },
  { value: 'daggerheart', label: 'Daggerheart' },
  { value: 'fate', label: 'Fate' },
  { value: 'custom', label: 'Custom / Other' },
];

const EMPTY_ATTACK: EnemyAttack = { name: '', bonus: 0, damage: '', range: '' };
const EMPTY_TRAIT: EnemyTrait = { name: '', description: '' };

export function EnemyTemplateFormModal({ open, onClose, template }: EnemyTemplateFormModalProps) {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const isEdit = !!template && !isDuplicate;
  const readOnly = !!template?.isGlobal && !isDuplicate;
  const createTemplate = useCreateEnemyTemplate();
  const updateTemplate = useUpdateEnemyTemplate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<EnemyCategory>('custom');
  const [cr, setCr] = useState('');
  const [size, setSize] = useState<EnemySize>('medium');
  const [hpAvg, setHpAvg] = useState('10');
  const [hpFormula, setHpFormula] = useState('');
  const [ac, setAc] = useState('10');
  const [walkSpeed, setWalkSpeed] = useState('30');
  const [flySpeed, setFlySpeed] = useState('');
  const [swimSpeed, setSwimSpeed] = useState('');
  const [initBonus, setInitBonus] = useState('0');
  const [abilityScores, setAbilityScores] = useState<Record<string, string>>({});
  const [attacks, setAttacks] = useState<EnemyAttack[]>([]);
  const [traits, setTraits] = useState<EnemyTrait[]>([]);
  const [tokenColor, setTokenColor] = useState('#ef4444');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [system, setSystem] = useState('custom');

  useEffect(() => {
    setIsDuplicate(false);
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setCr(template.cr ?? '');
      setSize(template.size);
      setHpAvg(template.hp.average.toString());
      setHpFormula(template.hp.formula ?? '');
      setAc(template.ac.toString());
      setWalkSpeed(template.speed?.walk?.toString() ?? '30');
      setFlySpeed(template.speed?.fly?.toString() ?? '');
      setSwimSpeed(template.speed?.swim?.toString() ?? '');
      setInitBonus(template.initiativeBonus?.toString() ?? '0');
      if (template.abilities) {
        const scores: Record<string, string> = {};
        for (const [k, v] of Object.entries(template.abilities)) {
          scores[k] = v.toString();
        }
        setAbilityScores(scores);
      } else {
        setAbilityScores({});
      }
      setAttacks(template.attacks.length ? template.attacks : []);
      setTraits(template.traits.length ? template.traits : []);
      setTokenColor(template.tokenColor);
      setTags(template.tags.join(', '));
      setSource(template.source ?? '');
      setNotes(template.notes ?? '');
      setSystem(template.system ?? 'custom');
    } else {
      resetForm();
    }
  }, [template]);

  function resetForm() {
    setName(''); setCategory('custom'); setCr(''); setSize('medium');
    setHpAvg('10'); setHpFormula(''); setAc('10');
    setWalkSpeed('30'); setFlySpeed(''); setSwimSpeed('');
    setInitBonus('0');
    setAbilityScores({});
    setAttacks([]); setTraits([]);
    setTokenColor('#ef4444'); setTags(''); setSource(''); setNotes('');
    setSystem('custom');
  }

  if (!open) return null;

  function handleClose() {
    resetForm();
    setIsDuplicate(false);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      category,
      cr: cr.trim() || undefined,
      size,
      hp: { average: parseInt(hpAvg, 10) || 1, formula: hpFormula.trim() || undefined },
      ac: parseInt(ac, 10) || 10,
      speed: {
        walk: parseInt(walkSpeed, 10) || 30,
        ...(flySpeed ? { fly: parseInt(flySpeed, 10) } : {}),
        ...(swimSpeed ? { swim: parseInt(swimSpeed, 10) } : {}),
      },
      abilities: (() => {
        const stats = SYSTEM_STATS[system];
        if (!stats) return undefined;
        const obj: Record<string, number> = {};
        for (const s of stats) obj[s.key] = parseInt(abilityScores[s.key] ?? '10', 10) || 10;
        return obj;
      })(),
      initiativeBonus: parseInt(initBonus, 10) || 0,
      attacks: attacks.filter((a) => a.name.trim()),
      traits: traits.filter((t) => t.name.trim()),
      tokenColor,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      source: source.trim() || undefined,
      notes: notes.trim() || undefined,
      system: system || undefined,
    };

    try {
      if (isEdit && template) {
        await updateTemplate.mutateAsync({ id: template._id, body: payload });
        toast.success('Template updated');
      } else {
        await createTemplate.mutateAsync(payload);
        toast.success('Template created');
      }
      handleClose();
    } catch {
      toast.error(isEdit ? 'Failed to update template' : 'Failed to create template');
    }
  }

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        {renderHeader()}
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <fieldset disabled={readOnly} className="space-y-5 disabled:opacity-70">
            {renderBasicInfo()}
            {renderCombatStats()}
            {renderAbilities()}
            {renderAttacks()}
            {renderTraits()}
            {renderAppearance()}
          </fieldset>
          {renderFooter()}
        </form>
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between">
        <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
          {readOnly ? 'View Template' : isDuplicate ? 'Duplicate Template' : isEdit ? 'Edit Enemy Template' : 'New Enemy Template'}
        </h2>
        <button type="button" onClick={handleClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  function renderBasicInfo() {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Name *</label>
            <input type="text" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Goblin" />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as EnemyCategory)} className={inputClass}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>System</label>
            <select value={system} onChange={(e) => setSystem(e.target.value)} className={inputClass}>
              {SYSTEMS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>CR</label>
            <input type="text" value={cr} onChange={(e) => setCr(e.target.value)} className={inputClass} placeholder="1/4" />
          </div>
          <div>
            <label className={labelClass}>Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value as EnemySize)} className={inputClass}>
              {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Initiative</label>
            <input type="number" value={initBonus} onChange={(e) => setInitBonus(e.target.value)} className={inputClass} />
          </div>
        </div>
      </>
    );
  }

  function renderCombatStats() {
    return (
      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className={labelClass}>HP *</label>
          <input type="number" required min={1} value={hpAvg} onChange={(e) => setHpAvg(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>HP Dice</label>
          <input type="text" value={hpFormula} onChange={(e) => setHpFormula(e.target.value)} className={inputClass} placeholder="2d6" />
        </div>
        <div>
          <label className={labelClass}>AC *</label>
          <input type="number" required min={0} value={ac} onChange={(e) => setAc(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Walk</label>
          <input type="number" min={0} value={walkSpeed} onChange={(e) => setWalkSpeed(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fly</label>
          <input type="number" min={0} value={flySpeed} onChange={(e) => setFlySpeed(e.target.value)} className={inputClass} placeholder="—" />
        </div>
      </div>
    );
  }

  function renderAbilities() {
    const stats = SYSTEM_STATS[system];
    if (!stats) {
      return (
        <div className="rounded border border-iron/20 bg-background/20 px-3 py-2">
          <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic">
            No ability scores defined for this system. Use Traits below for custom attributes.
          </p>
        </div>
      );
    }
    return (
      <div>
        <p className={labelClass}>Ability Scores</p>
        <div className="grid grid-cols-6 gap-2 mt-1">
          {stats.map((s) => (
            <div key={s.key} className="text-center">
              <span className="text-[10px] text-muted-foreground font-[Cinzel] uppercase">{s.label}</span>
              <input
                type="number"
                min={1}
                max={30}
                value={abilityScores[s.key] ?? '10'}
                onChange={(e) => setAbilityScores({ ...abilityScores, [s.key]: e.target.value })}
                className={`${inputClass} text-center`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAttacks() {
    return (
      <div>
        <div className="flex items-center justify-between">
          <p className={labelClass}>Attacks</p>
          {!readOnly && (
            <button type="button" onClick={() => setAttacks([...attacks, { ...EMPTY_ATTACK }])} className="flex items-center gap-1 text-[10px] text-brass hover:text-brass/80 font-[Cinzel] uppercase">
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>
        <div className="mt-1 space-y-2">
          {attacks.map((atk, i) => (
            <div key={i} className="flex items-start gap-2 rounded border border-iron/20 bg-background/30 p-2">
              <div className="grid flex-1 grid-cols-4 gap-2">
                <input type="text" value={atk.name} onChange={(e) => { const a = [...attacks]; a[i] = { ...a[i], name: e.target.value }; setAttacks(a); }} placeholder="Name" className={`${inputClass} mt-0`} />
                <input type="number" value={atk.bonus} onChange={(e) => { const a = [...attacks]; a[i] = { ...a[i], bonus: parseInt(e.target.value, 10) || 0 }; setAttacks(a); }} placeholder="+5" className={`${inputClass} mt-0`} />
                <input type="text" value={atk.damage} onChange={(e) => { const a = [...attacks]; a[i] = { ...a[i], damage: e.target.value }; setAttacks(a); }} placeholder="1d6+2 slashing" className={`${inputClass} mt-0`} />
                <input type="text" value={atk.range ?? ''} onChange={(e) => { const a = [...attacks]; a[i] = { ...a[i], range: e.target.value }; setAttacks(a); }} placeholder="5 ft" className={`${inputClass} mt-0`} />
              </div>
              {!readOnly && (
                <button type="button" onClick={() => setAttacks(attacks.filter((_, j) => j !== i))} className="mt-1 text-muted-foreground hover:text-blood">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderTraits() {
    return (
      <div>
        <div className="flex items-center justify-between">
          <p className={labelClass}>Traits / Abilities</p>
          {!readOnly && (
            <button type="button" onClick={() => setTraits([...traits, { ...EMPTY_TRAIT }])} className="flex items-center gap-1 text-[10px] text-brass hover:text-brass/80 font-[Cinzel] uppercase">
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>
        <div className="mt-1 space-y-2">
          {traits.map((trait, i) => (
            <div key={i} className="flex items-start gap-2 rounded border border-iron/20 bg-background/30 p-2">
              <div className="flex-1 space-y-1">
                <input type="text" value={trait.name} onChange={(e) => { const t = [...traits]; t[i] = { ...t[i], name: e.target.value }; setTraits(t); }} placeholder="Trait name" className={`${inputClass} mt-0`} />
                <textarea value={trait.description} onChange={(e) => { const t = [...traits]; t[i] = { ...t[i], description: e.target.value }; setTraits(t); }} placeholder="Description" rows={2} className={`${inputClass} mt-0 resize-none`} />
              </div>
              {!readOnly && (
                <button type="button" onClick={() => setTraits(traits.filter((_, j) => j !== i))} className="mt-1 text-muted-foreground hover:text-blood">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAppearance() {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Token Color</label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={tokenColor} onChange={(e) => setTokenColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border border-iron" />
              <span className="text-xs text-muted-foreground">{tokenColor}</span>
            </div>
          </div>
          <div>
            <label className={labelClass}>Source</label>
            <input type="text" value={source} onChange={(e) => setSource(e.target.value)} className={inputClass} placeholder="Monster Manual" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Tags (comma separated)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="goblinoid, low-cr, forest" />
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="GM notes..." />
        </div>
      </>
    );
  }

  function renderFooter() {
    if (readOnly) {
      return (
        <div className="flex justify-end gap-2 pt-2 border-t border-[hsla(38,40%,30%,0.15)]">
          <Button type="button" variant="secondary" onClick={handleClose}>Close</Button>
          <Button type="button" onClick={() => setIsDuplicate(true)}>
            <Copy className="mr-1.5 h-4 w-4" />
            Duplicate to My Library
          </Button>
        </div>
      );
    }
    return (
      <div className="flex justify-end gap-2 pt-2 border-t border-[hsla(38,40%,30%,0.15)]">
        <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {isDuplicate ? 'Create Copy' : isEdit ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    );
  }
}
