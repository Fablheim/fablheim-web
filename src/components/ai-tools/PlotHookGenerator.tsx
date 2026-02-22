import { useState } from 'react';
import { Loader2, Copy, Check, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGeneratePlotHooks } from '@/hooks/useAITools';
import { useCreateWorldEntity } from '@/hooks/useWorldEntities';

interface PlotHookGeneratorProps {
  campaignId: string;
}

export function PlotHookGenerator({ campaignId }: PlotHookGeneratorProps) {
  const [themes, setThemes] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [hooks, setHooks] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());

  const generateHooks = useGeneratePlotHooks();
  const createEntity = useCreateWorldEntity();

  async function handleGenerate() {
    setHooks([]);
    setSavedIdx(new Set());

    const themeList = themes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const data = await generateHooks.mutateAsync({
      campaignId,
      count: 3,
      difficulty,
      themes: themeList.length > 0 ? themeList : undefined,
    });
    setHooks(data.hooks);
  }

  async function handleCopy(idx: number) {
    await navigator.clipboard.writeText(hooks[idx]);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  async function handleSave(idx: number) {
    const hook = hooks[idx];
    const title = hook.split('.')[0].slice(0, 100) || `Plot Hook ${idx + 1}`;

    await createEntity.mutateAsync({
      campaignId,
      data: {
        name: title,
        type: 'quest',
        description: hook,
        tags: ['ai-generated', 'plot-hook'],
        visibility: 'dm-only',
        typeData: {
          status: 'Available',
          objectives: hook,
        },
      },
    });
    setSavedIdx((prev) => new Set(prev).add(idx));
  }

  const inputClass =
    'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

  const labelClass =
    'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="hooks-themes" className={labelClass}>Themes (optional)</label>
          <input
            id="hooks-themes"
            type="text"
            value={themes}
            onChange={(e) => setThemes(e.target.value)}
            placeholder="betrayal, treasure, mystery..."
            className={inputClass}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">Comma-separated</p>
        </div>
        <div>
          <label htmlFor="hooks-diff" className={labelClass}>Difficulty</label>
          <select
            id="hooks-diff"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className={inputClass}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generateHooks.isPending}
        className="shadow-glow"
      >
        {generateHooks.isPending ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            Weaving Hooks...
          </>
        ) : (
          'Generate Plot Hooks'
        )}
      </Button>

      {generateHooks.isError && (
        <p className="text-sm text-destructive">
          {(generateHooks.error as Error).message || 'Generation failed'}
        </p>
      )}

      {/* Results */}
      {hooks.length > 0 && (
        <div className="space-y-3">
          {hooks.map((hook, idx) => (
            <div key={idx} className="rounded-md border border-border bg-background/40 p-4 texture-leather">
              <p className="text-sm leading-relaxed text-foreground">{hook}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleCopy(idx)}>
                  {copiedIdx === idx ? (
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
                  onClick={() => handleSave(idx)}
                  disabled={savedIdx.has(idx) || createEntity.isPending}
                >
                  <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                  {savedIdx.has(idx) ? 'Saved' : 'Save as Quest'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
