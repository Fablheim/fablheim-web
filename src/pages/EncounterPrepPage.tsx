import { useState } from 'react';
import { ArrowLeft, Upload, Swords, FileText, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { useEncounter, useLoadEncounter } from '@/hooks/useEncounters';
import { PageContainer } from '@/components/layout/PageContainer';
import { CampaignSelector } from '@/components/ui/CampaignSelector';
import { EncounterLibrary } from '@/components/encounters/EncounterLibrary';
import { EncounterMapEditor } from '@/components/encounters/EncounterMapEditor';
import { EncounterDetailsPanel } from '@/components/encounters/EncounterDetailsPanel';
import { EncounterNPCList } from '@/components/encounters/EncounterNPCList';
import { EncounterAIPanel } from '@/components/encounters/EncounterAIPanel';
import { Button } from '@/components/ui/Button';
import type { Encounter } from '@/types/encounter';

interface EncounterPrepPageProps {
  campaignId?: string;
}

type SideTab = 'details' | 'creatures' | 'ai';

const SIDE_TABS: { id: SideTab; label: string; icon: typeof FileText }[] = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'creatures', label: 'Creatures', icon: Users },
  { id: 'ai', label: 'AI Gen', icon: Sparkles },
];

export function EncounterPrepPage({ campaignId: propCampaignId }: EncounterPrepPageProps) {
  const { data: campaigns, isLoading: campaignsLoading } = useAccessibleCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState(propCampaignId ?? '');
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>('details');

  const campaignId = propCampaignId || selectedCampaignId;
  const selectedCampaign = campaigns?.find((c) => c._id === campaignId);
  const isDM = selectedCampaign?.role === 'dm' || selectedCampaign?.role === 'co_dm';

  const { data: encounter } = useEncounter(campaignId || undefined, selectedEncounterId ?? undefined);
  const loadEncounter = useLoadEncounter(campaignId || '');

  function handleSelectEncounter(enc: Encounter) {
    setSelectedEncounterId(enc._id);
    setSideTab('details');
  }

  function handleBack() {
    setSelectedEncounterId(null);
  }

  function handleLoad() {
    if (!encounter || !campaignId) return;
    if (!confirm('Load this encounter into the live session? This will copy tokens to the battle map and add NPCs to initiative.')) return;

    loadEncounter.mutate(
      { encounterId: encounter._id, body: { addToInitiative: true, clearExistingMap: true } },
      {
        onSuccess: () => toast.success('Encounter loaded into session'),
        onError: () => toast.error('Failed to load encounter'),
      },
    );
  }

  return (
    <PageContainer
      title="Encounter Prep"
      subtitle="Plan and prepare encounters before game day"
      actions={renderActions()}
    >
      {renderContent()}
    </PageContainer>
  );

  function renderActions() {
    return (
      <div className="flex items-center gap-2">
        {!propCampaignId && (
          <CampaignSelector
            campaigns={campaigns ?? []}
            value={selectedCampaignId}
            onChange={(id) => {
              setSelectedCampaignId(id);
              setSelectedEncounterId(null);
            }}
          />
        )}
      </div>
    );
  }

  function renderContent() {
    // No campaign selected
    if (!campaignId && !campaignsLoading) {
      return renderNoCampaign();
    }

    // Not a DM
    if (campaignId && !isDM && selectedCampaign) {
      return renderNotDM();
    }

    // No encounter selected — show library
    if (!selectedEncounterId || !encounter) {
      return campaignId ? (
        <EncounterLibrary campaignId={campaignId} onSelect={handleSelectEncounter} />
      ) : null;
    }

    // Encounter selected — show editor
    return renderEditor();
  }

  function renderNoCampaign() {
    return (
      <div className="rounded-lg border-2 border-dashed border-gold/20 bg-card/20 p-12 text-center texture-parchment">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shadow-glow-sm">
            <Swords className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 font-['IM_Fell_English'] text-lg text-foreground">Choose a Campaign</h3>
          <p className="text-muted-foreground">
            Select a campaign above to start prepping encounters
          </p>
        </div>
      </div>
    );
  }

  function renderNotDM() {
    return (
      <div className="rounded-lg border-2 border-dashed border-gold/20 bg-card/20 p-12 text-center texture-parchment">
        <div className="mx-auto max-w-sm">
          <h3 className="mb-2 font-['IM_Fell_English'] text-lg text-foreground">GM Tools Only</h3>
          <p className="text-muted-foreground">
            Encounter prep is available to the Game Master of this campaign
          </p>
        </div>
      </div>
    );
  }

  function renderEditor() {
    if (!encounter || !campaignId) return null;

    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {renderEditorHeader()}
        <div className="flex flex-1 overflow-hidden rounded-lg border border-iron/30">
          {renderMapPanel()}
          {renderSidePanel()}
        </div>
      </div>
    );
  }

  function renderEditorHeader() {
    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 rounded-md border border-iron bg-accent px-2 py-1 text-xs text-muted-foreground hover:bg-accent/80 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <h2 className="font-['IM_Fell_English'] text-lg text-foreground">{encounter!.name}</h2>
          <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${
            encounter!.status === 'ready' ? 'bg-forest/20 text-[hsl(150,50%,55%)]' :
            encounter!.status === 'used' ? 'bg-accent text-muted-foreground' :
            'bg-muted text-muted-foreground'
          }`}>
            {encounter!.status}
          </span>
        </div>
        <Button
          size="sm"
          onClick={handleLoad}
          disabled={loadEncounter.isPending}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {loadEncounter.isPending ? 'Loading...' : 'Load into Session'}
        </Button>
      </div>
    );
  }

  function renderMapPanel() {
    return (
      <div className="flex-1 overflow-hidden bg-card/20">
        <EncounterMapEditor campaignId={campaignId!} encounter={encounter!} />
      </div>
    );
  }

  function renderSidePanel() {
    return (
      <div className="w-[320px] xl:w-[360px] flex flex-col border-l border-[hsla(38,40%,30%,0.15)] bg-card/30">
        {renderSideTabs()}
        <div className="flex-1 overflow-y-auto p-3">
          {sideTab === 'details' && (
            <EncounterDetailsPanel campaignId={campaignId!} encounter={encounter!} />
          )}
          {sideTab === 'creatures' && (
            <EncounterNPCList campaignId={campaignId!} encounter={encounter!} />
          )}
          {sideTab === 'ai' && (
            <EncounterAIPanel campaignId={campaignId!} encounter={encounter!} />
          )}
        </div>
      </div>
    );
  }

  function renderSideTabs() {
    return (
      <div className="flex border-b border-[hsla(38,40%,30%,0.15)] shrink-0">
        {SIDE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = sideTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSideTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-[Cinzel] uppercase tracking-wider transition-all border-b-2 ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }
}
