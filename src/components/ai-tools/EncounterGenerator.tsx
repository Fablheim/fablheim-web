import { useState } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGenerateEncounter } from '@/hooks/useAITools';
import type { EncounterDifficulty, GeneratedEncounter } from '@/types/ai-tools';

interface EncounterGeneratorProps {
  campaignId: string;
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

export function EncounterGenerator({ campaignId }: EncounterGeneratorProps) {
  const [partyLevel, setPartyLevel] = useState('5');
  const [partySize, setPartySize] = useState('4');
  const [difficulty, setDifficulty] = useState<EncounterDifficulty>('medium');
  const [environment, setEnvironment] = useState('');
  const [encounterType, setEncounterType] = useState('');
  const [result, setResult] = useState<GeneratedEncounter | null>(null);
  const [copied, setCopied] = useState(false);

  const generateEncounter = useGenerateEncounter();

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

  async function handleCopy() {
    if (!result) return;
    const npcLines = result.npcs
      .map((n) => `  - ${n.name} (CR ${n.cr}, HP ${n.hp}, AC ${n.ac})${n.count > 1 ? ` x${n.count}` : ''}`)
      .join('\n');

    const text = [
      `# ${result.title}`,
      `Difficulty: ${result.difficulty} | XP: ${result.totalXP}`,
      '',
      result.description,
      '',
      `Creatures:\n${npcLines}`,
      '',
      `Tactics: ${result.tactics}`,
      result.terrain ? `\nTerrain: ${result.terrain}` : '',
      result.treasure ? `\nTreasure: ${result.treasure}` : '',
    ].filter(Boolean).join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="enc-level" className={labelClass}>Party Level</label>
          <input
            id="enc-level"
            type="number"
            min={1}
            max={20}
            value={partyLevel}
            onChange={(e) => setPartyLevel(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="enc-size" className={labelClass}>Party Size</label>
          <input
            id="enc-size"
            type="number"
            min={1}
            max={10}
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="enc-diff" className={labelClass}>Difficulty</label>
          <select
            id="enc-diff"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="enc-env" className={labelClass}>Environment (optional)</label>
          <input
            id="enc-env"
            type="text"
            maxLength={100}
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="Forest, dungeon, tavern..."
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="enc-type" className={labelClass}>Type (optional)</label>
          <input
            id="enc-type"
            type="text"
            maxLength={50}
            value={encounterType}
            onChange={(e) => setEncounterType(e.target.value)}
            placeholder="combat, social, ambush..."
            className={inputClass}
          />
        </div>
      </div>

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
          'Generate Encounter'
        )}
      </Button>

      {generateEncounter.isError && (
        <p className="text-sm text-destructive">
          {(generateEncounter.error as Error).message || 'Generation failed'}
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-md border border-border bg-background/40 p-4 texture-leather">
          <div className="flex items-start justify-between">
            <h4 className="font-['IM_Fell_English'] text-lg text-card-foreground">{result.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider ${
                result.difficulty === 'deadly' ? 'bg-blood/20 text-blood' :
                result.difficulty === 'hard' ? 'bg-primary/20 text-primary' :
                result.difficulty === 'medium' ? 'bg-brass/20 text-brass' :
                'bg-forest/20 text-[hsl(150,50%,55%)]'
              }`}>
                {result.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">{result.totalXP} XP</span>
            </div>
          </div>

          <p className="text-sm text-foreground">{result.description}</p>

          {/* Creatures */}
          <div>
            <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Creatures</p>
            <div className="mt-1.5 space-y-1">
              {result.npcs.map((npc, i) => (
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

          {/* Tactics */}
          <div>
            <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Tactics</p>
            <p className="mt-0.5 text-sm text-foreground">{result.tactics}</p>
          </div>

          {result.terrain && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Terrain</p>
              <p className="mt-0.5 text-sm text-foreground">{result.terrain}</p>
            </div>
          )}

          {result.treasure && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Treasure</p>
              <p className="mt-0.5 text-sm italic text-muted-foreground">{result.treasure}</p>
            </div>
          )}

          <div className="pt-1">
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
