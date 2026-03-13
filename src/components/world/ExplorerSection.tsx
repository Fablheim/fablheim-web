import type { LucideIcon } from 'lucide-react';

interface ExplorerSectionProps {
  title: string;
  icon: LucideIcon;
  count: number;
  children: React.ReactNode;
}

export function ExplorerSection({
  title,
  icon: Icon,
  count,
  children,
}: ExplorerSectionProps) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="font-[Cinzel] text-[11px] uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
