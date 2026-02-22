import { useState, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function ToolCard({ title, description, icon: Icon, children, defaultOpen }: ToolCardProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="rounded-lg border border-border bg-card tavern-card texture-parchment overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary shadow-glow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-[Cinzel] text-sm font-semibold tracking-wider text-card-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
