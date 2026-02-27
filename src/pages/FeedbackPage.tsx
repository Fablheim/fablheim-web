import { useState } from 'react';
import { Bug, Lightbulb, MessageCircle, Send, Clock, CheckCircle2, Eye, Loader2 } from 'lucide-react';
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
  new: { label: 'New', className: 'bg-blue-500/20 text-blue-400', icon: Clock },
  in_review: { label: 'In Review', className: 'bg-yellow-500/20 text-yellow-400', icon: Eye },
  planned: { label: 'Planned', className: 'bg-purple-500/20 text-purple-400', icon: Clock },
  in_progress: { label: 'In Progress', className: 'bg-orange-500/20 text-orange-400', icon: Loader2 },
  resolved: { label: 'Resolved', className: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
};

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
    <PageContainer title="Feedback" subtitle="Help us improve Fablheim">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Tab Selector */}
        <div className="flex gap-1 rounded-lg bg-card/60 p-1 border border-border/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border/50 bg-card/40 p-6">
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
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

        {/* My Submissions */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground font-['IM_Fell_English']">My Submissions</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : !myFeedback?.length ? (
            <p className="py-8 text-center text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {myFeedback.map((item) => {
                const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.new;
                const StatusIcon = statusCfg.icon;
                const TypeIcon = TABS.find((t) => t.key === item.type)?.icon ?? MessageCircle;
                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-3"
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
        </div>
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
        </div>
      );
    }

    return null;
  }
}
