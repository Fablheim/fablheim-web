import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface StreamingOutputProps {
  text: string;
  isStreaming: boolean;
  error: string | null;
  /** Optional label shown above the output */
  label?: string;
}

export function StreamingOutput({ text, isStreaming, error, label }: StreamingOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as text streams in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  if (error) {
    return (
      <div className="rounded-lg border border-blood/30 bg-blood/5 p-4">
        <p className="text-sm text-[hsl(0,55%,55%)]">{error}</p>
      </div>
    );
  }

  if (!text && !isStreaming) return null;

  return (
    <div className="space-y-2">
      {label && (
        <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      <div
        ref={containerRef}
        className="max-h-[400px] overflow-y-auto rounded-lg border border-border bg-card/50 p-4 texture-parchment"
      >
        <div className="whitespace-pre-wrap font-['IM_Fell_English'] text-sm leading-relaxed text-foreground">
          {text}
          {isStreaming && (
            <span className="inline-flex items-center gap-1 ml-1">
              <Loader2 className="h-3 w-3 animate-spin text-brass" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
