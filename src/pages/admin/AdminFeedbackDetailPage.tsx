import { useState, useEffect } from 'react';
import { Bug, Lightbulb, MessageSquare, Save, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/Button';
import { useAdminFeedbackById, useUpdateFeedback } from '@/hooks/useAdmin';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';

const STATUS_OPTIONS = ['new', 'in_review', 'planned', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

const TYPE_ICONS: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  general: MessageSquare,
};

export function AdminFeedbackDetailPage({ feedbackId }: { feedbackId: string }) {
  const { data: item, isLoading } = useAdminFeedbackById(feedbackId);
  const updateFeedback = useUpdateFeedback();
  const { openTab } = useTabs();

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setPriority(item.priority);
      setAdminNotes(item.adminNotes ?? '');
    }
  }, [item]);

  function handleSave() {
    updateFeedback.mutate(
      { id: feedbackId, dto: { status, priority, adminNotes } },
      {
        onSuccess: () => toast.success('Feedback updated'),
        onError: () => toast.error('Failed to update feedback'),
      },
    );
  }

  function goBack() {
    const path = '/app/admin/feedback';
    openTab({ title: 'Admin: Feedback', path, content: resolveRouteContent(path, 'Admin: Feedback') });
  }

  if (isLoading || !item) {
    return (
      <AdminLayout activePath="/app/admin/feedback">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading...
        </div>
      </AdminLayout>
    );
  }

  const TypeIcon = TYPE_ICONS[item.type] ?? MessageSquare;
  const user = typeof item.userId === 'object' ? item.userId : null;

  return (
    <AdminLayout activePath="/app/admin/feedback">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back button */}
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feedback
        </button>

        {/* Header */}
        <div className="rounded-lg border border-border/50 bg-card/40 p-5">
          <div className="flex items-start gap-3">
            <TypeIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                By {user?.username ?? 'Unknown'} ({user?.email ?? ''}) &middot;{' '}
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              {item.type}
            </span>
          </div>

          <div className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">{item.description}</div>

          {renderTypeFields()}
        </div>

        {/* Admin Controls */}
        <div className="rounded-lg border border-border/50 bg-card/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Admin Controls</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Admin Notes</label>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes about this feedback..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateFeedback.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateFeedback.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );

  function renderTypeFields() {
    if (item!.type === 'bug') {
      return (
        <div className="mt-4 space-y-3 border-t border-border/30 pt-4">
          {item!.stepsToReproduce && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Steps to Reproduce</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{item!.stepsToReproduce}</p>
            </div>
          )}
          {item!.expectedBehavior && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Expected Behavior</p>
              <p className="mt-1 text-sm text-foreground/90">{item!.expectedBehavior}</p>
            </div>
          )}
          {item!.actualBehavior && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Actual Behavior</p>
              <p className="mt-1 text-sm text-foreground/90">{item!.actualBehavior}</p>
            </div>
          )}
        </div>
      );
    }

    if (item!.type === 'feature' && item!.useCase) {
      return (
        <div className="mt-4 border-t border-border/30 pt-4">
          <p className="text-xs font-medium text-muted-foreground">Use Case</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{item!.useCase}</p>
        </div>
      );
    }

    return null;
  }
}
