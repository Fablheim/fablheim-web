import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, Pin, PinOff } from 'lucide-react';
import { shellPanelClass } from '@/lib/panel-styles';
import { useRulesContext, extractRuleTitle, extractRuleSlug } from './RulesContext';
import type { PinnedRule } from './RulesContext';

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-4 font-[Cinzel] text-3xl text-[hsl(38,42%,90%)]">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-3 mt-8 font-[Cinzel] text-2xl text-[hsl(38,34%,86%)]">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-2 mt-6 font-[Cinzel] text-xl text-[hsl(38,30%,82%)]">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 leading-8 text-[hsl(32,18%,74%)]">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-5 list-disc space-y-2 pl-6 text-[hsl(32,18%,74%)]">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-5 list-decimal space-y-2 pl-6 text-[hsl(32,18%,74%)]">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-7">{children}</li>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-6 overflow-x-auto rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(24,18%,10%,0.72)]">
      <table className="min-w-full border-collapse text-left text-sm text-[hsl(32,18%,78%)]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-[hsla(220,18%,12%,0.92)]">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="[&_tr:last-child]:border-b-0">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b border-[hsla(32,24%,24%,0.42)]">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-4 py-3 font-[Cinzel] text-xs uppercase tracking-[0.16em] text-[hsl(38,34%,86%)]">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-4 py-3 align-top leading-6 text-[hsl(32,18%,74%)]">{children}</td>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-5 rounded-r-2xl border-l-2 border-[hsla(212,42%,58%,0.52)] bg-[hsla(212,22%,14%,0.28)] px-4 py-3 italic text-[hsl(32,18%,72%)]">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-[hsla(24,18%,10%,0.84)] px-1.5 py-0.5 text-[hsl(38,74%,76%)]">
      {children}
    </code>
  ),
};

export function RulesDeskCenterStage() {
  const ctx = useRulesContext();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(212,40%,24%,0.12),transparent_30%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(22,22%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <div className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderHeader()}
        {renderBody()}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          Rules Reference
        </p>
        <h2 className="mt-1 font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,40%,90%)]">
          {ctx.activeEntryTitle ??
            (ctx.selectedCategory ? ctx.selectedCategory : ctx.systemName)}
        </h2>
      </div>
    );
  }

  function renderBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        {ctx.activeEntryPath ? renderEntryView() : renderEmptyView()}
      </div>
    );
  }

  function renderEmptyView() {
    return (
      <div className="p-5">
        <RuleWorkspaceEmpty
          category={ctx.selectedCategory}
          categoryEntries={ctx.categoryEntries}
          pinnedRules={ctx.pinnedForSystem}
          recentRules={ctx.recentForSystem}
          onOpenRule={ctx.openRule}
        />
      </div>
    );
  }

  function renderEntryView() {
    return (
      <div className="p-5">
        <RuleEntryView
          selectedSystem={ctx.selectedSystem}
          selectedSystemName={ctx.systemName}
          category={ctx.selectedCategory}
          entryPath={ctx.activeEntryPath!}
          entryTitle={ctx.activeEntryTitle}
          entryContent={ctx.entryContent}
          isLoading={ctx.isEntryLoading}
          pinned={ctx.isPinned}
          relatedRules={ctx.relatedRules}
          onTogglePin={ctx.togglePin}
          onOpenRelatedRule={(entry) => {
            const title = extractRuleTitle(entry);
            ctx.selectEntry(entry, ctx.selectedCategory, title);
          }}
        />
      </div>
    );
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RuleWorkspaceEmpty({
  category,
  categoryEntries,
  pinnedRules,
  recentRules,
  onOpenRule,
}: {
  category: string;
  categoryEntries: string[];
  pinnedRules: PinnedRule[];
  recentRules: (PinnedRule & { viewedAt: string })[];
  onOpenRule: (rule: PinnedRule) => void;
}) {
  return (
    <div className="space-y-4">
      <ReaderUtilities pinnedRules={pinnedRules} recentRules={recentRules} onOpenRule={onOpenRule} />
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-5 py-5">
        <h3 className="mt-2 font-['IM_Fell_English'] text-3xl text-[hsl(38,40%,90%)]">
          {category ? `${category} shelf open.` : 'Open a rule from the codex.'}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[hsl(30,14%,58%)]">
          {category
            ? `Browse the entries in ${category}, then open the rule you want from the right panel.`
            : 'Search for a mechanic, browse a category, or revisit something pinned for faster in-session lookup.'}
        </p>
        {categoryEntries.length > 0 && renderShelfSnapshot(categoryEntries)}
      </div>
    </div>
  );

  function renderShelfSnapshot(entries: string[]) {
    return (
      <div className="mt-6 border-t border-[hsla(32,24%,24%,0.42)] pt-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          Shelf Snapshot
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {entries.slice(0, 10).map((entry) => (
            <span
              key={entry}
              className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1.5 text-xs text-[hsl(212,34%,74%)]"
            >
              {extractRuleTitle(entry)}
            </span>
          ))}
        </div>
      </div>
    );
  }
}

function RuleEntryView({
  selectedSystem,
  selectedSystemName,
  category,
  entryPath,
  entryTitle,
  entryContent,
  isLoading,
  pinned,
  relatedRules,
  onTogglePin,
  onOpenRelatedRule,
}: {
  selectedSystem: string;
  selectedSystemName: string;
  category: string;
  entryPath: string;
  entryTitle: string | null;
  entryContent: string;
  isLoading: boolean;
  pinned: boolean;
  relatedRules: string[];
  onTogglePin: () => void;
  onOpenRelatedRule: (entry: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[linear-gradient(180deg,hsla(34,18%,13%,0.96)_0%,hsla(28,14%,9%,0.98)_100%)]">
      {renderEntryHeader()}
      <div className="px-6 py-6">
        {renderEntryContent()}
        {relatedRules.length > 0 && renderRelatedRules()}
      </div>
    </div>
  );

  function renderEntryHeader() {
    return (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
            Rule Workspace
          </p>
          <h3 className="mt-1 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,40%,90%)]">
            {entryTitle ?? extractRuleTitle(entryPath)}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <WorkspaceBadge label={category || 'Reference'} />
            <WorkspaceBadge label={selectedSystemName} />
            <WorkspaceBadge label="SRD" />
          </div>
        </div>
        {renderEntryActions()}
      </div>
    );
  }

  function renderEntryActions() {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onTogglePin}
          className="inline-flex items-center gap-2 rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(212,34%,74%)]"
        >
          {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          {pinned ? 'Unpin' : 'Pin Rule'}
        </button>
        <a
          href={`/srd/${selectedSystem}/${encodeURIComponent(category)}/${encodeURIComponent(extractRuleSlug(entryPath))}`}
          className="inline-flex items-center gap-2 rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(212,34%,74%)]"
        >
          <ExternalLink className="h-4 w-4" />
          Open SRD Page
        </a>
      </div>
    );
  }

  function renderEntryContent() {
    if (isLoading) {
      return <div className="text-sm text-[hsl(30,14%,58%)]">Loading rule text…</div>;
    }
    return (
      <article className="max-w-none [&_.contains-task-list]:pl-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {entryContent}
        </ReactMarkdown>
      </article>
    );
  }

  function renderRelatedRules() {
    return (
      <div className="mt-8 border-t border-[hsla(32,24%,24%,0.42)] pt-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          Related Rules
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {relatedRules.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => onOpenRelatedRule(entry)}
              className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1.5 text-xs text-[hsl(212,34%,74%)]"
            >
              {extractRuleTitle(entry)}
            </button>
          ))}
        </div>
      </div>
    );
  }
}

