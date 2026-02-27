import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface MarketingNavLink {
  label: string;
  to: string;
  icon?: ReactNode;
}

interface MarketingNavbarProps {
  user: unknown;
  links: MarketingNavLink[];
}

interface MarketingFooterProps {
  links?: MarketingNavLink[];
}

export function MarketingPage({ children }: { children: ReactNode }) {
  return <div className="mkt-page vignette grain-overlay min-h-screen">{children}</div>;
}

export function MarketingNavbar({ user, links }: MarketingNavbarProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <nav className="mkt-nav relative sticky top-0 z-50 mx-2 mt-2 rounded-b-xl border backdrop-blur supports-[backdrop-filter]:bg-[color:var(--mkt-surface-2)]/90 sm:mx-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-9 w-9 rounded-md shadow-glow-sm animate-candle" />
            <span className="font-['Cinzel_Decorative'] text-glow-gold text-xl font-bold text-[color:var(--mkt-text)]">
              Fablheim
            </span>
          </button>

          <div className="hidden items-center gap-3 lg:flex">
            {links.map((link) => (
              <Button key={link.label} variant="ghost" onClick={() => go(link.to)}>
                {link.icon}
                {link.label}
              </Button>
            ))}
            {user ? (
              <Button onClick={() => go('/app')}>
                Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => go('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => go('/register')}>Enter the Realm</Button>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md border border-[color:var(--mkt-border)] bg-black/20 p-2 text-[color:var(--mkt-text)] lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="rune-divider" />

      {open && (
        <div className="border-t border-[color:var(--mkt-border)] bg-[color:var(--mkt-surface-2)]/95 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Button key={link.label} variant="ghost" onClick={() => go(link.to)} className="justify-start">
                {link.icon}
                {link.label}
              </Button>
            ))}
            {user ? (
              <Button onClick={() => go('/app')} className="justify-start">
                Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => go('/login')} className="justify-start">
                  Sign In
                </Button>
                <Button onClick={() => go('/register')} className="justify-start">
                  Enter the Realm
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export function MarketingFooter({ links }: MarketingFooterProps) {
  const navigate = useNavigate();
  const footerLinks = links ?? [
    { label: 'Terms', to: '/legal/terms' },
    { label: 'Privacy', to: '/legal/privacy' },
    { label: 'Legal & Attributions', to: '/legal' },
    { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
  ];

  return (
    <footer className="mkt-footer relative border-t py-12">
      <div className="rune-divider absolute top-0 right-0 left-0" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-8 w-8 rounded-md shadow-glow-sm" />
            <span className="font-['Cinzel_Decorative'] text-glow-gold font-semibold text-[color:var(--mkt-text)]">
              Fablheim
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            {footerLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.to)}
                className="text-sm text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-text)]"
              >
                {link.label}
              </button>
            ))}
            <p className="text-sm text-[color:var(--mkt-muted)]">
              &copy; 2026 Fablheim. Forged for Game Masters, by Game Masters.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
