import axios from 'axios';
import * as Sentry from '@sentry/react';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000'),
  withCredentials: true,
});

// --- 401 Session Expiry Interceptor ---

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/logout', '/auth/forgot-password', '/auth/reset-password'];
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/auth'];

let _sessionExpiredHandler: (() => void) | null = null;
let _isRedirecting = false;

export function registerSessionExpiredHandler(handler: () => void) {
  _sessionExpiredHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tag Sentry with correlation ID from backend
    if (axios.isAxiosError(error)) {
      const correlationId = error.response?.headers?.['x-request-id'];
      if (correlationId) {
        Sentry.setTag('correlationId', correlationId);
      }
    }

    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !AUTH_ENDPOINTS.some((ep) => error.config?.url?.startsWith(ep)) &&
      !PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p)) &&
      !_isRedirecting
    ) {
      _isRedirecting = true;
      _sessionExpiredHandler?.();
      window.location.href = '/login?session_expired=true';
    }
    return Promise.reject(error);
  },
);
