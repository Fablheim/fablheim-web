import { useState } from 'react';
import { Loader2, Copy, Check, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGenerateNPC } from '@/hooks/useAITools';
import { useCreateWorldEntity } from '@/hooks/useWorldEntities';
import { GenerationMeta } from './GenerationMeta';
import type { GeneratedNPC } from '@/types/ai-tools';

interface NPCGeneratorProps {
  campaignId: string;
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

export function NPCGenerator({ campaignId }: NPCGeneratorProps) {
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('');
  const [result, setResult] = useState<GeneratedNPC | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const generateNPC = useGenerateNPC();
  const createEntity = useCreateWorldEntity();

  async function handleGenerate() {
    if (!description.trim()) return;
    setResult(null);
    setSaved(false);

    const data = await generateNPC.mutateAsync({
      campaignId,
      description: description.trim(),
      role: role.trim() || undefined,
      level: level ? parseInt(level, 10) : undefined,
    });
    setResult(data);
  }

  async function handleCopy() {
    if (!result) return;
    const text = [
      `Name: ${result.name}`,
      `Role: ${result.role}`,
      '',
      `Appearance: ${result.appearance}`,
      '',
      `Personality: ${result.personality}`,
      '',
      result.statBlock ? `Stats:\n${result.statBlock}` : '',
      result.plotHooks ? `\nPlot Hooks: ${result.plotHooks}` : '',
    ].filter(Boolean).join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddToCampaign() {
    if (!result) return;
    await createEntity.mutateAsync({
      campaignId,
      data: {
        name: result.name,
        type: 'npc',
        description: [result.appearance, result.personality].filter(Boolean).join('\n\n'),
        tags: ['ai-generated', result.role].filter(Boolean),
        visibility: 'dm-only',
        typeData: {
          role: result.role,
          personality: result.personality,
          secrets: result.plotHooks ?? '',
        },
      },
    });
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <div>
        <label htmlFor="npc-desc" className={labelClass}>Description / Prompt</label>
        <textarea
          id="npc-desc"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A mysterious elven merchant who deals in forbidden knowledge..."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="npc-role" className={labelClass}>Role (optional)</label>
          <input
            id="npc-role"
            type="text"
            maxLength={50}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="merchant, guard, sage..."
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="npc-level" className={labelClass}>Level (optional)</label>
          <input
            id="npc-level"
            type="number"
            min={1}
            max={30}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="1-30"
            className={inputClass}
          />
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!description.trim() || generateNPC.isPending}
        className="shadow-glow"
      >
        {generateNPC.isPending ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate NPC'
        )}
      </Button>

      {generateNPC.isError && (
        <p className="text-sm text-destructive">
          {(generateNPC.error as Error).message || 'Generation failed'}
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-md border border-border bg-background/40 p-4 texture-leather">
          <div className="flex items-start justify-between">
            <h4 className="font-['IM_Fell_English'] text-lg text-card-foreground">{result.name}</h4>
            <span className="rounded-md bg-brass/20 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-brass">
              {result.role}
            </span>
          </div>

          {result.appearance && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Appearance</p>
              <p className="mt-0.5 text-sm text-foreground">{result.appearance}</p>
            </div>
          )}

          {result.personality && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Personality</p>
              <p className="mt-0.5 text-sm text-foreground">{result.personality}</p>
            </div>
          )}

          {result.statBlock && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Stats</p>
              <pre className="mt-0.5 whitespace-pre-wrap rounded bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                {result.statBlock}
              </pre>
            </div>
          )}

          {result.plotHooks && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Plot Hooks</p>
              <p className="mt-0.5 text-sm italic text-muted-foreground">{result.plotHooks}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToCampaign}
              disabled={saved || createEntity.isPending}
            >
              {createEntity.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              )}
              {saved ? 'Added' : 'Add to Campaign'}
            </Button>
          </div>

          {result._meta && <GenerationMeta meta={result._meta} />}
        </div>
      )}
    </div>
  );
}
