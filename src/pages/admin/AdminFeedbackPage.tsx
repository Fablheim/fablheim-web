import { useState } from 'react';
import { Bug, Lightbulb, MessageSquare, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useAdminFeedback } from '@/hooks/useAdmin';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';
import type { FeedbackItem } from '@/api/feedback';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'general', label: 'General' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_CLASSES: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  in_review: 'bg-yellow-500/20 text-yellow-400',
  planned: 'bg-purple-500/20 text-purple-400',
  in_progress: 'bg-orange-500/20 text-orange-400',
  resolved: 'bg-green-500/20 text-green-400',
  closed: 'bg-muted text-muted-foreground',
};

const PRIORITY_CLASSES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-muted text-muted-foreground',
};

const TYPE_ICONS: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  general: MessageSquare,
};

export function AdminFeedbackPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const { openTab } = useTabs();

  const { data, isLoading } = useAdminFeedback({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    priority: priorityFilter || undefined,
    page,
    limit: 20,
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  function openDetail(item: FeedbackItem) {
    const path = `/app/admin/feedback/${item._id}`;
    openTab({
      title: `Feedback: ${item.title}`,
      path,
      content: resolveRouteContent(path, item.title),
    });
  }

  return (
    <AdminLayout activePath="/app/admin/feedback">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {renderSelect(STATUS_OPTIONS, statusFilter, (v) => { setStatusFilter(v); setPage(1); })}
          {renderSelect(TYPE_OPTIONS, typeFilter, (v) => { setTypeFilter(v); setPage(1); })}
          {renderSelect(PRIORITY_OPTIONS, priorityFilter, (v) => { setPriorityFilter(v); setPage(1); })}
          <span className="ml-auto self-center text-sm text-muted-foreground">
            {data?.total ?? 0} items
          </span>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading...
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="mb-2 h-8 w-8" />
            <p>No feedback found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.items.map((item) => {
              const TypeIcon = TYPE_ICONS[item.type] ?? MessageSquare;
              const user = typeof item.userId === 'object' ? item.userId : null;
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => openDetail(item)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-3 text-left transition-colors hover:bg-card/60"
                >
                  <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.username ?? 'Unknown'} &middot; {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[item.priority] ?? ''}`}>
                    {item.priority}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[item.status] ?? ''}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );

  function renderSelect(
    options: { value: string; label: string }[],
    value: string,
    onChange: (v: string) => void,
  ) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
}
