import { type FormEvent, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useAuth } from '../context/AuthContext';
import { isAxiosError } from 'axios';

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register(username, email, password, turnstileToken);
      navigate('/app');
    } catch (err) {
      turnstileRef.current?.reset();
      setTurnstileToken(undefined);
      if (isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Registration failed');
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
            <h1 className="font-['IM_Fell_English'] text-3xl sm:text-4xl text-carved">Begin Your Journey</h1>
            <p className="mt-2 text-sm text-muted-foreground font-['IM_Fell_English'] italic">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-sm border border-blood/30 bg-blood/10 p-3 text-sm text-[hsl(0,55%,55%)]">{error}</div>
            )}

            <div>
              <label htmlFor="username" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                minLength={2}
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full input-carved rounded-sm text-sm border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

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
              <label htmlFor="password" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full input-carved rounded-sm text-sm border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="mt-1 font-['IM_Fell_English'] italic text-xs text-muted-foreground">Must be 8-128 characters</p>
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
              className="w-full btn-emboss font-[Cinzel] uppercase tracking-widest rounded-sm shimmer-gold bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-glow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Forging your path...' : 'Begin Your Quest'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
