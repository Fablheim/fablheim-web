import { api } from './client';
import type { FeedbackItem } from './feedback';

export interface AdminFeedbackFilters {
  status?: string;
  type?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface FeedbackStats {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  total: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  provider: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserFilters {
  search?: string;
  tier?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface UserStats {
  byTier: Record<string, number>;
  byRole: Record<string, number>;
  total: number;
  newLast30d: number;
}

export interface OverviewStats {
  users: {
    total: number;
    newLast7d: number;
    newLast30d: number;
    activeSubscriptions: number;
  };
  feedback: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    newLast7d: number;
  };
}

export interface UpdateFeedbackDto {
  status?: string;
  priority?: string;
  adminNotes?: string;
  assignedTo?: string;
}

// ── Billing Types ──────────────────────────────────────────────

export interface WebhookEvent {
  _id: string;
  eventId: string;
  type: string;
  livemode: boolean;
  processedAt: string;
  createdAt: string;
}

export interface WebhookEventFilters {
  type?: string;
  page?: number;
  limit?: number;
}

export interface LedgerEntry {
  _id: string;
  userId: { _id: string; username: string; email: string } | string;
  idempotencyKey: string;
  amount: number;
  source: string;
  creditBalanceId?: string;
  createdAt: string;
}

export interface LedgerFilters {
  userId?: string;
  page?: number;
  limit?: number;
}

export interface ReconciliationDiscrepancy {
  field: string;
  expected: string;
  actual: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ReconciliationReport {
  userId: string;
  username: string;
  email: string;
  stripe: {
    subscriptionId: string | null;
    status: string | null;
    tier: string | null;
    currentPeriodEnd: string | null;
  } | null;
  db: {
    subscriptionTier: string;
    subscriptionStatus: string;
    stripeSubscriptionId: string | null;
  };
  credits: {
    ledgerEntries: number;
    activeCreditBatches: number;
    totalCreditBalance: number;
    missingBatches: string[];
  };
  discrepancies: ReconciliationDiscrepancy[];
  canAutoFix: boolean;
}

export interface FixResult {
  fixed: string[];
  errors: string[];
}

// ── Session Observability Types ───────────────────────────────

export interface ActiveSessionSummary {
  campaignId: string;
  connectedUsers: number;
  dmConnected: boolean;
  sessionActive: boolean;
  lastActivityAt: string | null;
  recentEventCount: number;
  errors15m: number;
}

export interface SampledEvent {
  ts: number;
  sessionId: string;
  campaignId: string;
  eventType: string;
  actorUserId: string | null;
  visibility: 'public' | 'private' | 'dm-only';
  payloadSummary: Record<string, unknown>;
  success: boolean;
}

export interface SessionHealthReport {
  campaignId: string;
  connectedUsers: number;
  dmConnected: boolean;
  sessionActive: boolean;
  errors15m: number;
  errors60m: number;
  lastActivityAt: string | null;
  initiative: { isActive: boolean; round: number; entries: number } | null;
  battleMap: { isActive: boolean; name: string; tokens: number } | null;
}

export interface ResyncResult {
  success: boolean;
  resynced: { initiative: boolean; battleMap: boolean };
  connectedUsers: number;
}

export const adminApi = {
  // Feedback
  getFeedback: (filters: AdminFeedbackFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return api
      .get<PaginatedResponse<FeedbackItem>>(`/admin/feedback?${params}`)
      .then((r) => r.data);
  },

  getFeedbackById: (id: string) =>
    api.get<FeedbackItem>(`/admin/feedback/${id}`).then((r) => r.data),

  updateFeedback: (id: string, dto: UpdateFeedbackDto) =>
    api.patch<FeedbackItem>(`/admin/feedback/${id}`, dto).then((r) => r.data),

  getFeedbackStats: () =>
    api.get<FeedbackStats>('/admin/feedback/stats').then((r) => r.data),

  // Users
  getUsers: (filters: AdminUserFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.tier) params.set('tier', filters.tier);
    if (filters.role) params.set('role', filters.role);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return api
      .get<PaginatedResponse<AdminUser>>(`/admin/users?${params}`)
      .then((r) => r.data);
  },

  getUserById: (id: string) =>
    api.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data),

  updateUserRole: (id: string, role: 'user' | 'admin') =>
    api.patch<AdminUser>(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  getUserStats: () =>
    api.get<UserStats>('/admin/users/stats').then((r) => r.data),

  // Overview
  getOverviewStats: () =>
    api.get<OverviewStats>('/admin/stats').then((r) => r.data),

  // Billing
  getWebhookEvents: (filters: WebhookEventFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return api
      .get<PaginatedResponse<WebhookEvent>>(`/admin/billing/webhook-events?${params}`)
      .then((r) => r.data);
  },

  getCreditLedger: (filters: LedgerFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.userId) params.set('userId', filters.userId);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return api
      .get<PaginatedResponse<LedgerEntry>>(`/admin/billing/credit-ledger?${params}`)
      .then((r) => r.data);
  },

  getReconciliationReport: (userId: string) =>
    api.get<ReconciliationReport>(`/admin/billing/reconcile/${userId}`).then((r) => r.data),

  fixReconciliation: (userId: string) =>
    api.post<FixResult>(`/admin/billing/reconcile/${userId}/fix`).then((r) => r.data),

  // Sessions
  getActiveSessions: () =>
    api.get<ActiveSessionSummary[]>('/admin/sessions/active').then((r) => r.data),

  getSessionEvents: (sessionId: string, eventType?: string) => {
    const params = new URLSearchParams();
    if (eventType) params.set('eventType', eventType);
    return api
      .get<SampledEvent[]>(`/admin/sessions/${sessionId}/events?${params}`)
      .then((r) => r.data);
  },

  getSessionHealth: (sessionId: string) =>
    api.get<SessionHealthReport>(`/admin/sessions/${sessionId}/health`).then((r) => r.data),

  resyncSession: (sessionId: string) =>
    api.post<ResyncResult>(`/admin/sessions/${sessionId}/actions/resync`).then((r) => r.data),
};
