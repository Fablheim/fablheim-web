import type { ReactNode } from 'react';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden bg-background">
      <DashboardNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
