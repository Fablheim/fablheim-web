import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCampaign } from '@/hooks/useCampaigns';
import { useSessions, useUpdateSession } from '@/hooks/useSessions';
import { isUpcomingStatus } from './SessionsContext';
import { shellPanelClass } from '@/lib/panel-styles';

interface SessionNotesViewProps {
  campaignId: string;
}

export function SessionNotesView({ campaignId }: SessionNotesViewProps) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const updateSession = useUpdateSession();

  // Match PlayContextSidebar resolution: activeSessionId → in_progress → next upcoming
  const activeSession = useMemo(() => {
    if (!sessions?.length) return undefined;
    if (campaign?.activeSessionId) {
      const found = sessions.find((s) => s._id === campaign.activeSessionId);
      if (found) return found;
    }
    const live = sessions.find((s) => s.status === 'in_progress');
    if (live) return live;
    return sessions.find((s) => isUpcomingStatus(s.status)) ?? undefined;
  }, [sessions, campaign?.activeSessionId]);

  const [draft, setDraft] = useState(activeSession?.notes ?? '');

  // Sync draft when the active session changes (e.g. first load)
  useEffect(() => {
    setDraft(activeSession?.notes ?? '');
  }, [activeSession?._id, activeSession?.notes]);

  const handleBlur = useCallback(() => {
    if (!activeSession) return;
    if (draft === (activeSession.notes ?? '')) return;
    updateSession.mutate({
      campaignId,
      id: activeSession._id,
      data: { notes: draft },
    });
  }, [activeSession, campaignId, draft, updateSession]);

  if (!activeSession) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[hsl(30,14%,54%)]">
          No active session. Start a session to take notes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section
        className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}
      >
        {renderHeader()}
        {renderBody()}
      </section>
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          Session Notes
        </p>
        <h2
          className="mt-1 font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,36%,72%)]"
        >
          {activeSession!.title ?? `Session ${activeSession!.sessionNumber}`}
        </h2>
      </div>
    );
  }

  function renderBody() {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <textarea
          className="min-h-0 flex-1 resize-none rounded-xl border border-[hsla(32,24%,24%,0.46)] bg-[hsla(20,20%,9%,0.6)] px-4 py-3 text-sm leading-relaxed text-[hsl(38,24%,88%)] placeholder:text-[hsl(30,14%,40%)] focus:border-[hsla(32,30%,36%,0.7)] focus:outline-none"
          placeholder="Write your session notes here..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
        />
      </div>
    );
  }
}
