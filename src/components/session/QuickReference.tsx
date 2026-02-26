import { useState } from 'react';
import { Search, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { GenerationMeta } from '@/components/ai-tools/GenerationMeta';
import { aiToolsApi } from '@/api/ai-tools';
import type { RuleAnswer } from '@/types/ai-tools';

interface QuickReferenceProps {
  campaignId: string;
}

function RuleResult({ result }: { result: RuleAnswer }) {
  return (
    <div className="rounded-md border border-gold/20 bg-accent/20 texture-parchment p-3 space-y-2">
      <div className="text-sm text-foreground font-['IM_Fell_English'] whitespace-pre-wrap leading-relaxed">
        {result.answer}
      </div>

      {result.citations.length > 0 && (
        <div className="border-t border-gold/10 pt-2">
          <p className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
            Sources
          </p>
          <ul className="space-y-0.5">
            {result.citations.map((cite, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                <span>{cite}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.dmAdvice && (
        <div className="border-t border-gold/10 pt-2">
          <p className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
            DM Advice
          </p>
          <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic">
            {result.dmAdvice}
          </p>
        </div>
      )}

      {result._meta && <GenerationMeta meta={result._meta} />}
    </div>
  );
}

export function QuickReference({ campaignId }: QuickReferenceProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RuleAnswer[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const result = await aiToolsApi.askRule({
        campaignId,
        question: query.trim(),
      });
      setResults((prev) => [result, ...prev]);
      setQuery('');
    } catch {
      toast.error('Failed to look up rule');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase">
        Quick Reference
      </h3>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a rule question..."
            className="w-full input-carved rounded-sm border border-border bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-sm border border-primary/40 bg-primary/10 px-3 py-1.5 font-[Cinzel] text-xs text-primary hover:bg-primary/20 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        </button>
      </form>

      {results.length === 0 ? (
        <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic py-2">
          Ask about rules, conditions, spells, or mechanics — powered by AI.
        </p>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {results.map((result, i) => (
            <RuleResult key={i} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}
