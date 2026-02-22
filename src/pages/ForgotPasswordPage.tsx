import { type FormEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { isAxiosError } from 'axios';
import * as authApi from '@/api/auth';

export function ForgotPasswordPage() {
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.requestPasswordReset(email, turnstileToken);
      setSubmitted(true);
    } catch (err) {
      turnstileRef.current?.reset();
      setTurnstileToken(undefined);
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Something went wrong');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
          <p className="text-muted-foreground">
            If an account with that email exists, we've sent a password reset link. It expires in 1 hour.
          </p>
          <Link to="/login" className="inline-block text-sm font-medium text-primary hover:text-primary/80">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(undefined)}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
