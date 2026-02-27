import { useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Users,
  Swords,
  Map,
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from './AdminLayout';
import {
  useSessionHealth,
  useSessionEvents,
  useResyncSession,
} from '@/hooks/useAdmin';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';
import type { SampledEvent } from '@/api/admin';

const EVENT_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'join-session', label: 'Join' },
  { value: 'leave-session', label: 'Leave' },
  { value: 'chat:message', label: 'Chat' },
  { value: 'dice-rolled', label: 'Dice' },
  { value: 'initiative-updated', label: 'Initiative' },
  { value: 'map-updated', label: 'Map' },
  { value: 'admin:resync', label: 'Resync' },
];

export function AdminSessionDetailPage({
  sessionId,
}: {
  sessionId: string;
}) {
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [confirmResync, setConfirmResync] = useState(false);

  const { data: health, isLoading: healthLoading } =
    useSessionHealth(sessionId);
  const { data: events, isLoading: eventsLoading } =
    useSessionEvents(sessionId, eventTypeFilter || undefined);
  const resync = useResyncSession();
  const { openTab } = useTabs();

  function handleBackToSessions() {
    const path = '/app/admin/sessions';
    openTab({
      title: 'Admin: Sessions',
      path,
      content: resolveRouteContent(path, 'Admin: Sessions'),
    });
  }

  function handleResync() {
    resync.mutate(sessionId, {
      onSuccess: (data) => {
        toast.success(
          `Resync complete: initiative=${data.resynced.initiative}, map=${data.resynced.battleMap}`,
        );
        setConfirmResync(false);
      },
      onError: () => toast.error('Resync failed'),
    });
  }

  return (
    <AdminLayout activePath="/app/admin/sessions">
      <div className="space-y-6">
        {renderBackButton()}
        {renderHealthSection()}
        {renderEventsSection()}
      </div>
    </AdminLayout>
  );

  function renderBackButton() {
    return (
      <button
        type="button"
        onClick={handleBackToSessions}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sessions
      </button>
    );
  }

  function renderHealthSection() {
    if (healthLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading health...
        </div>
      );
    }

    if (!health) {
      return (
        <div className="rounded-lg border border-border/50 bg-card/20 p-6 text-center text-muted-foreground">
          Session not found or no data available.
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderHealthCard()}
        {renderInitiativeCard()}
        {renderBattleMapCard()}
        {renderResyncCard()}
      </div>
    );
  }

  function renderHealthCard() {
    if (!health) return null;
    return (
      <div className="rounded-lg border border-border/50 bg-card/20 p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Connection</h3>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold text-foreground">
            {health.connectedUsers}
          </span>
          <span className="text-sm text-muted-foreground">connected</span>
        </div>
        <div className="flex gap-2">
          {health.dmConnected ? (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              DM Online
            </span>
          ) : (
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
              DM Absent
            </span>
          )}
          {health.sessionActive ? (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              Active
            </span>
          ) : (
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Idle
            </span>
          )}
        </div>
        {renderErrorCounts()}
      </div>
    );
  }

  function renderErrorCounts() {
    if (!health) return null;
    const hasErrors = health.errors15m > 0 || health.errors60m > 0;

    return (
      <div className={`mt-2 flex gap-3 text-xs ${hasErrors ? 'text-red-400' : 'text-muted-foreground'}`}>
        {hasErrors && <AlertTriangle className="h-3.5 w-3.5" />}
        <span>15m: {health.errors15m}</span>
        <span>60m: {health.errors60m}</span>
      </div>
    );
  }

  function renderInitiativeCard() {
    if (!health) return null;
    return (
      <div className="rounded-lg border border-border/50 bg-card/20 p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Initiative</h3>
        {health.initiative ? (
          <>
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground">
                Round {health.initiative.round}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {health.initiative.entries} entries
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No active initiative</p>
        )}
      </div>
    );
  }

  function renderBattleMapCard() {
    if (!health) return null;
    return (
      <div className="rounded-lg border border-border/50 bg-card/20 p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Battle Map</h3>
        {health.battleMap ? (
          <>
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground">
                {health.battleMap.name || 'Untitled'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {health.battleMap.tokens} tokens
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No active map</p>
        )}
      </div>
    );
  }

  function renderResyncCard() {
    if (!health) return null;
    const disabled = health.connectedUsers === 0 || resync.isPending;

    return (
      <div className="rounded-lg border border-border/50 bg-card/20 p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
        {!confirmResync ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setConfirmResync(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Force Resync
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-yellow-400">
              This will rebroadcast authoritative state to all {health.connectedUsers} connected clients.
            </p>
            {renderResyncButtons(disabled)}
          </div>
        )}
        {disabled && health.connectedUsers === 0 && (
          <p className="text-xs text-muted-foreground">
            No connected users — resync disabled
          </p>
        )}
      </div>
    );
  }

  function renderResyncButtons(disabled: boolean) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={handleResync}
          className="flex-1 rounded-md bg-primary/20 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/30 disabled:opacity-50"
        >
          {resync.isPending ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            'Confirm'
          )}
        </button>
        <button
          type="button"
          onClick={() => setConfirmResync(false)}
          className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
        >
          Cancel
        </button>
      </div>
    );
  }

  function renderEventsSection() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Sampled Events
          </h3>
          {renderEventFilter()}
        </div>
        {renderEventsContent()}
      </div>
    );
  }

  function renderEventFilter() {
    return (
      <select
        value={eventTypeFilter}
        onChange={(e) => setEventTypeFilter(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {EVENT_TYPE_FILTER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  function renderEventsContent() {
    if (eventsLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading events...
        </div>
      );
    }

    if (!events?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Radio className="mb-2 h-8 w-8" />
          <p>No events recorded yet</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-card/60">
              <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Event</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Actor</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Visibility</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Payload</th>
            </tr>
          </thead>
          <tbody>
            {[...events].reverse().map((evt, i) => renderEventRow(evt, i))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderEventRow(evt: SampledEvent, index: number) {
    return (
      <tr
        key={`${evt.ts}-${index}`}
        className="border-b border-border/30 bg-card/20 transition-colors hover:bg-card/40"
      >
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
          {new Date(evt.ts).toLocaleTimeString()}
        </td>
        <td className="px-4 py-3 font-medium text-foreground">
          {evt.eventType}
        </td>
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
          {evt.actorUserId ? evt.actorUserId.slice(-8) : '—'}
        </td>
        <td className="px-4 py-3">
          {renderVisibilityBadge(evt.visibility)}
        </td>
        <td className="px-4 py-3">
          {evt.success ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          )}
        </td>
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-xs truncate">
          {JSON.stringify(evt.payloadSummary)}
        </td>
      </tr>
    );
  }

  function renderVisibilityBadge(
    visibility: 'public' | 'private' | 'dm-only',
  ) {
    switch (visibility) {
      case 'public':
        return (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
            public
          </span>
        );
      case 'private':
        return (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
            private
          </span>
        );
      case 'dm-only':
        return (
          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
            dm-only
          </span>
        );
    }
  }
}
