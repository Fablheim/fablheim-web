import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageContainer({ children, title, subtitle, actions }: PageContainerProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      {(title || actions) && (
        <div className="flex items-center justify-between border-b-2 border-[hsla(38,50%,40%,0.2)] p-6 texture-parchment bg-card/30 shadow-[0_1px_0_hsla(38,60%,50%,0.1)]">
          <div>
            {title && <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-['IM_Fell_English'] tracking-wide text-carved">{title}</h1>}
            {subtitle && <p className="mt-1 text-muted-foreground font-['IM_Fell_English'] italic text-base">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 texture-parchment">
        {children}
      </div>
    </div>
  );
}
