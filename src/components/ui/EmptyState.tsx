import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
      <div className="mx-auto max-w-sm">
        {Icon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-primary/10">
            <Icon className="h-6 w-6 text-primary/70" />
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
          {title}
        </h3>
        {description && (
          <p className="mb-6 text-muted-foreground">{description}</p>
        )}
        {action}
      </div>
    </div>
  );
}
