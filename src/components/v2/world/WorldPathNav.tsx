import type { ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import type { Crumb } from './WorldBreadcrumbs';
import type { WorldNavigation } from './WorldCenterStage';

interface WorldPathNavProps {
  crumbs: Crumb[];
  currentLabel: string;
  nav: WorldNavigation;
  className?: string;
}

export function WorldPathNav({
  crumbs,
  currentLabel,
  nav,
  className = '',
}: WorldPathNavProps) {
  return (
    <div className={`flex flex-wrap items-center gap-1 text-[12px] ${className}`.trim()}>
      <PathButton label="World" icon={<Home className="h-3 w-3" />} onClick={nav.goHome} />
      {crumbs.map((crumb) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-[hsl(30,12%,50%)]" />
          <PathButton
            label={crumb.label}
            onClick={() => nav.goToHierarchy(crumb.id)}
          />
        </span>
      ))}
      <span className="flex items-center gap-1">
        <ChevronRight className="h-3 w-3 text-[hsl(30,12%,50%)]" />
        <span className="rounded-md border border-[hsla(38,60%,52%,0.24)] bg-[hsla(38,70%,46%,0.12)] px-2 py-0.5 text-[hsl(35,24%,92%)]">
          {currentLabel}
        </span>
      </span>
    </div>
  );
}

function PathButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[hsl(30,13%,66%)] transition-colors hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
    >
      {icon}
      {label}
    </button>
  );
}
