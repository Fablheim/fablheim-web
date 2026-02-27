import { useState } from 'react';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/Button';
import { useReconciliationReport, useFixReconciliation } from '@/hooks/useAdmin';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';
import type { ReconciliationDiscrepancy } from '@/api/admin';

const SEVERITY_CLASSES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  info: 'bg-blue-500/20 text-blue-400',
};

export function AdminReconcilePage({ userId }: { userId: string }) {
  const { data: report, isLoading } = useReconciliationReport(userId);
  const fixMutation = useFixReconciliation();
  const { openTab } = useTabs();
  const [showFixConfirm, setShowFixConfirm] = useState(false);

  function goBack() {
    const path = '/app/admin/billing';
    openTab({ title: 'Admin: Billing', path, content: resolveRouteContent(path, 'Admin: Billing') });
  }

  function handleFix() {
    fixMutation.mutate(userId, {
      onSuccess: (result) => {
        setShowFixConfirm(false);
        if (result.fixed.length > 0) toast.success(`Fixed ${result.fixed.length} issue(s)`);
        if (result.errors.length > 0) toast.error(`${result.errors.length} error(s) during fix`);
      },
      onError: () => toast.error('Failed to apply fixes'),
    });
  }

  if (isLoading || !report) {
    return (
      <AdminLayout activePath="/app/admin/billing">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading reconciliation report...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePath="/app/admin/billing">
      <div className="mx-auto max-w-3xl space-y-6">
        {renderBackButton()}
        {renderUserHeader()}
        {renderComparison()}
        {renderCreditStatus()}
        {renderDiscrepancies()}
        {renderFixControls()}
        {renderFixResults()}
      </div>
    </AdminLayout>
  );

  function renderBackButton() {
    return (
      <button
        type="button"
        onClick={goBack}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Billing
      </button>
    );
  }

  function renderUserHeader() {
    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-5">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Reconcile: {report!.username}
            </h2>
            <p className="text-sm text-muted-foreground">{report!.email}</p>
          </div>
          {report!.discrepancies.length === 0 ? (
            <span className="ml-auto shrink-0 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
              In Sync
            </span>
          ) : (
            <span className="ml-auto shrink-0 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
              {report!.discrepancies.length} Issue(s)
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderComparison() {
    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Entitlement Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="pb-2 text-left font-medium text-muted-foreground">Field</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Stripe</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Database</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Match</th>
              </tr>
            </thead>
            <tbody>
              {renderComparisonRow(
                'Tier',
                report!.stripe?.tier ?? 'n/a',
                report!.db.subscriptionTier,
              )}
              {renderComparisonRow(
                'Status',
                report!.stripe?.status ?? 'n/a',
                report!.db.subscriptionStatus,
              )}
              {renderComparisonRow(
                'Subscription ID',
                report!.stripe?.subscriptionId ?? 'none',
                report!.db.stripeSubscriptionId ?? 'none',
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderComparisonRow(label: string, stripeVal: string, dbVal: string) {
    const match = stripeVal === dbVal || stripeVal === 'n/a';
    return (
      <tr className="border-b border-border/20">
        <td className="py-2 font-medium text-foreground">{label}</td>
        <td className="py-2 text-muted-foreground">{stripeVal}</td>
        <td className={`py-2 ${!match ? 'font-medium text-red-400' : 'text-muted-foreground'}`}>{dbVal}</td>
        <td className="py-2">
          {match ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
        </td>
      </tr>
    );
  }

  function renderCreditStatus() {
    const c = report!.credits;
    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Credit Status</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Ledger Entries</p>
            <p className="text-lg font-bold text-foreground">{c.ledgerEntries}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Batches</p>
            <p className="text-lg font-bold text-foreground">{c.activeCreditBatches}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Balance</p>
            <p className="text-lg font-bold text-foreground">{c.totalCreditBalance}</p>
          </div>
        </div>
        {c.missingBatches.length > 0 && (
          <div className="mt-4 rounded-md bg-yellow-500/10 p-3">
            <p className="text-xs font-medium text-yellow-400">
              {c.missingBatches.length} ledger entry(ies) with missing/depleted credit batches:
            </p>
            <ul className="mt-1 space-y-0.5">
              {c.missingBatches.map((key) => (
                <li key={key} className="font-mono text-xs text-yellow-300/80">{key}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  function renderDiscrepancies() {
    if (report!.discrepancies.length === 0) return null;
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          Discrepancies Found
        </h3>
        <div className="space-y-2">
          {report!.discrepancies.map((d: ReconciliationDiscrepancy) => (
            <div key={d.field} className="flex items-center gap-3 text-sm">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASSES[d.severity] ?? ''}`}>
                {d.severity}
              </span>
              <span className="text-foreground">
                <strong>{d.field}</strong>: expected <code className="text-green-400">{d.expected}</code>, found <code className="text-red-400">{d.actual}</code>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderFixControls() {
    if (!report!.canAutoFix) return null;
    return (
      <div className="flex justify-end gap-2">
        {!showFixConfirm ? (
          <Button variant="destructive" onClick={() => setShowFixConfirm(true)}>
            Fix Discrepancies
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setShowFixConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFix}
              disabled={fixMutation.isPending}
            >
              {fixMutation.isPending ? 'Fixing...' : 'Confirm Fix'}
            </Button>
          </>
        )}
      </div>
    );
  }

  function renderFixResults() {
    if (!fixMutation.data) return null;
    const { fixed, errors } = fixMutation.data;
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Fix Results</h3>
        {fixed.map((f) => (
          <p key={f} className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" /> {f}
          </p>
        ))}
        {errors.map((e) => (
          <p key={e} className="flex items-center gap-2 text-sm text-red-400">
            <XCircle className="h-3.5 w-3.5 shrink-0" /> {e}
          </p>
        ))}
      </div>
    );
  }
}
