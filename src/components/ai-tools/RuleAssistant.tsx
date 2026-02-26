import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAskRule, useRecentRules } from '@/hooks/useAITools';
import { GenerationMeta } from './GenerationMeta';
import type { RuleAnswer } from '@/types/ai-tools';

interface RuleAssistantProps {
  campaignId: string;
}

const QUICK_QUESTIONS = [
  'How does grappling work?',
  'What are the rules for concentration?',
  'How does flanking work?',
  'How do opportunity attacks work?',
  'What is the help action?',
  'How does cover work?',
];

export function RuleAssistant({ campaignId }: RuleAssistantProps) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<RuleAnswer | null>(null);

  const askRule = useAskRule();
  const { data: recentRules } = useRecentRules(campaignId);

  async function handleAsk(q?: string) {
    const text = q ?? question;
    if (!text.trim()) return;
    setResult(null);

    const data = await askRule.mutateAsync({
      campaignId,
      question: text.trim(),
    });
    setResult(data);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
            placeholder="How does grappling work?"
            maxLength={500}
            className="block w-full rounded-sm border border-input bg-input py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]"
          />
        </div>
        <Button
          onClick={() => handleAsk()}
          disabled={!question.trim() || askRule.isPending}
          className="shadow-glow"
        >
          {askRule.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Ask'
          )}
        </Button>
      </div>

      {/* Quick questions */}
      <div>
        <p className="mb-2 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Quick Rulings
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => { setQuestion(q); handleAsk(q); }}
              disabled={askRule.isPending}
              className="rounded-md bg-background/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {askRule.isError && (
        <p className="text-sm text-destructive">
          {(askRule.error as Error).message || 'Lookup failed'}
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-md border border-border bg-background/40 p-4 texture-leather">
          <div>
            <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Answer</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{result.answer}</p>
          </div>

          {result.relevantRules.length > 0 && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Relevant Rules</p>
              <ul className="mt-1 space-y-1">
                {result.relevantRules.map((rule, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    <span className="mr-1 text-primary/70">-</span> {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.citations.length > 0 && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">References</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {result.citations.map((cite, i) => (
                  <span key={i} className="rounded bg-arcane/10 px-2 py-0.5 text-[10px] text-arcane">
                    {cite}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.dmAdvice && (
            <div>
              <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">GM Advice</p>
              <p className="mt-0.5 text-sm italic text-muted-foreground">{result.dmAdvice}</p>
            </div>
          )}

          {result._meta && <GenerationMeta meta={result._meta} />}
        </div>
      )}

      {/* Recent questions */}
      {recentRules && recentRules.length > 0 && !result && (
        <div>
          <p className="mb-2 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Recent Questions
          </p>
          <div className="space-y-2">
            {recentRules.slice(0, 5).map((r) => (
              <button
                key={r._id}
                type="button"
                onClick={() => { setQuestion(r.question); handleAsk(r.question); }}
                className="block w-full rounded bg-background/30 px-3 py-2 text-left transition-colors hover:bg-muted/40"
              >
                <p className="text-sm text-foreground">{r.question}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.answer}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
