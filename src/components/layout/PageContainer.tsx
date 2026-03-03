import type { ReactNode } from 'react';
import { useIsInsidePanel } from '@/context/PanelContext';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageContainer({ children, title, subtitle, actions }: PageContainerProps) {
  const isPanel = useIsInsidePanel();

  if (isPanel) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-auto p-3">{children}</div>
      </div>
    );
  }

  return (
    <div className="app-page flex h-full flex-col bg-background">
      {(title || actions) && (
        <div className="app-page-header flex items-center justify-between px-6 py-5 texture-parchment">
          <div>
            {title && <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-['IM_Fell_English'] tracking-wide text-carved">{title}</h1>}
            {subtitle && <p className="mt-1 text-muted-foreground font-['IM_Fell_English'] text-base">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="app-page-content flex-1 overflow-auto p-6 texture-parchment">
        {children}
      </div>
    </div>
  );
}
