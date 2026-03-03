import type { ReactNode } from 'react';
import { DashboardShell } from './DashboardShell';
import { useDashboardMode } from '@/hooks/useDashboardMode';
import { useIsWorkspaceRoute } from '@/hooks/useIsWorkspaceRoute';
import { useCreditUpdates } from '@/hooks/useCreditUpdates';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isSession } = useDashboardMode();
  const isWorkspace = useIsWorkspaceRoute();

  useCreditUpdates();

  if (isSession) return <>{children}</>;
  if (isWorkspace) return <main className="h-screen overflow-hidden bg-background">{children}</main>;
  return <DashboardShell>{children}</DashboardShell>;
}
