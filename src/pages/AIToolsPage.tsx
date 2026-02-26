import { useState } from 'react';
import { User, Swords, BookOpen, Lightbulb, Sparkles, Crown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useCreditCosts } from '@/hooks/useCredits';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignSelector } from '@/components/ui/CampaignSelector';
import { AgeVerificationModal } from '@/components/ui/AgeVerificationModal';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { ToolCard } from '@/components/ai-tools/ToolCard';
import { NPCGenerator } from '@/components/ai-tools/NPCGenerator';
import { EncounterGenerator } from '@/components/ai-tools/EncounterGenerator';
import { RuleAssistant } from '@/components/ai-tools/RuleAssistant';
import { PlotHookGenerator } from '@/components/ai-tools/PlotHookGenerator';
import { QuickContent } from '@/components/ai-tools/QuickContent';

interface AIToolsPageProps {
  campaignId?: string;
}

export function AIToolsPage({ campaignId: propCampaignId }: AIToolsPageProps) {
  const { user, refreshUser } = useAuth();
  const { data: campaigns, isLoading: campaignsLoading } = useAccessibleCampaigns();
  const { data: creditCosts } = useCreditCosts();
  const [selectedCampaignId, setSelectedCampaignId] = useState(propCampaignId ?? '');
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const campaignId = propCampaignId || selectedCampaignId;
  const selectedCampaign = campaigns?.find((c) => c._id === campaignId);
  const isDM = selectedCampaign?.role === 'dm' || selectedCampaign?.role === 'co_dm';
  const isPaidUser = user && user.subscriptionTier !== 'free';

  // Subscription gate — free users see upsell
  if (user && !isPaidUser) {
    return (
      <PageContainer title="AI Tools" subtitle="Generate content on the fly">
        {showUpgradeModal && (
          <UpgradeModal
            currentTier={user.subscriptionTier}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 shadow-glow-sm">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-['IM_Fell_English'] text-lg font-semibold text-foreground">
              Unlock AI-Powered Tools
            </h3>
            <p className="mb-2 text-muted-foreground">
              Generate NPCs, encounters, plot hooks, and more with AI. Upgrade to a paid plan to access these tools.
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
              onClick={() => setShowUpgradeModal(true)}
              className="btn-emboss rounded bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View Plans
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
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
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
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
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
        <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
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
        <div className="space-y-3">
          <ToolCard
            title="Quick NPC Generator"
            description="Generate named NPCs with personality, stats, and plot hooks"
            icon={User}
            defaultOpen
            creditCost={creditCosts?.npc_generation}
          >
            <NPCGenerator campaignId={campaignId} />
          </ToolCard>

          <div className="divider-ornate" />

          <ToolCard
            title="Encounter Builder"
            description="Build balanced encounters with tactics and treasure"
            icon={Swords}
            creditCost={creditCosts?.encounter_building}
          >
            <EncounterGenerator campaignId={campaignId} />
          </ToolCard>

          <div className="divider-ornate" />

          <ToolCard
            title="Plot Hook Generator"
            description="Create story hooks that tie into your campaign"
            icon={Lightbulb}
            creditCost={creditCosts?.plot_hooks}
          >
            <PlotHookGenerator campaignId={campaignId} />
          </ToolCard>

          <div className="divider-ornate" />

          <ToolCard
            title="Rule Assistant"
            description="Quick SRD lookup with plain-English explanations"
            icon={BookOpen}
            creditCost={creditCosts?.rule_questions}
          >
            <RuleAssistant campaignId={campaignId} />
          </ToolCard>

          <div className="divider-ornate" />

          <ToolCard
            title="Quick Content"
            description="One-click NPCs, locations, taverns, and shops"
            icon={Sparkles}
            creditCost={creditCosts?.world_building}
          >
            <QuickContent campaignId={campaignId} />
          </ToolCard>
        </div>
      )}
    </PageContainer>
  );
}
