import { type FormEvent, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { Check, Eye, EyeOff, Flame, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAxiosError } from 'axios';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';

const GOOGLE_AUTH_URL = 'http://localhost:3000/auth/google';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/app';
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password, turnstileToken);
      navigate(redirectTo);
    } catch (err) {
      turnstileRef.current?.reset();
      setTurnstileToken(undefined);
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Login failed');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MarketingPage>
      <MarketingNavbar
        user={user}
        links={[
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <main className="relative flex min-h-[calc(100vh-5rem)] items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,hsla(38,80%,50%,0.06)_0%,transparent_70%)]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,hsla(25,70%,40%,0.05)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          {renderFormCard()}
          {renderSidebar()}
        </div>
      </main>

      <MarketingFooter />
    </MarketingPage>
  );

  function renderFormCard() {
    return (
      <div className="mkt-card mkt-card-mounted iron-brackets texture-parchment rounded-xl p-8 sm:p-10 animate-unfurl">
        <div className="mx-auto max-w-md space-y-7">
          {renderHeader()}
          {renderForm()}
          {renderOAuth()}
        </div>
      </div>
    );
  }

  function renderHeader() {
    return (
      <div className="text-center">
        <Link
          to="/"
          className="mb-4 inline-block font-[Cinzel] text-xs uppercase tracking-[0.3em] text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-accent)]"
        >
          Fablheim
        </Link>
        <h1 className="font-['IM_Fell_English'] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
          Return to the Hall
        </h1>
        <p className="mt-2 font-['IM_Fell_English'] text-sm italic text-[color:var(--mkt-muted)]">
          Your campaigns are waiting.{' '}
          <Link to="/register" className="text-[color:var(--mkt-accent)] hover:underline">
            New here? Create an account
          </Link>
        </p>
      </div>
    );
  }

  function renderForm() {
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {searchParams.get('session_expired') === 'true' && (
          <div className="rounded-sm border border-[color:var(--mkt-accent)]/30 bg-[color:var(--mkt-accent)]/10 p-3 text-sm text-[color:var(--mkt-accent)]">
            Your session has expired. Please sign in again.
          </div>
        )}
        {error && (
          <div className="rounded-sm border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">{error}</div>
        )}

        <div>
          <label htmlFor="email" className="block font-[Cinzel] text-xs uppercase tracking-wider text-[color:var(--mkt-text)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="mkt-input input-carved mt-1 block w-full rounded-sm border px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block font-[Cinzel] text-xs uppercase tracking-wider text-[color:var(--mkt-text)]">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="font-[Cinzel] text-[10px] uppercase tracking-wider text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-accent)]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          className="btn-emboss w-full rounded-sm shimmer-gold bg-primary px-4 py-2.5 font-[Cinzel] text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-glow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--mkt-accent)] focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Opening the gates...' : 'Enter the Hall'}
        </button>
      </form>
    );
  }

  function renderOAuth() {
    return (
      <>
        <div className="relative">
          <div className="divider-ornate" />
          <div className="relative -mt-3 flex justify-center text-sm">
            <span className="bg-[color:var(--mkt-surface-2)] px-3 font-[Cinzel] text-[10px] uppercase tracking-wider text-[color:var(--mkt-muted)]">
              Or continue with
            </span>
          </div>
        </div>

        <a
          href={GOOGLE_AUTH_URL}
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-[color:var(--mkt-border)] bg-black/20 px-4 py-2.5 font-[Cinzel] text-xs uppercase tracking-wider text-[color:var(--mkt-text)] shadow-sm transition-colors hover:border-[color:var(--mkt-accent)]/40 hover:bg-black/30 hover:shadow-glow-sm"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </a>

        <p className="text-center text-[11px] text-[color:var(--mkt-muted)]/70">
          <ShieldCheck className="mr-1 inline h-3 w-3" />
          Your credentials are encrypted and never shared.
        </p>
      </>
    );
  }

  function renderSidebar() {
    return (
      <aside className="hidden space-y-4 lg:block">
        <article className="mkt-card mkt-card-mounted rounded-xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
            Welcome back
          </p>
          <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[color:var(--mkt-success)]" />
              Your campaigns remember everything
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[color:var(--mkt-success)]" />
              AI tools at the ready
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[color:var(--mkt-success)]" />
              Pick up right where you left off
            </li>
          </ul>
        </article>

        <blockquote className="mkt-card rounded-xl p-5">
          <p className="text-sm leading-relaxed text-[color:var(--mkt-text)]">
            &ldquo;Fablheim finally replaced my Discord + docs + VTT shuffle. I prep less and run cleaner sessions.&rdquo;
          </p>
          <footer className="mt-3 text-xs text-[color:var(--mkt-muted)]">&mdash; Closed Beta GM</footer>
        </blockquote>

        <div className="flex items-center gap-2 rounded-xl border border-[color:var(--mkt-border)]/40 bg-black/10 px-4 py-3 text-xs text-[color:var(--mkt-muted)]">
          <Flame className="h-3.5 w-3.5 text-[color:var(--mkt-accent)]" />
          One hall. Every tool. Your story.
        </div>
      </aside>
    );
  }
}
