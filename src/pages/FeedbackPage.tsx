import { useState } from 'react';
import { Bug, Lightbulb, MessageCircle, Send, Clock, CheckCircle2, Eye, Loader2, ScrollText, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/layout/PageContainer';
import { useMyFeedback, useCreateFeedback } from '@/hooks/useFeedback';
import type { CreateFeedbackDto } from '@/api/feedback';

type FeedbackTab = 'bug' | 'feature' | 'general';

const TABS: { key: FeedbackTab; label: string; icon: typeof Bug }[] = [
  { key: 'bug', label: 'Bug Report', icon: Bug },
  { key: 'feature', label: 'Feature Request', icon: Lightbulb },
  { key: 'general', label: 'General', icon: MessageCircle },
];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  new: { label: 'New', className: 'border border-blue-500/30 bg-blue-500/15 text-blue-300', icon: Clock },
  in_review: { label: 'In Review', className: 'border border-yellow-500/30 bg-yellow-500/15 text-yellow-300', icon: Eye },
  planned: { label: 'Planned', className: 'border border-violet-500/30 bg-violet-500/15 text-violet-300', icon: Clock },
  in_progress: { label: 'In Progress', className: 'border border-orange-500/30 bg-orange-500/15 text-orange-300', icon: Loader2 },
  resolved: { label: 'Resolved', className: 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300', icon: CheckCircle2 },
  closed: { label: 'Closed', className: 'border border-border/70 bg-muted/60 text-muted-foreground', icon: CheckCircle2 },
};

const inputClass =
  'w-full rounded-md border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<FeedbackTab>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [useCase, setUseCase] = useState('');

  const { data: myFeedback, isLoading } = useMyFeedback();
  const createFeedback = useCreateFeedback();

  function resetForm() {
    setTitle('');
    setDescription('');
    setStepsToReproduce('');
    setExpectedBehavior('');
    setActualBehavior('');
    setUseCase('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const dto: CreateFeedbackDto = {
      type: activeTab,
      title: title.trim(),
      description: description.trim(),
    };

    if (activeTab === 'bug') {
      if (stepsToReproduce.trim()) dto.stepsToReproduce = stepsToReproduce.trim();
      if (expectedBehavior.trim()) dto.expectedBehavior = expectedBehavior.trim();
      if (actualBehavior.trim()) dto.actualBehavior = actualBehavior.trim();
    }

    if (activeTab === 'feature' && useCase.trim()) {
      dto.useCase = useCase.trim();
    }

    createFeedback.mutate(dto, {
      onSuccess: () => {
        toast.success('Feedback submitted! Thank you for helping improve Fablheim.');
        resetForm();
      },
      onError: () => {
        toast.error('Failed to submit feedback. Please try again.');
      },
    });
  }

  return (
    <PageContainer title="Feedback" subtitle="Share bugs, feature ideas, and table workflow improvements">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <section className="app-card rounded-xl border border-[color:var(--mkt-border)]/85 bg-[linear-gradient(160deg,hsla(38,84%,56%,0.14)_0%,hsla(24,16%,11%,0.88)_46%,hsla(24,16%,7%,0.94)_100%)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Player Voice</p>
              <h2 className="mt-1 font-[Cinzel] text-2xl text-foreground">Help Forge Better Sessions</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Report issues, suggest features, or share ideas about prep and live-play workflow.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--mkt-border)]/75 bg-black/25 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Every report is reviewed</span>
            </div>
          </div>
        </section>

        <section className="app-card rounded-xl border border-[color:var(--mkt-border)]/80 bg-[linear-gradient(180deg,hsla(32,26%,15%,0.28)_0%,hsla(24,16%,8%,0.5)_100%)] p-6">
          <div className="flex gap-1 rounded-lg border border-border/60 bg-card/60 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`app-focus-ring flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border border-primary/30 bg-primary/15 text-primary shadow-sm'
                    : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-lg border border-border/60 bg-background/35 p-5">
            <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
              <div>
                <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    activeTab === 'bug'
                      ? 'Brief description of the issue'
                      : activeTab === 'feature'
                        ? 'What feature would you like?'
                        : 'What would you like to tell us?'
                  }
                  className={inputClass}
                />
              </div>
              <div className="rounded-md border border-border/70 bg-card/55 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Type</p>
                <p className="mt-1.5 font-[Cinzel] text-sm text-foreground">
                  {activeTab === 'bug' ? 'Bug Report' : activeTab === 'feature' ? 'Feature Request' : 'General Feedback'}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="description"
                required
                maxLength={10000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide as much detail as possible..."
                className={`${inputClass} resize-y`}
              />
            </div>

            {renderTypeSpecificFields()}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createFeedback.isPending || !title.trim() || !description.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {createFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </section>

        <section className="app-card rounded-xl border border-[color:var(--mkt-border)]/80 bg-[linear-gradient(180deg,hsla(32,26%,15%,0.28)_0%,hsla(24,16%,8%,0.5)_100%)] p-6">
          <header className="mb-4 flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/20 text-primary">
              <ScrollText className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-[Cinzel] text-lg font-semibold text-foreground">My Submissions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Track status updates on your previous reports.</p>
            </div>
          </header>
          {isLoading ? (
            <div className="flex items-center justify-center rounded-md border border-border/60 bg-background/40 py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : !myFeedback?.length ? (
            <p className="rounded-md border border-border/60 bg-background/40 py-8 text-center text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-2.5">
              {myFeedback.map((item) => {
                const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.new;
                const StatusIcon = statusCfg.icon;
                const TypeIcon = TABS.find((t) => t.key === item.type)?.icon ?? MessageCircle;
                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-4 py-3"
                  >
                    <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );

  function renderTypeSpecificFields() {
    if (activeTab === 'bug') {
      return (
        <>
          <div>
            <label htmlFor="steps" className="mb-1 block text-sm font-medium text-foreground">
              Steps to Reproduce <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="steps"
              maxLength={5000}
              rows={3}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
              className={`${inputClass} resize-y`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expected" className="mb-1 block text-sm font-medium text-foreground">
                Expected Behavior <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="expected"
                maxLength={2000}
                rows={2}
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="What should have happened?"
                className={`${inputClass} resize-y`}
              />
            </div>
            <div>
              <label htmlFor="actual" className="mb-1 block text-sm font-medium text-foreground">
                Actual Behavior <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="actual"
                maxLength={2000}
                rows={2}
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                placeholder="What actually happened?"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'feature') {
      return (
        <div>
          <label htmlFor="useCase" className="mb-1 block text-sm font-medium text-foreground">
            Use Case <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="useCase"
            maxLength={5000}
            rows={3}
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="Describe how you'd use this feature in your games..."
            className={`${inputClass} resize-y`}
          />
        </div>
      );
    }

    return null;
  }
}
