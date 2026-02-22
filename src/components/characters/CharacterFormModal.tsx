import { type FormEvent, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateCharacter, useUpdateCharacter } from '@/hooks/useCharacters';
import type { Character } from '@/types/campaign';

interface CharacterFormModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  character?: Character | null;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

// D&D 5e-specific: other systems use different ability scores
// (e.g. PF2e adds separate saves/proficiencies, Blades uses action ratings)
// TODO: make system-aware when multi-system character sheets are implemented
const ABILITY_SCORES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export function CharacterFormModal({ open, onClose, campaignId, character }: CharacterFormModalProps) {
  const isEdit = !!character;

  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [charClass, setCharClass] = useState('');
  const [level, setLevel] = useState(1);
  const [backstory, setBackstory] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  });
  const [passivePerception, setPassivePerception] = useState(10);
  const [passiveInsight, setPassiveInsight] = useState(10);
  const [passiveInvestigation, setPassiveInvestigation] = useState(10);

  const createCharacter = useCreateCharacter();
  const updateCharacter = useUpdateCharacter();

  useEffect(() => {
    if (character) {
      setName(character.name);
      setRace(character.race || '');
      setCharClass(character.class || '');
      setLevel(character.level);
      setBackstory(character.backstory || '');
      setStats(character.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
      setPassivePerception(character.passiveScores?.perception ?? 10);
      setPassiveInsight(character.passiveScores?.insight ?? 10);
      setPassiveInvestigation(character.passiveScores?.investigation ?? 10);
    } else {
      resetForm();
    }
  }, [character]);

  if (!open) return null;

  function resetForm() {
    setName('');
    setRace('');
    setCharClass('');
    setLevel(1);
    setBackstory('');
    setStats({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    setPassivePerception(10);
    setPassiveInsight(10);
    setPassiveInvestigation(10);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function updateStat(key: string, value: number) {
    setStats((prev) => ({ ...prev, [key]: value }));
  }

  // D&D 5e modifier formula: (score - 10) / 2 rounded down
  // TODO: other systems calculate modifiers differently
  function getModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name,
      race: race || undefined,
      class: charClass || undefined,
      level,
      backstory: backstory || undefined,
      stats,
      passiveScores: {
        perception: passivePerception,
        insight: passiveInsight,
        investigation: passiveInvestigation,
      },
    };

    if (isEdit && character) {
      await updateCharacter.mutateAsync({ id: character._id, campaignId, data: payload });
    } else {
      await createCharacter.mutateAsync({ campaignId, ...payload });
    }
    handleClose();
  }

  const isPending = createCharacter.isPending || updateCharacter.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        <div className="flex items-center justify-between">
          <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
            {isEdit ? 'Edit Character' : 'Create Character'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="char-name" className={labelClass}>Name</label>
            <input
              id="char-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Thalion Windwalker"
              className={inputClass}
            />
          </div>

          {/* Race + Class row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="char-race" className={labelClass}>Race</label>
              <input
                id="char-race"
                type="text"
                maxLength={50}
                value={race}
                onChange={(e) => setRace(e.target.value)}
                placeholder="Human, Elf, Dwarf..."
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="char-class" className={labelClass}>Class</label>
              <input
                id="char-class"
                type="text"
                maxLength={50}
                value={charClass}
                onChange={(e) => setCharClass(e.target.value)}
                placeholder="Fighter, Wizard..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Level */}
          <div className="w-24">
            <label htmlFor="char-level" className={labelClass}>Level</label>
            <input
              id="char-level"
              type="number"
              min={1}
              max={20}
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
              className={inputClass}
            />
          </div>

          {/* Ability Scores */}
          <div>
            <div className="divider-ornate mb-3" />
            <p className={`${labelClass} mb-2`}>Ability Scores</p>
            <div className="grid grid-cols-3 gap-3">
              {ABILITY_SCORES.map((stat) => (
                <div key={stat} className="rounded-md bg-background/40 p-2 text-center">
                  <label htmlFor={`stat-${stat}`} className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                    {ABILITY_LABELS[stat]}
                  </label>
                  <input
                    id={`stat-${stat}`}
                    type="number"
                    min={1}
                    max={30}
                    value={stats[stat] ?? 10}
                    onChange={(e) => updateStat(stat, parseInt(e.target.value) || 10)}
                    className="mt-1 w-full rounded-sm border border-input bg-input px-2 py-1 text-center text-sm text-foreground input-carved"
                  />
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {getModifier(stats[stat] ?? 10)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Passive Scores — D&D 5e-specific (perception, insight, investigation) */}
          {/* TODO: hide or replace for non-D&D systems */}
          <div>
            <div className="divider-ornate mb-3" />
            <p className={`${labelClass} mb-2`}>Passive Scores</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="passive-perception" className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                  Perception
                </label>
                <input
                  id="passive-perception"
                  type="number"
                  min={1}
                  max={30}
                  value={passivePerception}
                  onChange={(e) => setPassivePerception(parseInt(e.target.value) || 10)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="passive-insight" className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                  Insight
                </label>
                <input
                  id="passive-insight"
                  type="number"
                  min={1}
                  max={30}
                  value={passiveInsight}
                  onChange={(e) => setPassiveInsight(parseInt(e.target.value) || 10)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="passive-investigation" className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                  Investigation
                </label>
                <input
                  id="passive-investigation"
                  type="number"
                  min={1}
                  max={30}
                  value={passiveInvestigation}
                  onChange={(e) => setPassiveInvestigation(parseInt(e.target.value) || 10)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Backstory */}
          <div>
            <div className="divider-ornate mb-3" />
            <label htmlFor="char-backstory" className={labelClass}>Backstory</label>
            <textarea
              id="char-backstory"
              rows={4}
              maxLength={5000}
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              placeholder="Born in the shadow of the Spine of the World..."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit ? 'Saving...' : 'Creating...'
                : isEdit ? 'Save Changes' : 'Create Character'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
