import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';
import { isAxiosError } from 'axios';
import * as authApi from '@/api/auth';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isExpiredOrInvalid = error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid');

  function renderShell(content: React.ReactNode) {
    return (
      <MarketingPage>
        <MarketingNavbar
          user={null}
          links={[
            { label: 'How It Works', to: '/how-it-works' },
            { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
            { label: 'Rules Library', to: '/srd' },
          ]}
        />

        <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,hsla(38,80%,50%,0.06)_0%,transparent_70%)]" />
            <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,hsla(25,70%,40%,0.05)_0%,transparent_70%)]" />
          </div>

          <div className="relative z-10 w-full max-w-md">
            {content}
          </div>
        </main>

        <MarketingFooter />
      </MarketingPage>
    );
  }

  if (!token) {
    return renderShell(renderInvalidLink());
  }

  if (success) {
    return renderShell(renderSuccess());
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

  return renderShell(renderForm());

  function renderInvalidLink() {
    return (
      <div className="mkt-card mkt-card-mounted iron-brackets texture-parchment rounded-xl p-8 sm:p-10 animate-unfurl text-center">
        <div className="space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10">
            <ShieldAlert className="h-7 w-7 text-red-300" />
          </div>

          <h1 className="font-['IM_Fell_English'] text-3xl text-[color:var(--mkt-text)]">
            Invalid Reset Link
          </h1>
          <p className="font-['IM_Fell_English'] text-sm italic leading-relaxed text-[color:var(--mkt-muted)]">
            This password reset link is missing or has expired. Request a fresh one below.
          </p>

          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1 font-[Cinzel] text-xs uppercase tracking-wider text-[color:var(--mkt-accent)] transition-colors hover:underline"
          >
            Request a new reset link
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  function renderSuccess() {
    return (
      <div className="mkt-card mkt-card-mounted iron-brackets texture-parchment rounded-xl p-8 sm:p-10 animate-unfurl text-center">
        <div className="space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--mkt-success)]/30 bg-[color:var(--mkt-success)]/10">
            <Check className="h-7 w-7 text-[color:var(--mkt-success)]" />
          </div>

          <h1 className="font-['IM_Fell_English'] text-3xl text-[color:var(--mkt-text)]">
            Key Reforged
          </h1>
          <p className="font-['IM_Fell_English'] text-sm italic leading-relaxed text-[color:var(--mkt-muted)]">
            Your passphrase has been reset. You may now return to the hall.
          </p>

          <Link
            to="/login"
            className="btn-emboss inline-flex items-center gap-2 rounded-sm shimmer-gold bg-primary px-6 py-2.5 font-[Cinzel] text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-glow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--mkt-accent)] focus:ring-offset-2"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  function renderForm() {
    return (
      <div className="mkt-card mkt-card-mounted iron-brackets texture-parchment rounded-xl p-8 sm:p-10 animate-unfurl">
        <div className="space-y-7">
          <div className="text-center">
            <Link
              to="/"
              className="mb-4 inline-block font-[Cinzel] text-xs uppercase tracking-[0.3em] text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-accent)]"
            >
              Fablheim
            </Link>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--mkt-border)] bg-black/20">
              <KeyRound className="h-7 w-7 text-[color:var(--mkt-accent)]" />
            </div>
            <h1 className="font-['IM_Fell_English'] text-3xl text-[color:var(--mkt-text)]">
              Forge a New Key
            </h1>
            <p className="mt-2 font-['IM_Fell_English'] text-sm italic text-[color:var(--mkt-muted)]">
              Choose a new passphrase for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-sm border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
                {error}
                {isExpiredOrInvalid && (
                  <Link
                    to="/forgot-password"
                    className="ml-1 font-medium text-[color:var(--mkt-accent)] hover:underline"
                  >
                    Request a new link
                  </Link>
                )}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block font-[Cinzel] text-xs uppercase tracking-wider text-[color:var(--mkt-text)]">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={128}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mkt-input input-carved block w-full rounded-sm border px-3 py-2.5 pr-10 text-sm"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-text)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 font-['IM_Fell_English'] text-xs italic text-[color:var(--mkt-muted)]">
                Must be 8&ndash;128 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block font-[Cinzel] text-xs uppercase tracking-wider text-[color:var(--mkt-text)]">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmNewPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mkt-input input-carved block w-full rounded-sm border px-3 py-2.5 pr-10 text-sm"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-text)]"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-emboss w-full rounded-sm shimmer-gold bg-primary px-4 py-2.5 font-[Cinzel] text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-glow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--mkt-accent)] focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Reforging...' : 'Reforge Passphrase'}
            </button>
          </form>

          <p className="text-center font-['IM_Fell_English'] text-sm italic text-[color:var(--mkt-muted)]">
            <Link to="/login" className="inline-flex items-center gap-1 text-[color:var(--mkt-accent)] hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    );
  }
}
