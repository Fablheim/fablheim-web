import { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Loader2, Download, Pencil, Save, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { useSessionRecap, useRegenerateRecap, useUpdateSession } from '@/hooks/useSessions';
import { useQuery } from '@tanstack/react-query';
import { combatEventsApi } from '@/api/combat-events';
import { SessionStatistics } from './SessionStatistics';
import type { SessionStatistics as SessionStats, CombatEvent } from '@/types/campaign';

interface SessionRecapModalProps {
  campaignId: string;
  sessionId: string;
  sessionTitle: string;
  sessionNumber?: number;
  durationMinutes?: number;
  statistics?: SessionStats;
  onClose: () => void;
}

export function SessionRecapModal({
  campaignId,
  sessionId,
  sessionTitle,
  sessionNumber,
  durationMinutes,
  statistics,
  onClose,
}: SessionRecapModalProps) {
  const { data: recapData, isLoading } = useSessionRecap(campaignId, sessionId);
  const { data: combatEvents } = useQuery({
    queryKey: ['combat-events', campaignId],
    queryFn: () => combatEventsApi.list(campaignId),
  });
  const regenerate = useRegenerateRecap();
  const updateSession = useUpdateSession();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (recapData?.recap) {
      setEditText(recapData.recap);
    }
  }, [recapData?.recap]);

  function handleCopy() {
    const text = buildMarkdownExport();
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success('Recap copied as markdown');
    }
  }

  function handleRegenerate() {
    regenerate.mutate(
      { campaignId, sessionId },
      {
        onSuccess: () => { toast.success('Recap regenerated'); setEditing(false); },
        onError: () => toast.error('Failed to regenerate recap'),
      },
    );
  }

  function handleSaveEdit() {
    updateSession.mutate(
      { campaignId, id: sessionId, data: { aiRecap: editText } },
      {
        onSuccess: () => { toast.success('Recap saved'); setEditing(false); },
        onError: () => toast.error('Failed to save recap'),
      },
    );
  }

  function handleExportMarkdown() {
    const md = buildMarkdownExport();
    if (!md) return;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionNumber ?? sessionId}-recap.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Recap exported');
  }

  function buildMarkdownExport(): string {
    const lines: string[] = [];
    lines.push(`# ${sessionTitle}`);
    if (sessionNumber) lines.push(`**Session ${sessionNumber}**`);
    if (durationMinutes != null && durationMinutes > 0) {
      lines.push(`*Duration: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m*`);
    }
    lines.push('');

    const recapText = editing ? editText : recapData?.recap;
    if (recapText) {
      lines.push('## Recap');
      lines.push(recapText);
      lines.push('');
    }

    if (statistics) {
      lines.push('## Session Statistics');
      if (statistics.combatRounds > 0) {
        lines.push(`- **Combat Rounds:** ${statistics.combatRounds}`);
        lines.push(`- **Damage Dealt:** ${statistics.damageDealt}`);
        lines.push(`- **Healing Done:** ${statistics.healingDone}`);
        lines.push(`- **Enemies Defeated:** ${statistics.enemiesDefeated}`);
      }
      lines.push(`- **Dice Rolls:** ${statistics.diceRolls}`);
      if (statistics.criticalHits > 0) lines.push(`- **Critical Hits:** ${statistics.criticalHits}`);
      if (statistics.criticalMisses > 0) lines.push(`- **Critical Misses:** ${statistics.criticalMisses}`);
      if (statistics.spellsCast > 0) lines.push(`- **Spells Cast:** ${statistics.spellsCast}`);
      if (statistics.questsAdvanced.length > 0) {
        lines.push(`- **Quests Advanced:** ${statistics.questsAdvanced.join(', ')}`);
      }
      if (statistics.npcsIntroduced.length > 0) {
        lines.push(`- **NPCs Introduced:** ${statistics.npcsIntroduced.join(', ')}`);
      }
      if (statistics.keyMoments.length > 0) {
        lines.push('');
        lines.push('## Key Moments');
        statistics.keyMoments.forEach((m) => lines.push(`- ${m}`));
      }
    }

    if (combatEvents && combatEvents.length > 0) {
      lines.push('');
      lines.push('## Combat Log');
      const byRound = groupByRound(combatEvents);
      for (const [round, events] of byRound) {
        lines.push(`\n### Round ${round}`);
        for (const e of events) {
          const target = e.target ? ` → ${e.target}` : '';
          const value = e.value != null ? ` (${e.value})` : '';
          lines.push(`- **${e.actor}** ${e.action}${target}${value}${e.detail ? ` — ${e.detail}` : ''}`);
        }
      }
    }

    return lines.join('\n');
  }

  function groupByRound(events: CombatEvent[]): Map<number, CombatEvent[]> {
    const map = new Map<number, CombatEvent[]>();
    for (const e of events) {
      const arr = map.get(e.round) ?? [];
      arr.push(e);
      map.set(e.round, arr);
    }
    return map;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="app-card iron-brackets flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl texture-parchment shadow-2xl">
        {renderHeader()}
        <div className="flex-1 overflow-y-auto p-5">
          {renderRecapContent()}
          {renderCombatLog()}
          {renderKeyMoments()}
          {renderStatistics()}
        </div>
        {renderFooter()}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between border-b border-[hsla(38,40%,30%,0.2)] p-5 texture-wood">
        <div>
          <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground text-carved">
            Recap Chronicle
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {sessionTitle}
            {durationMinutes != null && durationMinutes > 0 && (
              <span className="ml-2">
                ({Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m)
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close recap modal"
          className="app-focus-ring rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  function renderRecapContent() {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="font-['IM_Fell_English'] text-sm">Generating recap...</p>
        </div>
      );
    }

    if (!recapData?.recap && !editing) {
      return (
        <div className="app-empty-state rounded-lg py-12 text-center text-muted-foreground">
          <p className="font-['IM_Fell_English'] text-sm">
            No recap available yet. The AI is still writing the tale of your adventure...
          </p>
        </div>
      );
    }

    if (editing) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
              Editing Recap
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { setEditing(false); setEditText(recapData?.recap ?? ''); }}
                className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/60 font-[Cinzel] uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateSession.isPending}
                className="flex items-center gap-1 rounded border border-brass/40 bg-brass/10 px-2 py-1 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50 font-[Cinzel] uppercase tracking-wider"
              >
                <Save className="h-3 w-3" />
                {updateSession.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-input bg-input p-4 text-sm leading-relaxed text-foreground font-['IM_Fell_English'] resize-y input-carved"
          />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Narrative Recap
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
        <div className="rounded-lg border border-[hsla(38,30%,35%,0.22)] bg-[hsla(24,16%,10%,0.55)] p-4 whitespace-pre-wrap font-['IM_Fell_English'] text-sm leading-relaxed text-foreground/90">
          {recapData!.recap}
        </div>
        {recapData!.generatedAt && (
          <p className="app-chip inline-flex px-2 py-1 text-[10px] text-muted-foreground/80">
            Generated {new Date(recapData!.generatedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  function renderCombatLog() {
    if (!combatEvents?.length) return null;
    const byRound = groupByRound(combatEvents);
    return (
      <>
        <div className="divider-ornate my-4" />
        <div>
          <p className="mb-2 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Combat Log
          </p>
          <div className="space-y-3">
            {Array.from(byRound.entries()).map(([round, events]) => (
              <div key={round}>
                <div className="mb-1 flex items-center gap-1.5">
                  <Swords className="h-3.5 w-3.5 text-brass" />
                  <span className="font-[Cinzel] text-xs text-brass">Round {round}</span>
                </div>
                <div className="space-y-1 pl-5">
                  {events.map((e) => (
                    <div
                      key={e._id}
                      className="flex gap-2 rounded border border-border/40 bg-card/30 px-3 py-1.5 text-xs text-foreground/80"
                    >
                      <span className="shrink-0 font-semibold text-foreground">{e.actor}</span>
                      <span>{e.action}{e.target ? ` → ${e.target}` : ''}{e.value != null ? ` (${e.value})` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderKeyMoments() {
    if (!statistics?.keyMoments?.length) return null;
    return (
      <>
        <div className="divider-ornate my-4" />
        <div>
          <p className="mb-2 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Key Moments
          </p>
          <div className="space-y-1.5">
            {statistics.keyMoments.map((moment, i) => (
              <div key={i} className="flex gap-2 rounded border border-border/40 bg-card/30 px-3 py-1.5 text-xs text-foreground/80">
                <span className="shrink-0 font-[Cinzel] text-brass">•</span>
                {moment}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderStatistics() {
    if (!statistics) return null;
    return (
      <>
        <div className="divider-ornate my-4" />
        <SessionStatistics statistics={statistics} />
      </>
    );
  }

  function renderFooter() {
    return (
      <div className="flex items-center justify-between border-t border-[hsla(38,40%,30%,0.2)] p-4 texture-wood">
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerate.isPending || isLoading || editing}
          className="app-focus-ring flex items-center gap-1.5 rounded-md border border-border bg-accent px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/80 disabled:opacity-50 transition-colors font-[Cinzel] uppercase tracking-wider"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`} />
          Regenerate
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportMarkdown}
            disabled={!recapData?.recap && !editing}
            className="app-focus-ring flex items-center gap-1.5 rounded-md border border-border bg-accent px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/80 disabled:opacity-50 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!recapData?.recap && !editing}
            className="app-focus-ring flex items-center gap-1.5 rounded-md border border-border bg-accent px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/80 disabled:opacity-50 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="app-focus-ring rounded-md border border-brass/40 bg-brass/10 px-4 py-1.5 text-xs text-brass hover:bg-brass/20 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}
