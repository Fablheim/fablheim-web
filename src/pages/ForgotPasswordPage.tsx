import { type FormEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { isAxiosError } from 'axios';
import * as authApi from '@/api/auth';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';

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
          {submitted ? renderSuccess() : renderForm()}
        </div>
      </main>

      <MarketingFooter />
    </MarketingPage>
  );

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
            <h1 className="font-['IM_Fell_English'] text-3xl text-[color:var(--mkt-text)]">
              Lost Your Key?
            </h1>
            <p className="mt-2 font-['IM_Fell_English'] text-sm italic text-[color:var(--mkt-muted)]">
              Enter your email and we&rsquo;ll send a ward to reset it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              {isSubmitting ? 'Dispatching...' : 'Send Reset Ward'}
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

  function renderSuccess() {
    return (
      <div className="mkt-card mkt-card-mounted iron-brackets texture-parchment rounded-xl p-8 sm:p-10 animate-unfurl text-center">
        <div className="space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--mkt-border)] bg-black/20">
            <Mail className="h-7 w-7 text-[color:var(--mkt-accent)]" />
          </div>

          <h1 className="font-['IM_Fell_English'] text-3xl text-[color:var(--mkt-text)]">
            Check Your Scrolls
          </h1>
          <p className="font-['IM_Fell_English'] text-sm italic leading-relaxed text-[color:var(--mkt-muted)]">
            If an account with that email exists, a reset ward has been dispatched. It expires in one hour.
          </p>

          <p className="text-[11px] text-[color:var(--mkt-muted)]/70">
            <ShieldCheck className="mr-1 inline h-3 w-3" />
            We never reveal whether an account exists.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-[Cinzel] text-xs uppercase tracking-wider text-[color:var(--mkt-accent)] transition-colors hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }
}
