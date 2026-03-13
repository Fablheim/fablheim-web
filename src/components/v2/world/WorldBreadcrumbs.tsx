import { ChevronRight, Home } from 'lucide-react';
import type { WorldNavigation } from './WorldCenterStage';

export interface Crumb {
  id: string;
  label: string;
}

interface WorldBreadcrumbsProps {
  crumbs: Crumb[];
  nav: WorldNavigation;
}

export function WorldBreadcrumbs({ crumbs, nav }: WorldBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-[11px] text-[hsl(30,12%,58%)]">
      <button
        type="button"
        onClick={nav.goHome}
        className="flex items-center gap-0.5 rounded px-1 py-0.5 hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
      >
        <Home className="h-3 w-3" />
        World
      </button>
      {crumbs.map((crumb) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 opacity-40" />
          <button
            type="button"
            onClick={() => nav.goToHierarchy(crumb.id)}
            className="rounded px-1 py-0.5 hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
          >
            {crumb.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
