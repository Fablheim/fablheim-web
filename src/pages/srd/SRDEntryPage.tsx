import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useSRDEntry, useSRDCategoryEntries } from '@/hooks/useSRD';
import type { Components } from 'react-markdown';

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-carved mb-4 font-[Cinzel] text-2xl font-bold text-[hsl(35,25%,92%)]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 font-[Cinzel] text-xl font-semibold text-[hsl(35,25%,92%)]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 font-[Cinzel] text-lg font-medium text-amber-400/90">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 font-[Cinzel] text-base font-medium text-[hsl(35,25%,88%)]">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-[hsl(35,20%,75%)]">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-[hsl(35,25%,92%)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-[hsl(35,20%,70%)]">{children}</em>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse border border-[hsl(24,14%,20%)]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-[hsl(24,14%,20%)]">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,10%)] px-3 py-2 text-left font-[Cinzel] text-sm text-amber-400">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[hsl(24,14%,20%)] px-3 py-2 text-sm text-[hsl(35,20%,75%)]">
      {children}
    </td>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-6 text-[hsl(35,20%,75%)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-6 text-[hsl(35,20%,75%)]">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[hsl(35,20%,75%)]">{children}</li>
  ),
  hr: () => <div className="divider-ornate my-6" />,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-amber-500/50 pl-4 italic text-[hsl(30,12%,55%)]">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <pre className="my-4 overflow-x-auto rounded-md border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,8%)] p-4">
          <code className="text-sm text-[hsl(35,20%,75%)]">{children}</code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-[hsl(24,14%,15%)] px-1.5 py-0.5 text-sm text-amber-400">
        {children}
      </code>
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-amber-400 underline decoration-amber-400/30 transition-colors hover:text-amber-300 hover:decoration-amber-300/50"
    >
      {children}
    </a>
  ),
};

function renderNav(navigate: ReturnType<typeof useNavigate>, user: unknown) {
  return (
    <nav className="texture-wood sticky top-0 z-50 border-b border-gold bg-[hsl(24,18%,6%)]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-9 w-9 rounded-md shadow-glow-sm animate-candle" />
            <span className="font-['Cinzel_Decorative'] text-glow-gold text-xl font-bold text-[hsl(35,25%,92%)]">
              Fablheim
            </span>
          </button>
          {renderNavButtons(navigate, user)}
        </div>
      </div>
    </nav>
  );
}

function renderNavButtons(navigate: ReturnType<typeof useNavigate>, user: unknown) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" onClick={() => navigate('/srd')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        All Systems
      </Button>
      {user ? (
        <Button onClick={() => navigate('/app')}>
          Dashboard
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      ) : (
        <>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/register')}>Enter the Realm</Button>
        </>
      )}
    </div>
  );
}

function renderBreadcrumb(
  navigate: ReturnType<typeof useNavigate>,
  system: string,
  category: string,
  entry: string,
) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[hsl(30,12%,55%)]">
      <button onClick={() => navigate('/srd')} className="transition-colors hover:text-amber-400">
        SRD
      </button>
      <ChevronRight className="h-3 w-3" />
      <button
        onClick={() => navigate(`/srd/${system}`)}
        className="transition-colors hover:text-amber-400"
      >
        {system}
      </button>
      <ChevronRight className="h-3 w-3" />
      <button
        onClick={() => navigate(`/srd/${system}/browse/${encodeURIComponent(category)}`)}
        className="transition-colors hover:text-amber-400"
      >
        {category}
      </button>
      <ChevronRight className="h-3 w-3" />
      <span className="text-[hsl(35,25%,92%)]">{entry}</span>
    </div>
  );
}

function renderPrevNext(
  system: string,
  category: string,
  entry: string,
  entries: string[],
  navigate: ReturnType<typeof useNavigate>,
) {
  const currentIdx = entries.indexOf(entry);
  const prev = currentIdx > 0 ? entries[currentIdx - 1] : null;
  const next = currentIdx < entries.length - 1 ? entries[currentIdx + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-[hsl(24,14%,20%)] pt-6">
      {prev ? (
        <button
          onClick={() => navigate(`/srd/${system}/${encodeURIComponent(category)}/${encodeURIComponent(prev)}`)}
          className="flex items-center gap-2 text-sm text-[hsl(30,12%,55%)] transition-colors hover:text-amber-400"
        >
          <ChevronLeft className="h-4 w-4" />
          {prev}
        </button>
      ) : (
        <div />
      )}
      {next ? (
        <button
          onClick={() => navigate(`/srd/${system}/${encodeURIComponent(category)}/${encodeURIComponent(next)}`)}
          className="flex items-center gap-2 text-sm text-[hsl(30,12%,55%)] transition-colors hover:text-amber-400"
        >
          {next}
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}

function renderFooter() {
  return (
    <footer className="texture-wood relative border-t border-[hsl(24,14%,15%)] py-12">
      <div className="divider-ornate absolute top-0 right-0 left-0" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-8 w-8 rounded-md shadow-glow-sm" />
            <span className="font-['Cinzel_Decorative'] text-glow-gold font-semibold text-[hsl(35,25%,92%)]">
              Fablheim
            </span>
          </div>
          <p className="text-sm text-[hsl(30,12%,55%)]">
            &copy; 2026 Fablheim. Forged for Game Masters, by Game Masters.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function SRDEntryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { system = '', category = '', entry = '' } = useParams<{
    system: string;
    category: string;
    entry: string;
  }>();

  // "General" is a virtual category for flat entries — strip it from the API path
  const entryPath = category === 'General' ? entry : `${category}/${entry}`;
  const { data: entryData, isLoading } = useSRDEntry(system, entryPath);
  const { data: categoryData } = useSRDCategoryEntries(system, category);

  if (isLoading) {
    return (
      <div className="vignette grain-overlay flex min-h-screen items-center justify-center bg-[hsl(24,18%,6%)]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="vignette grain-overlay min-h-screen bg-[hsl(24,18%,6%)]">
      {renderNav(navigate, user)}

      <section className="relative py-12">
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {renderBreadcrumb(navigate, system, category, entry)}

          <div className="iron-brackets texture-parchment rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] p-6 sm:p-8">
            {entryData?.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {entryData.content}
              </ReactMarkdown>
            ) : (
              <p className="py-8 text-center text-[hsl(30,12%,55%)]">
                Entry not found.
              </p>
            )}
          </div>

          {categoryData &&
            renderPrevNext(
              system,
              category,
              entry,
              categoryData.entries,
              navigate,
            )}
        </div>
      </section>

      <div className="divider-ornate mx-auto max-w-3xl" />
      {renderFooter()}
    </div>
  );
}
