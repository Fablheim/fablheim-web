import { useState, useMemo } from 'react';
import { Play, Calendar, FileText, CheckCircle2, XCircle, Clock, Loader2, Dice5, Flame, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useSessions, useCreateSession } from '@/hooks/useSessions';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignSelector } from '@/components/ui/CampaignSelector';
import type { Session } from '@/types/campaign';

type SessionFilter = 'all' | 'planned' | 'in_progress' | 'completed';

const STATUS_CONFIG: Record<Session['status'], { label: string; icon: typeof Clock; className: string }> = {
  planned:     { label: 'Planned',     icon: Calendar,     className: 'bg-brass/20 text-brass' },
  in_progress: { label: 'In Progress', icon: Play,         className: 'bg-forest/20 text-[hsl(150,50%,55%)]' },
  completed:   { label: 'Completed',   icon: CheckCircle2, className: 'bg-primary/20 text-primary' },
  cancelled:   { label: 'Cancelled',   icon: XCircle,      className: 'bg-muted text-muted-foreground' },
};

export function SessionsPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useAccessibleCampaigns();
  const { openTab } = useTabs();

  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [filter, setFilter] = useState<SessionFilter>('all');
  const [viewingSession, setViewingSession] = useState<Session | null>(null);

  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useSessions(selectedCampaignId);

  const createSession = useCreateSession();

  const selectedCampaign = campaigns?.find((c) => c._id === selectedCampaignId);
  const isDM = selectedCampaign?.role === 'dm' || selectedCampaign?.role === 'co_dm';

  // Filter
  const filterTabs: { key: SessionFilter; label: string; count: number }[] = useMemo(() => {
    const all = sessions ?? [];
    return [
      { key: 'all', label: 'All', count: all.length },
      { key: 'planned', label: 'Planned', count: all.filter((s) => s.status === 'planned').length },
      { key: 'in_progress', label: 'Active', count: all.filter((s) => s.status === 'in_progress').length },
      { key: 'completed', label: 'Completed', count: all.filter((s) => s.status === 'completed').length },
    ];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    const sorted = [...sessions].sort((a, b) => b.sessionNumber - a.sessionNumber);
    if (filter === 'all') return sorted;
    return sorted.filter((s) => s.status === filter);
  }, [sessions, filter]);

  // Handlers
  async function handleStartSession() {
    if (!selectedCampaignId) return;

    const nextNumber = (sessions?.length ?? 0) + 1;
    try {
      await createSession.mutateAsync({
        campaignId: selectedCampaignId,
        sessionNumber: nextNumber,
        title: `Session ${nextNumber}`,
        status: 'in_progress',
      });
    } catch {
      toast.error('Failed to start session');
      return;
    }

    // Open the live session in the current tab
    const path = `/app/campaigns/${selectedCampaignId}/live`;
    openTab({
      title: `Live: ${selectedCampaign?.name ?? 'Session'}`,
      path,
      content: resolveRouteContent(path, 'Live Session'),
    });
  }

  function handleJoinSession() {
    if (!selectedCampaignId) return;
    const path = `/app/campaigns/${selectedCampaignId}/live`;
    openTab({
      title: `Live: ${selectedCampaign?.name ?? 'Session'}`,
      path,
      content: resolveRouteContent(path, 'Live Session'),
    });
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Check for an active session
  const activeSession = sessions?.find((s) => s.status === 'in_progress');

  return (
    <PageContainer
      title="Sessions"
      subtitle="Chronicle your adventures"
      actions={
        <div className="flex items-center gap-3">
          {/* Campaign Selector */}
          <CampaignSelector
            campaigns={campaigns ?? []}
            value={selectedCampaignId}
            onChange={(id) => {
              setSelectedCampaignId(id);
              setFilter('all');
              setViewingSession(null);
            }}
          />

          {/* Start / Join Session button */}
          {selectedCampaignId && isDM && !activeSession && (
            <Button
              onClick={handleStartSession}
              disabled={createSession.isPending}
              className="shadow-glow"
            >
              {createSession.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1.5 h-4 w-4" />
              )}
              Start New Session
            </Button>
          )}
          {selectedCampaignId && activeSession && (
            <Button onClick={handleJoinSession} className="shadow-glow">
              <Play className="mr-1.5 h-4 w-4" />
              {isDM ? 'Resume Session' : 'Join Session'}
            </Button>
          )}
        </div>
      }
    >
      {/* No campaign selected */}
      {!selectedCampaignId && !campaignsLoading && (
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
          <div className="mx-auto max-w-sm">
            <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
              Choose a Campaign
            </h3>
            <p className="text-muted-foreground">
              Select a campaign above to view its session chronicle
            </p>
          </div>
        </div>
      )}

      {/* Campaign selected */}
      {selectedCampaignId && (
        <>
          {/* Filter tabs */}
          <div className="mb-6 flex gap-1 border-b border-border">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
                  filter === tab.key
                    ? 'border-brass text-brass'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  filter === tab.key ? 'bg-brass/20 text-brass' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Loading */}
          {sessionsLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5 tavern-card texture-leather">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-1/3 rounded bg-muted" />
                        <div className="h-3 w-1/4 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-4 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {sessionsError && (
            <div className="rounded-lg border border-destructive/50 bg-card p-8 text-center">
              <p className="font-medium text-destructive">Failed to load sessions</p>
              <p className="mt-1 text-sm text-muted-foreground">{(sessionsError as Error).message}</p>
            </div>
          )}

          {/* Empty */}
          {!sessionsLoading && !sessionsError && filteredSessions.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
              <div className="mx-auto max-w-sm">
                <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
                  {filter !== 'all'
                    ? `No ${filter.replace('_', ' ')} sessions`
                    : 'No sessions yet'}
                </h3>
                <p className="mb-6 text-muted-foreground">
                  {filter !== 'all'
                    ? 'Try a different filter'
                    : 'Begin your chronicle — start your first session!'}
                </p>
                {filter === 'all' && isDM && (
                  <Button
                    onClick={handleStartSession}
                    disabled={createSession.isPending}
                    className="shadow-glow"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start First Session
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Session list */}
          {!sessionsLoading && !sessionsError && filteredSessions.length > 0 && (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const status = STATUS_CONFIG[session.status];
                const StatusIcon = status.icon;
                const isActive = session.status === 'in_progress';
                const isViewing = viewingSession?._id === session._id;

                return (
                  <div key={session._id}>
                    {/* Session card */}
                    <button
                      type="button"
                      onClick={() => setViewingSession(isViewing ? null : session)}
                      className={`group w-full rounded-lg border bg-card p-5 text-left tavern-card texture-leather transition-all duration-200 hover:border-gold hover:shadow-glow hover-lift ${
                        isActive ? 'border-[hsl(150,50%,40%)] border-l-4' : 'border-border'
                      } ${isViewing ? 'ring-1 ring-brass/40' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Session number badge */}
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-[Cinzel] text-sm font-bold shadow-lg ${
                          isActive
                            ? 'border-[hsl(150,50%,40%)] bg-forest/30 text-[hsl(150,50%,55%)]'
                            : 'border-border bg-muted/50 text-muted-foreground'
                        }`}>
                          {session.sessionNumber}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-[Cinzel] font-semibold text-card-foreground">
                              {session.title || `Session ${session.sessionNumber}`}
                            </h3>
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider ${status.className}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            {session.scheduledDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(session.scheduledDate)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(session.createdAt)}
                            </span>
                            {session.durationMinutes > 0 && (
                              <span className="text-muted-foreground">
                                {Math.floor(session.durationMinutes / 60)}h {session.durationMinutes % 60}m
                              </span>
                            )}
                          </div>

                          {/* Notes preview */}
                          {(session.summary || session.notes) && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {session.summary || session.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isViewing && (
                      <div className="mt-1 rounded-b-lg border border-t-0 border-border bg-card p-5 texture-parchment">
                        {session.summary && (
                          <div className="mb-4">
                            <p className="mb-1 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">Summary</p>
                            <p className="whitespace-pre-wrap font-['IM_Fell_English'] text-sm italic leading-relaxed text-muted-foreground">
                              {session.summary}
                            </p>
                          </div>
                        )}

                        {session.notes && (
                          <div className="mb-4">
                            <div className="divider-ornate mb-3" />
                            <p className="mb-1 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">Notes</p>
                            <p className="whitespace-pre-wrap text-sm text-foreground">
                              {session.notes}
                            </p>
                          </div>
                        )}

                        {(session.aiRecap || session.aiSummary) && (
                          <div className="mb-4">
                            <div className="divider-ornate mb-3" />
                            <p className="mb-1 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {session.aiRecap ? 'AI Recap' : 'AI Summary'}
                              </span>
                            </p>
                            <p className="whitespace-pre-wrap font-['IM_Fell_English'] text-sm italic leading-relaxed text-muted-foreground">
                              {session.aiRecap || session.aiSummary}
                            </p>
                          </div>
                        )}

                        {/* Session Statistics */}
                        {session.statistics && session.statistics.diceRolls > 0 && (
                          <div className="mb-4">
                            <div className="divider-ornate mb-3" />
                            <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">Statistics</p>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Dice5 className="h-3 w-3" /> {session.statistics.diceRolls} rolls
                              </span>
                              <span className="flex items-center gap-1">
                                <Flame className="h-3 w-3" /> {session.statistics.damageDealt} damage
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" /> {session.statistics.criticalHits} crits
                              </span>
                            </div>
                          </div>
                        )}

                        {session.status === 'in_progress' && (
                          <Button onClick={handleJoinSession} size="sm" className="shadow-glow">
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            {isDM ? 'Resume Session' : 'Join Session'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
