import { useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useWebhookEvents, useCreditLedger } from '@/hooks/useAdmin';
import type { LedgerEntry } from '@/api/admin';

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'checkout.session.completed', label: 'Checkout Completed' },
  { value: 'customer.subscription.created', label: 'Subscription Created' },
  { value: 'customer.subscription.updated', label: 'Subscription Updated' },
  { value: 'customer.subscription.deleted', label: 'Subscription Deleted' },
  { value: 'invoice.payment_succeeded', label: 'Invoice Paid' },
  { value: 'invoice.payment_failed', label: 'Invoice Failed' },
];

export function AdminBillingPage() {
  const [view, setView] = useState<'webhooks' | 'ledger'>('webhooks');

  return (
    <AdminLayout activePath="/app/admin/billing">
      <div className="space-y-4">
        {/* Sub-nav toggle */}
        <div className="flex gap-1 rounded-md bg-card/30 p-1 w-fit">
          {renderToggle('webhooks', 'Webhook Events')}
          {renderToggle('ledger', 'Credit Ledger')}
        </div>

        {view === 'webhooks' ? <WebhookEventsTable /> : <CreditLedgerTable />}
      </div>
    </AdminLayout>
  );

  function renderToggle(value: 'webhooks' | 'ledger', label: string) {
    const active = view === value;
    return (
      <button
        type="button"
        onClick={() => setView(value)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          active
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        {label}
      </button>
    );
  }
}

function WebhookEventsTable() {
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useWebhookEvents({
    type: typeFilter || undefined,
    page,
    limit: 20,
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {renderSelect()}
        <span className="ml-auto self-center text-sm text-muted-foreground">
          {data?.total ?? 0} events
        </span>
      </div>

      {renderContent()}
      {renderPagination()}
    </div>
  );

  function renderSelect() {
    return (
      <select
        value={typeFilter}
        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {EVENT_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
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

    if (!data?.items.length) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="mb-2 h-8 w-8" />
          <p>No webhook events found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-card/60">
              <th className="px-4 py-3 font-medium text-muted-foreground">Event ID</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Mode</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Processed</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((evt) => (
              <tr key={evt._id} className="border-b border-border/30 bg-card/20 transition-colors hover:bg-card/40">
                <td className="px-4 py-3 font-mono text-xs text-foreground">
                  {evt.eventId.slice(-16)}
                </td>
                <td className="px-4 py-3 text-foreground">{evt.type}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    evt.livemode
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {evt.livemode ? 'live' : 'test'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(evt.processedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderPagination() {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 pt-2">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
}

function CreditLedgerTable() {
  const [userIdFilter, setUserIdFilter] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCreditLedger({
    userId: appliedFilter || undefined,
    page,
    limit: 20,
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  function applyFilter() {
    setAppliedFilter(userIdFilter.trim());
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by user ID..."
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyFilter(); }}
            onBlur={applyFilter}
            className="rounded-md border border-border bg-background pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="ml-auto self-center text-sm text-muted-foreground">
          {data?.total ?? 0} entries
        </span>
      </div>

      {renderContent()}
      {renderPagination()}
    </div>
  );

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading...
        </div>
      );
    }

    if (!data?.items.length) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="mb-2 h-8 w-8" />
          <p>No ledger entries found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-card/60">
              <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Idempotency Key</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Source</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((entry) => (
              <tr key={entry._id} className="border-b border-border/30 bg-card/20 transition-colors hover:bg-card/40">
                <td className="px-4 py-3">{renderUser(entry)}</td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{entry.idempotencyKey}</td>
                <td className="px-4 py-3 font-medium text-foreground">{entry.amount}</td>
                <td className="px-4 py-3 text-muted-foreground">{entry.source}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderUser(entry: LedgerEntry) {
    if (typeof entry.userId === 'object' && entry.userId) {
      return (
        <div>
          <p className="font-medium text-foreground">{entry.userId.username}</p>
          <p className="text-xs text-muted-foreground">{entry.userId.email}</p>
        </div>
      );
    }
    return <span className="text-muted-foreground">{String(entry.userId)}</span>;
  }

  function renderPagination() {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 pt-2">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
}
