import { Loader2, Radio, AlertTriangle, Users, Swords } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useActiveSessions } from '@/hooks/useAdmin';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';

export function AdminSessionsPage() {
  const { data: sessions, isLoading } = useActiveSessions();
  const { openTab } = useTabs();

  function handleOpenSession(campaignId: string) {
    const path = `/app/admin/sessions/${campaignId}`;
    openTab({
      title: `Session: ${campaignId.slice(-6)}`,
      path,
      content: resolveRouteContent(path, `Session: ${campaignId.slice(-6)}`),
    });
  }

  return (
    <AdminLayout activePath="/app/admin/sessions">
      <div className="space-y-4">
        {renderHeader()}
        {renderContent()}
      </div>
    </AdminLayout>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
          <p className="text-sm text-muted-foreground">
            Live WebSocket sessions with connected users. Auto-refreshes every 15s.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {sessions?.length ?? 0} active
        </span>
      </div>
    );
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading...
        </div>
      );
    }

    if (!sessions?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Radio className="mb-2 h-8 w-8" />
          <p>No active sessions</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-card/60">
              <th className="px-4 py-3 font-medium text-muted-foreground">Campaign</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Users</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">DM</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Events</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Errors (15m)</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => renderRow(session))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderRow(session: NonNullable<typeof sessions>[number]) {
    return (
      <tr
        key={session.campaignId}
        onClick={() => handleOpenSession(session.campaignId)}
        className="border-b border-border/30 bg-card/20 cursor-pointer transition-colors hover:bg-card/40"
      >
        <td className="px-4 py-3 font-mono text-xs text-foreground">
          {session.campaignId.slice(-12)}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {session.connectedUsers}
          </span>
        </td>
        <td className="px-4 py-3">
          {session.dmConnected ? (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              Connected
            </span>
          ) : (
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
              Absent
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {session.sessionActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              <Swords className="h-3 w-3" /> Active
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Idle</span>
          )}
        </td>
        <td className="px-4 py-3 text-muted-foreground">{session.recentEventCount}</td>
        <td className="px-4 py-3">
          {renderErrorBadge(session.errors15m)}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {session.lastActivityAt
            ? new Date(session.lastActivityAt).toLocaleTimeString()
            : '—'}
        </td>
      </tr>
    );
  }

  function renderErrorBadge(count: number) {
    if (count === 0) {
      return <span className="text-xs text-muted-foreground">0</span>;
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
        <AlertTriangle className="h-3 w-3" />
        {count}
      </span>
    );
  }
}
