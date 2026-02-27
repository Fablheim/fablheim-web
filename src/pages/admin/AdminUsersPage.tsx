import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Shield, ShieldOff, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from './AdminLayout';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useAdmin';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';

const TIER_OPTIONS = [
  { value: '', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'hobbyist', label: 'Hobbyist' },
  { value: 'pro', label: 'Game Master' },
  { value: 'professional', label: 'Pro' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  hobbyist: 'Hobbyist',
  pro: 'Game Master',
  professional: 'Pro',
};

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    tier: tierFilter || undefined,
    role: roleFilter || undefined,
    page,
    limit: 20,
  });

  const updateRole = useUpdateUserRole();
  const { openTab } = useTabs();
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  function handleToggleRole(userId: string, currentRole: 'user' | 'admin') {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateRole.mutate(
      { id: userId, role: newRole },
      {
        onSuccess: () => toast.success(`Role updated to ${newRole}`),
        onError: () => toast.error('Failed to update role'),
      },
    );
  }

  return (
    <AdminLayout activePath="/app/admin/users">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="rounded-md border border-border bg-background pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {renderSelect(TIER_OPTIONS, tierFilter, (v) => { setTierFilter(v); setPage(1); })}
          {renderSelect(ROLE_OPTIONS, roleFilter, (v) => { setRoleFilter(v); setPage(1); })}
          <span className="ml-auto self-center text-sm text-muted-foreground">
            {data?.total ?? 0} users
          </span>
        </div>

        {/* User Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading...
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="mb-2 h-8 w-8" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-card/60">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Username</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Tier</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user._id} className="border-b border-border/30 bg-card/20 transition-colors hover:bg-card/40">
                    <td className="px-4 py-3 font-medium text-foreground">{user.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {TIER_LABELS[user.subscriptionTier] ?? user.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'admin' ? (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">Admin</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleRole(user._id, user.role)}
                          disabled={updateRole.isPending}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                          title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        >
                          {user.role === 'admin' ? (
                            <><ShieldOff className="h-3.5 w-3.5" /> Remove Admin</>
                          ) : (
                            <><Shield className="h-3.5 w-3.5" /> Make Admin</>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const path = `/app/admin/billing/reconcile/${user._id}`;
                            openTab({ title: `Reconcile: ${user.username}`, path, content: resolveRouteContent(path, `Reconcile: ${user.username}`) });
                          }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                          title="Reconcile entitlements with Stripe"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Reconcile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
