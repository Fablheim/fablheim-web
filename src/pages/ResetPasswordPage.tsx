import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import * as authApi from '@/api/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Invalid Reset Link</h1>
          <p className="text-muted-foreground">
            This password reset link is missing or invalid.
          </p>
          <Link to="/forgot-password" className="inline-block text-sm font-medium text-primary hover:text-primary/80">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Password Reset</h1>
          <p className="text-muted-foreground">Your password has been reset successfully.</p>
          <Link to="/login" className="inline-block text-sm font-medium text-primary hover:text-primary/80">
            Sign in with your new password
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.confirmPasswordReset(token!, newPassword);
      setSuccess(true);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Failed to reset password');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Set New Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
              {error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') ? (
                <Link
                  to="/forgot-password"
                  className="ml-1 font-medium text-primary hover:text-primary/80"
                >
                  Request a new link
                </Link>
              ) : null}
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">Must be 8-128 characters</p>
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-foreground">
              Confirm New Password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
