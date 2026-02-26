import { useState } from 'react';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useGenerateEncounter } from '@/hooks/useAITools';
import { useUpdateEncounter } from '@/hooks/useEncounters';
import type { EncounterDifficulty, GeneratedEncounter } from '@/types/ai-tools';
import type { Encounter } from '@/types/encounter';

interface EncounterAIPanelProps {
  campaignId: string;
  encounter: Encounter;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

const DIFFICULTIES: { value: EncounterDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'deadly', label: 'Deadly' },
];

export function EncounterAIPanel({ campaignId, encounter }: EncounterAIPanelProps) {
  const [partyLevel, setPartyLevel] = useState('5');
  const [partySize, setPartySize] = useState('4');
  const [difficulty, setDifficulty] = useState<EncounterDifficulty>(
    encounter.difficulty as EncounterDifficulty,
  );
  const [environment, setEnvironment] = useState('');
  const [encounterType, setEncounterType] = useState('');
  const [result, setResult] = useState<GeneratedEncounter | null>(null);

  const generateEncounter = useGenerateEncounter();
  const updateEncounter = useUpdateEncounter(campaignId, encounter._id);

  async function handleGenerate() {
    setResult(null);
    const data = await generateEncounter.mutateAsync({
      campaignId,
      partyLevel: parseInt(partyLevel, 10) || 5,
      partySize: parseInt(partySize, 10) || 4,
      difficulty,
      environment: environment.trim() || undefined,
      encounterType: encounterType.trim() || undefined,
    });
    setResult(data);
  }

  function handleSaveToEncounter() {
    if (!result) return;
    updateEncounter.mutate(
      {
        description: result.description,
        difficulty: result.difficulty as EncounterDifficulty,
        estimatedXP: result.totalXP,
        npcs: result.npcs.map((n) => ({
          name: n.name,
          count: n.count,
          cr: n.cr,
          hp: n.hp,
          ac: n.ac,
          initiativeBonus: n.initiativeBonus,
          statBlock: n.statBlock,
          tactics: n.tactics,
        })),
        tactics: result.tactics,
        terrain: result.terrain,
        treasure: result.treasure,
        hooks: result.hooks,
      },
      {
        onSuccess: () => toast.success('AI encounter saved'),
        onError: () => toast.error('Failed to save AI encounter'),
      },
    );
  }

  return (
    <div className="space-y-4">
      {renderForm()}
      {renderGenerateButton()}
      {result && renderResult()}
    </div>
  );

  function renderForm() {
    return (
      <>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="ai-level" className={labelClass}>Party Level</label>
            <input
              id="ai-level"
              type="number"
              min={1}
              max={20}
              value={partyLevel}
              onChange={(e) => setPartyLevel(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ai-size" className={labelClass}>Party Size</label>
            <input
              id="ai-size"
              type="number"
              min={1}
              max={10}
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ai-diff" className={labelClass}>Difficulty</label>
            <select
              id="ai-diff"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as EncounterDifficulty)}
              className={inputClass}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ai-env" className={labelClass}>Environment</label>
            <input
              id="ai-env"
              type="text"
              maxLength={100}
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="Forest, dungeon, tavern..."
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ai-type" className={labelClass}>Type</label>
            <input
              id="ai-type"
              type="text"
              maxLength={50}
              value={encounterType}
              onChange={(e) => setEncounterType(e.target.value)}
              placeholder="combat, social, ambush..."
              className={inputClass}
            />
          </div>
        </div>
      </>
    );
  }

  function renderGenerateButton() {
    return (
      <Button
        onClick={handleGenerate}
        disabled={generateEncounter.isPending}
        className="shadow-glow"
      >
        {generateEncounter.isPending ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            Building Encounter...
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 h-4 w-4" />
            Generate Encounter
          </>
        )}
      </Button>
    );
  }

  function renderResult() {
    if (!result) return null;

    return (
      <div className="space-y-3 rounded-md border border-border bg-background/40 p-4 texture-leather">
        {renderResultHeader()}
        {renderResultBody()}
      </div>
    );
  }

  function renderResultHeader() {
    return (
      <div className="flex items-start justify-between">
        <h4 className="font-['IM_Fell_English'] text-lg text-card-foreground">{result!.title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{result!.totalXP} XP</span>
          <Button size="sm" onClick={handleSaveToEncounter} disabled={updateEncounter.isPending}>
            {updateEncounter.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save to Encounter
          </Button>
        </div>
      </div>
    );
  }

  function renderResultBody() {
    return (
      <>
        <p className="text-sm text-foreground">{result!.description}</p>

        <div>
          <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Creatures</p>
          <div className="mt-1.5 space-y-1">
            {result!.npcs.map((npc, i) => (
              <div key={i} className="flex items-center gap-3 rounded bg-background/30 px-3 py-1.5 text-sm">
                <span className="font-medium text-foreground">
                  {npc.name}{npc.count > 1 ? ` x${npc.count}` : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                  CR {npc.cr} | HP {npc.hp} | AC {npc.ac}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Tactics</p>
          <p className="mt-0.5 text-sm text-foreground">{result!.tactics}</p>
        </div>

        {result!.terrain && (
          <div>
            <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Terrain</p>
            <p className="mt-0.5 text-sm text-foreground">{result!.terrain}</p>
          </div>
        )}

        {result!.treasure && (
          <div>
            <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Treasure</p>
            <p className="mt-0.5 text-sm italic text-muted-foreground">{result!.treasure}</p>
          </div>
        )}
      </>
    );
  }
}
