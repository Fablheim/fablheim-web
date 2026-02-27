import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSRDCategoryEntries, useSRDEntry } from '@/hooks/useSRD';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import type { Components } from 'react-markdown';

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 font-[Cinzel] text-3xl text-[color:var(--mkt-text)]">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 leading-relaxed text-[color:var(--mkt-muted)]">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[color:var(--mkt-text)]">{children}</strong>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6 text-[color:var(--mkt-muted)]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-[color:var(--mkt-muted)]">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-[color:var(--mkt-accent)]/40 pl-4 italic text-[color:var(--mkt-muted)]">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded border border-[color:var(--mkt-border)]">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[color:var(--mkt-border)] bg-black/20 px-3 py-2 text-left font-[Cinzel] text-sm text-[color:var(--mkt-text)]">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-[color:var(--mkt-border)] px-3 py-2 text-sm text-[color:var(--mkt-muted)]">{children}</td>,
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <pre className="my-4 overflow-x-auto rounded-md border border-[color:var(--mkt-border)] bg-black/25 p-4">
          <code className="text-sm text-[color:var(--mkt-text)]">{children}</code>
        </pre>
      );
    }
    return <code className="rounded bg-black/25 px-1.5 py-0.5 text-sm text-[color:var(--mkt-accent)]">{children}</code>;
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[color:var(--mkt-accent)] underline decoration-[color:var(--mkt-accent)]/40 hover:decoration-[color:var(--mkt-accent)]">
      {children}
    </a>
  ),
};

export default function SRDEntryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { system = '', category = '', entry = '' } = useParams<{
    system: string;
    category: string;
    entry: string;
  }>();

  const entryPath = category === 'General' ? entry : `${category}/${entry}`;
  const { data: entryData, isLoading } = useSRDEntry(system, entryPath);
  const { data: categoryData } = useSRDCategoryEntries(system, category);

  const prevNext = useMemo(() => {
    const list = categoryData?.entries ?? [];
    const currentIndex = list.indexOf(entry);
    if (currentIndex < 0) return { prev: null as string | null, next: null as string | null };
    return {
      prev: currentIndex > 0 ? list[currentIndex - 1] : null,
      next: currentIndex < list.length - 1 ? list[currentIndex + 1] : null,
    };
  }, [categoryData?.entries, entry]);

  if (isLoading) {
    return (
      <MarketingPage>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--mkt-accent)]" />
        </div>
      </MarketingPage>
    );
  }

  return (
    <MarketingPage>
      <MarketingNavbar
        user={user}
        links={[
          { label: 'Rules Library', to: '/srd', icon: <ChevronLeft className="mr-1 h-4 w-4" /> },
          { label: 'System Browse', to: `/srd/${system}/browse` },
        ]}
      />

      <section className="mkt-section px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
            <button onClick={() => navigate('/srd')} className="mkt-tab px-2 py-1">Rules Library</button>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => navigate(`/srd/${system}/browse`)} className="mkt-tab px-2 py-1">{system}</button>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => navigate(`/srd/${system}/browse/${encodeURIComponent(category)}`)} className="mkt-tab px-2 py-1">{category}</button>
            <ChevronRight className="h-3 w-3" />
            <span>{entry}</span>
          </div>

          <article className="mkt-card mkt-card-mounted iron-brackets texture-parchment rounded-xl p-6 sm:p-8">
            {entryData?.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {entryData.content}
              </ReactMarkdown>
            ) : (
              <p className="py-8 text-center text-[color:var(--mkt-muted)]">Entry not found.</p>
            )}
          </article>

          {(prevNext.prev || prevNext.next) && (
            <div className="mt-6 flex items-center justify-between border-t border-[color:var(--mkt-border)] pt-5">
              {prevNext.prev ? (
                <button
                  onClick={() => navigate(`/srd/${system}/${encodeURIComponent(category)}/${encodeURIComponent(prevNext.prev!)}`)}
                  className="mkt-tab flex items-center gap-2 px-3 py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {prevNext.prev}
                </button>
              ) : (
                <div />
              )}

              {prevNext.next ? (
                <button
                  onClick={() => navigate(`/srd/${system}/${encodeURIComponent(category)}/${encodeURIComponent(prevNext.next!)}`)}
                  className="mkt-tab flex items-center gap-2 px-3 py-2"
                >
                  {prevNext.next}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </MarketingPage>
  );
}
