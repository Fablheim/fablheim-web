import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from './MarketingShell';

export interface LegalTocItem {
  id: string;
  label: string;
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  intro?: string;
  toc: LegalTocItem[];
  children: ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, intro, toc, children }: LegalPageLayoutProps) {
  const { user } = useAuth();
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <MarketingPage>
      <a href="#legal-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[color:var(--mkt-surface-1)] focus:px-3 focus:py-2 focus:text-sm focus:text-[color:var(--mkt-text)]">
        Skip to legal content
      </a>

      <MarketingNavbar
        user={user}
        links={[
          { label: 'Home', to: '/' },
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <section className="mkt-section mkt-hero-stage relative px-4 pb-12 pt-14 sm:px-6 sm:pb-14 sm:pt-18 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            Legal
          </p>
          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.05] text-[color:var(--mkt-text)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.14em] text-[color:var(--mkt-muted)]">
            Last updated: {lastUpdated}
          </p>
          {intro && (
            <p className="mt-4 max-w-3xl text-[color:var(--mkt-muted)]">
              {intro}
            </p>
          )}
        </div>
      </section>

      <section id="legal-main" className="mkt-section mkt-section-surface px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 lg:hidden">
            <button
              type="button"
              aria-expanded={tocOpen}
              aria-controls="legal-toc-mobile"
              onClick={() => setTocOpen((open) => !open)}
              className="mkt-card mkt-card-mounted flex w-full items-center justify-between rounded-lg px-4 py-3 text-left"
            >
              <span className="font-[Cinzel] text-sm text-[color:var(--mkt-text)]">On this page</span>
              <ChevronDown className={`h-4 w-4 text-[color:var(--mkt-muted)] transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
            </button>
            {tocOpen && (
              <nav id="legal-toc-mobile" className="mkt-card mt-2 rounded-lg p-3" aria-label="Table of contents">
                <ul className="space-y-1">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="mkt-tab block rounded-md px-3 py-2 text-sm text-[color:var(--mkt-muted)] hover:text-[color:var(--mkt-text)]">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <nav className="mkt-card sticky top-24 rounded-xl p-4" aria-label="Table of contents">
                <p className="mb-3 font-[Cinzel] text-sm uppercase tracking-[0.12em] text-[color:var(--mkt-muted)]">On this page</p>
                <ul className="space-y-1.5">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="mkt-tab block rounded-md px-3 py-2 text-sm text-[color:var(--mkt-muted)] hover:text-[color:var(--mkt-text)]">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            <div className="space-y-5">{children}</div>
          </div>

          <div className="mt-8 flex justify-end">
            <a
              href="#top"
              onClick={(event) => {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mkt-tab rounded-md px-3 py-2 text-sm text-[color:var(--mkt-muted)] hover:text-[color:var(--mkt-text)]"
            >
              Back to top
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}

interface LegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="mkt-card mkt-card-mounted rounded-xl p-6 sm:p-7 scroll-mt-28">
      <h2 className="font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-[color:var(--mkt-muted)]">{children}</div>
    </section>
  );
}

export function LegalCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-medieval bg-[linear-gradient(180deg,hsla(38,84%,56%,0.08)_0%,transparent_100%)] px-4 py-3 text-sm text-[color:var(--mkt-text)]">
      {children}
    </div>
  );
}
