import axios from 'axios';
import * as Sentry from '@sentry/react';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000'),
  withCredentials: true,
  timeout: 15_000, // 15s default; override per-request via { timeout: ms }
});

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);
let csrfTokenCache: string | null = null;

const csrfBootstrapClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000'),
  withCredentials: true,
});

function readCookie(name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(): Promise<string | null> {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  const cookieToken = readCookie(CSRF_COOKIE_NAME);
  if (cookieToken) {
    csrfTokenCache = cookieToken;
    return csrfTokenCache;
  }

  const { data } = await csrfBootstrapClient.get<{ csrfToken?: string }>('/auth/csrf-token');
  csrfTokenCache = data?.csrfToken ?? null;
  return csrfTokenCache;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!MUTATING_METHODS.has(method)) {
    return config;
  }

  const csrfToken = await ensureCsrfToken();

  if (csrfToken) {
    config.headers = config.headers ?? {};
    config.headers[CSRF_HEADER_NAME] = csrfToken;
  }

  return config;
});

// --- 401 Refresh Token Interceptor ---

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/logout', '/auth/forgot-password', '/auth/reset-password'];
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/auth', '/how-it-works', '/pricing', '/blog', '/roadmap', '/new-to-ttrpgs', '/systems', '/legal', '/srd', '/join', '/invites'];

let _sessionExpiredHandler: (() => void) | null = null;
let _isRedirecting = false;
let _isRefreshing = false;
let _refreshPromise: Promise<void> | null = null;

export function registerSessionExpiredHandler(handler: () => void) {
  _sessionExpiredHandler = handler;
}

api.interceptors.response.use(
  (response) => {
    const responseCsrfToken =
      typeof response.data?.csrfToken === 'string'
        ? response.data.csrfToken
        : null;

    if (responseCsrfToken) {
      csrfTokenCache = responseCsrfToken;
    }

    return response;
  },
  async (error) => {
    // Tag Sentry with correlation ID from backend
    if (axios.isAxiosError(error)) {
      const correlationId = error.response?.headers?.['x-request-id'];
      if (correlationId) {
        Sentry.setTag('correlationId', correlationId);
      }
    }

    const originalRequest = error.config;

    // Only attempt refresh on 401s that are NOT from auth endpoints themselves
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !AUTH_ENDPOINTS.some((ep) => originalRequest?.url?.startsWith(ep)) &&
      !originalRequest?.url?.startsWith('/auth/refresh') &&
      !originalRequest?._retry
    ) {
      // Mark so we don't retry infinitely
      originalRequest._retry = true;

      // If another request is already refreshing, wait for it
      if (_isRefreshing && _refreshPromise) {
        try {
          await _refreshPromise;
          return api(originalRequest);
        } catch {
          // Refresh failed, fall through to session expiry
        }
      }

      // Attempt to refresh the token pair
      _isRefreshing = true;
      _refreshPromise = api.post('/auth/refresh').then(
        () => {
          _isRefreshing = false;
          _refreshPromise = null;
        },
        (refreshError) => {
          _isRefreshing = false;
          _refreshPromise = null;
          throw refreshError;
        },
      );

      try {
        await _refreshPromise;
        // Retry the original request with fresh cookies
        return api(originalRequest);
      } catch {
        // Refresh also failed -- session is truly expired
      }
    }

    // Handle session expiry redirect
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !AUTH_ENDPOINTS.some((ep) => originalRequest?.url?.startsWith(ep)) &&
      window.location.pathname !== '/' &&
      !PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p)) &&
      !_isRedirecting
    ) {
      _isRedirecting = true;
      _sessionExpiredHandler?.();
      window.location.href = '/';
    }

    return Promise.reject(error);
  },
);
