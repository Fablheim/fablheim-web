import { useState } from 'react';
import { User, Swords, BookOpen, Lightbulb, Sparkles, Coins, ArrowRight, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useCreditBalance, useCreditCosts } from '@/hooks/useCredits';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignSelector } from '@/components/ui/CampaignSelector';
import { AgeVerificationModal } from '@/components/ui/AgeVerificationModal';
import { NPCGenerator } from '@/components/ai-tools/NPCGenerator';
import { EncounterGenerator } from '@/components/ai-tools/EncounterGenerator';
import { RuleAssistant } from '@/components/ai-tools/RuleAssistant';
import { PlotHookGenerator } from '@/components/ai-tools/PlotHookGenerator';
import { QuickContent } from '@/components/ai-tools/QuickContent';

interface AIToolsPageProps {
  campaignId?: string;
}

export function AIToolsPage({ campaignId: propCampaignId }: AIToolsPageProps) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { data: campaigns, isLoading: campaignsLoading } = useAccessibleCampaigns();
  const { data: creditBalance } = useCreditBalance();
  const { data: creditCosts } = useCreditCosts();
  const [selectedCampaignId, setSelectedCampaignId] = useState(propCampaignId ?? '');
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [activeTool, setActiveTool] = useState<'npc' | 'encounter' | 'plot' | 'rules' | 'quick'>('npc');

  const campaignId = propCampaignId || selectedCampaignId;
  const selectedCampaign = campaigns?.find((c) => c._id === campaignId);
  const isDM = selectedCampaign?.role === 'dm' || selectedCampaign?.role === 'co_dm';

  // Credits gate — users with no credits see a "get credits" prompt
  if (user && creditBalance && creditBalance.total === 0) {
    return (
      <PageContainer title="AI Tools" subtitle="Generate content on the fly">
        <div className="mkt-card mkt-card-mounted rounded-xl border-2 border-dashed border-gold/30 p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 shadow-glow-sm">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-['IM_Fell_English'] text-lg font-semibold text-foreground">
              Credits Required
            </h3>
            <p className="mb-2 text-muted-foreground">
              AI tools use credits — one generation per credit spent. Top up to start generating NPCs, encounters, plot hooks, and more.
            </p>
            <ul className="mb-5 space-y-1.5 text-left text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-primary/70" />
                Quick NPC Generator with personality and stats
              </li>
              <li className="flex items-center gap-2">
                <Swords className="h-4 w-4 shrink-0 text-primary/70" />
                Encounter Builder with tactics and treasure
              </li>
              <li className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 shrink-0 text-primary/70" />
                Plot Hook Generator tied to your campaign
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-primary/70" />
                Rule Assistant with SRD lookups
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-primary/70" />
                World Building — locations, taverns, factions, and more
              </li>
            </ul>
            <button
              onClick={() => navigate('/app/credits')}
              className="btn-emboss rounded bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ShoppingCart className="mr-2 inline h-4 w-4" />
              Get Credits
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Age verification gate
  if (user && !user.ageVerified) {
    return (
      <PageContainer title="AI Tools" subtitle="Generate content on the fly">
        {showAgeModal && (
          <AgeVerificationModal
            onVerified={async () => {
              setShowAgeModal(false);
              await refreshUser();
            }}
            onCancel={() => setShowAgeModal(false)}
          />
        )}
        <div className="mkt-card mkt-card-mounted rounded-xl border-2 border-dashed border-gold/30 p-12 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 shadow-glow-sm">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-['IM_Fell_English'] text-lg font-semibold text-foreground">
              Age Verification Required
            </h3>
            <p className="mb-4 text-muted-foreground">
              AI features require age verification (18+) before use.
            </p>
            <button
              onClick={() => setShowAgeModal(true)}
              className="btn-emboss rounded bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Verify Age
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="AI Tools"
      subtitle="Generate content on the fly"
      actions={
        !propCampaignId ? (
          <CampaignSelector
            campaigns={campaigns ?? []}
            value={selectedCampaignId}
            onChange={setSelectedCampaignId}
          />
        ) : undefined
      }
    >
      {/* No campaign selected */}
      {!campaignId && !campaignsLoading && (
        <div className="mkt-card mkt-card-mounted rounded-xl border-2 border-dashed border-gold/30 p-12 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 shadow-glow-sm">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
              Choose a Campaign
            </h3>
            <p className="text-muted-foreground">
              Select a campaign above to unlock AI-powered content generation
            </p>
          </div>
        </div>
      )}

      {/* Not a DM */}
      {campaignId && !isDM && selectedCampaign && (
        <div className="mkt-card mkt-card-mounted rounded-xl border-2 border-dashed border-gold/30 p-12 text-center">
          <div className="mx-auto max-w-sm">
            <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
              GM Tools Only
            </h3>
            <p className="text-muted-foreground">
              AI tools are available to the Game Master of this campaign
            </p>
          </div>
        </div>
      )}

      {/* Tools */}
      {campaignId && isDM && (
        <div className="space-y-4">
          <div className="mkt-card rounded-xl p-3 sm:p-4">
            <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
              Choose a Tool
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  key: 'npc' as const,
                  title: 'Quick NPC Generator',
                  description: 'Named NPCs with personality and stats',
                  icon: User,
                  credit: creditCosts?.npc_generation,
                },
                {
                  key: 'encounter' as const,
                  title: 'Encounter Builder',
                  description: 'Balanced encounters with tactics',
                  icon: Swords,
                  credit: creditCosts?.encounter_building,
                },
                {
                  key: 'plot' as const,
                  title: 'Plot Hook Generator',
                  description: 'Story hooks tied to your campaign',
                  icon: Lightbulb,
                  credit: creditCosts?.plot_hooks,
                },
                {
                  key: 'rules' as const,
                  title: 'Rule Assistant',
                  description: 'SRD lookup with plain-English answers',
                  icon: BookOpen,
                  credit: creditCosts?.rule_questions,
                },
                {
                  key: 'quick' as const,
                  title: 'Quick Content',
                  description: 'NPCs, locations, taverns, shops',
                  icon: Sparkles,
                  credit: creditCosts?.world_building,
                },
              ].map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.key;
                return (
                  <button
                    key={tool.key}
                    type="button"
                    onClick={() => setActiveTool(tool.key)}
                    className={`group rounded-lg border p-3 text-left transition-all ${
                      isActive
                        ? 'mkt-card-mounted border-[color:var(--mkt-accent)]/55 shadow-glow'
                        : 'mkt-card border-[color:var(--mkt-border)] hover:-translate-y-0.5 hover:border-[color:var(--mkt-accent)]/40'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--mkt-border)] bg-black/20">
                        <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-[color:var(--mkt-accent)]' : 'text-[color:var(--mkt-muted)]'}`} />
                      </div>
                      {tool.credit !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-brass/30 bg-brass/12 px-2 py-0.5 text-[10px] font-medium text-brass">
                          <Coins className="h-3 w-3" />
                          {tool.credit}
                        </span>
                      )}
                    </div>
                    <h3 className="font-[Cinzel] text-sm font-semibold text-[color:var(--mkt-text)]">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-xs text-[color:var(--mkt-muted)]">{tool.description}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-[Cinzel] uppercase tracking-wide text-[color:var(--mkt-accent)]">
                      Open
                      <ArrowRight className={`h-3 w-3 transition-transform ${isActive ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mkt-card mkt-card-mounted rounded-xl p-4 sm:p-5">
            {activeTool === 'npc' && (
              <>
                <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Quick NPC Generator</h3>
                <p className="mb-3 text-sm text-[color:var(--mkt-muted)]">Generate named NPCs with personality, stats, and plot hooks.</p>
                <NPCGenerator campaignId={campaignId} />
              </>
            )}
            {activeTool === 'encounter' && (
              <>
                <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Encounter Builder</h3>
                <p className="mb-3 text-sm text-[color:var(--mkt-muted)]">Build balanced encounters with tactics and treasure.</p>
                <EncounterGenerator campaignId={campaignId} />
              </>
            )}
            {activeTool === 'plot' && (
              <>
                <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Plot Hook Generator</h3>
                <p className="mb-3 text-sm text-[color:var(--mkt-muted)]">Create story hooks tied to your campaign.</p>
                <PlotHookGenerator campaignId={campaignId} />
              </>
            )}
            {activeTool === 'rules' && (
              <>
                <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Rule Assistant</h3>
                <p className="mb-3 text-sm text-[color:var(--mkt-muted)]">Get quick SRD lookup with plain-English explanations.</p>
                <RuleAssistant campaignId={campaignId} />
              </>
            )}
            {activeTool === 'quick' && (
              <>
                <h3 className="font-[Cinzel] text-lg text-[color:var(--mkt-text)]">Quick Content</h3>
                <p className="mb-3 text-sm text-[color:var(--mkt-muted)]">One-click NPCs, locations, taverns, and shops.</p>
                <QuickContent campaignId={campaignId} />
              </>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
