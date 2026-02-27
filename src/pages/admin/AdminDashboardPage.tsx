import { Users, CreditCard, MessageSquare, Bug, Lightbulb, TrendingUp, Loader2 } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useOverviewStats } from '@/hooks/useAdmin';

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useOverviewStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading dashboard...
        </div>
      </AdminLayout>
    );
  }

  const openFeedback =
    (stats?.feedback.byStatus.new ?? 0) +
    (stats?.feedback.byStatus.in_review ?? 0) +
    (stats?.feedback.byStatus.in_progress ?? 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {renderStatCard('Total Users', stats?.users.total ?? 0, Users, 'text-blue-400')}
          {renderStatCard('Active Subscriptions', stats?.users.activeSubscriptions ?? 0, CreditCard, 'text-green-400')}
          {renderStatCard('New Feedback (7d)', stats?.feedback.newLast7d ?? 0, MessageSquare, 'text-yellow-400')}
          {renderStatCard('Open Issues', openFeedback, Bug, 'text-red-400')}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Growth */}
          <div className="rounded-lg border border-border/50 bg-card/40 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              User Growth
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New users (7 days)</span>
                <span className="font-medium text-foreground">{stats?.users.newLast7d ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New users (30 days)</span>
                <span className="font-medium text-foreground">{stats?.users.newLast30d ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total users</span>
                <span className="font-medium text-foreground">{stats?.users.total ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Feedback Breakdown */}
          <div className="rounded-lg border border-border/50 bg-card/40 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Feedback Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Bug className="h-3.5 w-3.5" /> Bug Reports
                </span>
                <span className="font-medium text-foreground">{stats?.feedback.byType.bug ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5" /> Feature Requests
                </span>
                <span className="font-medium text-foreground">{stats?.feedback.byType.feature ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" /> General
                </span>
                <span className="font-medium text-foreground">{stats?.feedback.byType.general ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );

  function renderStatCard(label: string, value: number, Icon: typeof Users, iconColor: string) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      </div>
    );
  }
}
