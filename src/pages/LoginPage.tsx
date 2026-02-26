import { type FormEvent, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useAuth } from '../context/AuthContext';
import { isAxiosError } from 'axios';

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
    <div className="flex min-h-screen items-center justify-center bg-[hsl(24,22%,6%)] px-4 relative vignette grain-overlay">
      {/* Atmospheric torch glow backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,hsla(38,80%,50%,0.06)_0%,transparent_70%)]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,hsla(25,70%,40%,0.05)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,hsla(350,50%,30%,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="rounded-lg border border-gold/20 bg-card p-8 shadow-warm-lg tavern-card texture-parchment iron-brackets animate-unfurl relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-block font-[Cinzel] text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-gold transition-colors mb-4">
              Fablheim
            </Link>
            <h1 className="font-['IM_Fell_English'] text-3xl sm:text-4xl text-carved">Return, Adventurer</h1>
            <p className="mt-2 text-sm text-muted-foreground font-['IM_Fell_English'] italic">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:text-primary/80">
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {searchParams.get('session_expired') === 'true' && (
              <div className="rounded-sm border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
                Your session has expired. Please log in again.
              </div>
            )}
            {error && (
              <div className="rounded-sm border border-blood/30 bg-blood/10 p-3 text-sm text-[hsl(0,55%,55%)]">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full input-carved rounded-sm text-sm border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                  Password
                </label>
                <Link to="/forgot-password" className="font-[Cinzel] text-[10px] uppercase tracking-wider text-primary hover:text-primary/80">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full input-carved rounded-sm text-sm border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
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
              className="w-full btn-emboss font-[Cinzel] uppercase tracking-widest rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-glow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Enter'}
            </button>
          </form>

          <div className="relative">
            <div className="divider-ornate" />
            <div className="relative flex justify-center text-sm -mt-3">
              <span className="bg-card px-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <a
            href={GOOGLE_AUTH_URL}
            className="flex w-full items-center justify-center gap-2 border border-gold/20 bg-card/80 hover:bg-accent hover:border-gold/40 hover:shadow-glow-sm rounded-sm font-[Cinzel] text-xs uppercase tracking-wider px-4 py-2 text-card-foreground shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </a>
        </div>
      </div>
    </div>
  );
}
