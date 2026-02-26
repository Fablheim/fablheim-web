import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { GenerationMeta as GenerationMetaType } from '@/types/ai-tools';

interface GenerationMetaProps {
  meta: GenerationMetaType;
}

const MODEL_LABELS: Record<string, string> = {
  haiku: 'Claude 3.5 Haiku',
  sonnet: 'Claude Sonnet 4.5',
  opus: 'Claude Opus 4',
};

function formatTokens(count: number): string {
  if (count >= 1000) {
    return `~${(count / 1000).toFixed(1)}k`;
  }
  return `~${count}`;
}

export function GenerationMeta({ meta }: GenerationMetaProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <span className="font-[Cinzel] uppercase tracking-wider">
          Generation Details
        </span>
      </button>

      {open && (
        <div className="mt-1.5 rounded border border-border/40 bg-background/30 px-3 py-2 text-[11px] text-muted-foreground/70 space-y-0.5">
          <div className="flex justify-between">
            <span>Model</span>
            <span className="text-brass/70">
              {MODEL_LABELS[meta.model] ?? meta.model}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Context sent</span>
            <span>{formatTokens(meta.inputTokens)} tokens</span>
          </div>
          <div className="flex justify-between">
            <span>Response</span>
            <span>{formatTokens(meta.outputTokens)} tokens</span>
          </div>
          <div className="flex justify-between">
            <span>Credits used</span>
            <span className="text-brass/70">{meta.creditsConsumed}</span>
          </div>
        </div>
      )}
    </div>
  );
}
