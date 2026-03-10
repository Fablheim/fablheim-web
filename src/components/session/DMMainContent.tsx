import { useEffect, useState, type ReactNode } from 'react';
import { ListOrdered, Map, Plus, ScrollText, Sparkles, Swords, Users } from 'lucide-react';
import { useCampaign } from '@/hooks/useCampaigns';
import { WorldBrowserPanel } from '@/components/workspace/panels/WorldBrowserPanel';
import { EncountersTab } from '@/components/session/EncountersTab';
import InlineEncounterBuilder from '@/components/session/InlineEncounterBuilder';
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import { SessionNotesTab } from '@/components/session/SessionNotesTab';
import { PartyOverview } from '@/components/session/PartyOverview';
import { AIToolsTab } from '@/components/session/AIToolsTab';
import { Button } from '@/components/ui/Button';

type MainTab = 'world' | 'encounters' | 'initiative' | 'notes' | 'party' | 'ai';

interface DMMainContentProps {
  campaignId: string;
  isDM: boolean;
}

export default function DMMainContent({ campaignId, isDM }: DMMainContentProps) {
  const { data: campaign } = useCampaign(campaignId);
  const [activeTab, setActiveTab] = useState<MainTab>(() =>
    (localStorage.getItem('fablheim:dm-main-tab') as MainTab) || 'world',
  );
  const [showQuickAIEverywhere, setShowQuickAIEverywhere] = useState(() => {
    const saved = localStorage.getItem('fablheim:session-v2-show-quick-ai');
    return saved !== '0';
  });
  const [aiFocusSeed, setAiFocusSeed] = useState(0);
  const [creatingEncounter, setCreatingEncounter] = useState(false);

  useEffect(() => {
    localStorage.setItem('fablheim:dm-main-tab', activeTab);
  }, [activeTab]);
  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-show-quick-ai', showQuickAIEverywhere ? '1' : '0');
  }, [showQuickAIEverywhere]);

  function openAITool(tool: 'npc' | 'encounter' | 'quest' | 'lore' | 'location') {
    localStorage.setItem('fablheim:session-v2-ai-focus', tool);
    setAiFocusSeed((v) => v + 1);
    setActiveTab('ai');
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="shrink-0 border-b border-border/60 bg-card/60">
        <div className="flex flex-wrap gap-1 p-2">
          <TabButton active={activeTab === 'world'} onClick={() => setActiveTab('world')} icon={<Map className="h-4 w-4" />} label="World" />
          <TabButton active={activeTab === 'encounters'} onClick={() => setActiveTab('encounters')} icon={<Swords className="h-4 w-4" />} label="Encounters" />
          <TabButton active={activeTab === 'initiative'} onClick={() => setActiveTab('initiative')} icon={<ListOrdered className="h-4 w-4" />} label="Initiative" />
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<ScrollText className="h-4 w-4" />} label="Notes" />
          <TabButton active={activeTab === 'party'} onClick={() => setActiveTab('party')} icon={<Users className="h-4 w-4" />} label="Party" />
          <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Sparkles className="h-4 w-4" />} label="AI Tools" />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Quick AI buttons</span>
        <button
          type="button"
          onClick={() => setShowQuickAIEverywhere((v) => !v)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full p-0.5 transition-colors ${
            showQuickAIEverywhere ? 'bg-primary/60' : 'bg-muted'
          }`}
          aria-label="Toggle quick AI actions on non-AI tabs"
          aria-pressed={showQuickAIEverywhere}
        >
          <span
            className={`h-4 w-4 rounded-full bg-background transition-transform ${
              showQuickAIEverywhere ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {showQuickAIEverywhere && activeTab !== 'ai' && (
          <div className="border-b border-border/50 bg-primary/5 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Quick AI actions</div>
            {activeTab === 'world' ? (
              <div className="grid grid-cols-3 gap-1">
                <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => openAITool('npc')}>
                  NPC
                </button>
                <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => openAITool('location')}>
                  Location
                </button>
                <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => openAITool('quest')}>
                  Quest
                </button>
              </div>
            ) : activeTab === 'encounters' ? (
              <div className="grid grid-cols-1 gap-1">
                <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => openAITool('encounter')}>
                  Encounter
                </button>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'world' && (
          <div className="h-full overflow-y-auto">
            <WorldBrowserPanel campaignId={campaignId} />
          </div>
        )}

        {activeTab === 'encounters' && (
          <div className="h-full overflow-y-auto p-3">
            {creatingEncounter ? (
              <InlineEncounterBuilder
                campaignId={campaignId}
                onDone={() => setCreatingEncounter(false)}
              />
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                    Encounter Library
                  </span>
                  <Button size="sm" variant="primary" onClick={() => setCreatingEncounter(true)}>
                    <Plus className="mr-1.5 h-3 w-3" />
                    Create Encounter
                  </Button>
                </div>
                <EncountersTab campaignId={campaignId} isDM={isDM} />
              </>
            )}
          </div>
        )}

        {activeTab === 'initiative' && (
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <div className="mx-auto max-w-5xl">
              <InitiativeTracker campaignId={campaignId} isDM={isDM} />
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="h-full overflow-y-auto">
            <SessionNotesTab campaignId={campaignId} sessionId={campaign?.activeSessionId} />
          </div>
        )}

        {activeTab === 'party' && (
          <div className="h-full overflow-y-auto p-3">
            <PartyOverview campaignId={campaignId} />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="h-full overflow-y-auto">
            <AIToolsTab campaignId={campaignId} focusSeed={aiFocusSeed} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-primary/15 text-primary border border-primary/30'
          : 'border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      <span className="font-[Cinzel] text-xs uppercase tracking-wide">{label}</span>
    </button>
  );
}
