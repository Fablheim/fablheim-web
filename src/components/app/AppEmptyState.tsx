import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AppEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  reason: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function AppEmptyState({
  icon: Icon,
  title,
  reason,
  primaryAction,
  secondaryAction,
  className = '',
}: AppEmptyStateProps) {
  return (
    <div className={`app-empty-state rounded-lg p-10 text-center ${className}`}>
      <div className="mx-auto max-w-md">
        {Icon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-primary/10">
            <Icon className="h-6 w-6 text-primary/80" aria-hidden="true" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground font-['IM_Fell_English']">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
