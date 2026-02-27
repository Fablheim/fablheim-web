import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  type AdminFeedbackFilters,
  type AdminUserFilters,
  type UpdateFeedbackDto,
  type WebhookEventFilters,
  type LedgerFilters,
} from '@/api/admin';

// Feedback
export function useAdminFeedback(filters: AdminFeedbackFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'feedback', filters],
    queryFn: () => adminApi.getFeedback(filters),
  });
}

export function useAdminFeedbackById(id: string) {
  return useQuery({
    queryKey: ['admin', 'feedback', id],
    queryFn: () => adminApi.getFeedbackById(id),
    enabled: !!id,
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFeedbackDto }) =>
      adminApi.updateFeedback(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] });
    },
  });
}

export function useFeedbackStats() {
  return useQuery({
    queryKey: ['admin', 'feedback', 'stats'],
    queryFn: adminApi.getFeedbackStats,
  });
}

// Users
export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminApi.getUsers(filters),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// Overview
export function useOverviewStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getOverviewStats,
  });
}

// Billing
export function useWebhookEvents(filters: WebhookEventFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'billing', 'webhook-events', filters],
    queryFn: () => adminApi.getWebhookEvents(filters),
  });
}

export function useCreditLedger(filters: LedgerFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'billing', 'credit-ledger', filters],
    queryFn: () => adminApi.getCreditLedger(filters),
  });
}

export function useReconciliationReport(userId: string) {
  return useQuery({
    queryKey: ['admin', 'billing', 'reconcile', userId],
    queryFn: () => adminApi.getReconciliationReport(userId),
    enabled: !!userId,
  });
}

export function useFixReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.fixReconciliation(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'reconcile', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'credit-ledger'] });
    },
  });
}

// Sessions
export function useActiveSessions() {
  return useQuery({
    queryKey: ['admin', 'sessions', 'active'],
    queryFn: adminApi.getActiveSessions,
    refetchInterval: 15000,
  });
}

export function useSessionEvents(sessionId: string, eventType?: string) {
  return useQuery({
    queryKey: ['admin', 'sessions', sessionId, 'events', eventType],
    queryFn: () => adminApi.getSessionEvents(sessionId, eventType),
    enabled: !!sessionId,
    refetchInterval: 10000,
  });
}

export function useSessionHealth(sessionId: string) {
  return useQuery({
    queryKey: ['admin', 'sessions', sessionId, 'health'],
    queryFn: () => adminApi.getSessionHealth(sessionId),
    enabled: !!sessionId,
    refetchInterval: 10000,
  });
}

export function useResyncSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => adminApi.resyncSession(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions', 'active'] });
    },
  });
}