function ReaderUtilities({
  pinnedRules,
  recentRules,
  onOpenRule,
}: {
  pinnedRules: PinnedRule[];
  recentRules: (PinnedRule & { viewedAt: string })[];
  onOpenRule: (rule: PinnedRule) => void;
}) {
  if (pinnedRules.length === 0 && recentRules.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {renderPinnedBox()}
      {renderRecentBox()}
    </div>
  );

  function renderPinnedBox() {
    return (
      <details className="min-w-[240px] flex-1 rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-4 py-3">
        <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          Pinned Rules
          <span className="ml-2 font-[Cinzel] text-sm normal-case text-[hsl(38,34%,86%)]">
            {pinnedRules.length}
          </span>
        </summary>
        <div className="mt-3 space-y-2">
          {pinnedRules.length ? (
            pinnedRules.map((rule) => renderRuleCard(`${rule.system}:${rule.entry}`, rule, rule.category))
          ) : (
            <p className="text-sm text-[hsl(30,14%,56%)]">
              Pin the rules your table reaches for often.
            </p>
          )}
        </div>
      </details>
    );
  }

  function renderRecentBox() {
    return (
      <details className="min-w-[240px] flex-1 rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-4 py-3">
        <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          Recent Lookups
          <span className="ml-2 font-[Cinzel] text-sm normal-case text-[hsl(38,34%,86%)]">
            {recentRules.length}
          </span>
        </summary>
        <div className="mt-3 space-y-2">
          {recentRules.length ? (
            recentRules.map((rule) =>
              renderRuleCard(
                `${rule.system}:${rule.entry}:${rule.viewedAt}`,
                rule,
                `${rule.category} · ${formatRecent(rule.viewedAt)}`,
              ),
            )
          ) : (
            <p className="text-sm text-[hsl(30,14%,56%)]">
              Recent rules will show up here as you use the desk.
            </p>
          )}
        </div>
      </details>
    );
  }

  function renderRuleCard(key: string, rule: PinnedRule, subtitle: string) {
    return (
      <button
        key={key}
        type="button"
        onClick={() => onOpenRule(rule)}
        className="w-full rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] px-4 py-3 text-left transition hover:border-[hsla(38,50%,58%,0.4)]"
      >
        <p className="font-[Cinzel] text-[14px] text-[hsl(35,24%,92%)]">{rule.title}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
          {subtitle}
        </p>
      </button>
    );
  }
}

function WorkspaceBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1 text-xs text-[hsl(212,34%,74%)]">
      {label}
    </span>
  );
}

function formatRecent(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}
