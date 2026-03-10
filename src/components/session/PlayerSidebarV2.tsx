import { useEffect, useState } from 'react';
import { BookOpen, NotebookPen, ScrollText, User, Users, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useInitiative } from '@/hooks/useLiveSession';
import { useCharacters } from '@/hooks/useCharacters';
import { useSocketEvent } from '@/hooks/useSocket';
import { useUpdateConditions } from '@/hooks/useCharacterCombat';
import { ConcentrationBadge } from '@/components/session/ConcentrationBadge';
import { DeathSavesTracker } from '@/components/session/DeathSavesTracker';
import { DownedStatePanel } from '@/components/session/DownedStatePanel';
import { LiveCharacterSheet } from '@/components/session/LiveCharacterSheet';
import { PlayerNotesTab } from '@/components/session/PlayerNotesTab';
import { QuickReference } from '@/components/session/QuickReference';
import { HandoutsTab } from '@/components/session/HandoutsTab';
import { PartyStatusPanel } from '@/components/session/PartyStatusPanel';
import { SharedNotesTab } from '@/components/session/SharedNotesTab';

const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
  'Concentrating', 'Exhaustion',
];

type PlayerTab = 'character' | 'notes' | 'shared-notes' | 'handouts' | 'party' | 'rules';

interface PlayerSidebarV2Props {
  campaignId: string;
}

export default function PlayerSidebarV2({ campaignId }: PlayerSidebarV2Props) {
  const { user } = useAuth();
  const { data: initiative } = useInitiative(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const updateConditions = useUpdateConditions();
  const [activeTab, setActiveTab] = useState<PlayerTab>(() => {
    const saved = localStorage.getItem('fablheim:session-v2-player-tab');
    return (saved as PlayerTab) || 'character';
  });
  const [newHandoutCount, setNewHandoutCount] = useState(0);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-player-tab', activeTab);
  }, [activeTab]);

  // Toast + badge when DM shares a new handout
  useSocketEvent('handout:shared', (data: { title?: string }) => {
    toast(
      <span className="flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 text-gold" />
        New handout: <strong>{data?.title ?? 'Untitled'}</strong>
      </span>,
    );
    if (activeTab !== 'handouts') {
      setNewHandoutCount((prev) => prev + 1);
    }
  });

  const myCharacter = characters?.find((character) => character.userId === user?._id);
  const myEntry = myCharacter
    ? initiative?.entries.find((entry) => entry.characterId === myCharacter._id)
    : undefined;
  const myConditions = myCharacter?.conditions ?? [];

  function toggleCondition(condition: string) {
    if (!myCharacter) return;
    const next = myConditions.includes(condition)
      ? myConditions.filter((c) => c !== condition)
      : [...myConditions, condition];
    updateConditions.mutate({ id: myCharacter._id, conditions: next });
  }

  return (
    <div className="flex h-full flex-col">
      {renderTabs()}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {renderTabContent()}
      </div>
    </div>
  );

  function renderTabs() {
    return (
      <div className="grid grid-cols-6 gap-1 border-b border-border/70 p-2">
        <button type="button" onClick={() => setActiveTab('character')} className={tabClass(activeTab === 'character')} aria-label="Character">
          <User className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('party')} className={tabClass(activeTab === 'party')} aria-label="Party">
          <Users className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('notes')} className={tabClass(activeTab === 'notes')} aria-label="My Notes">
          <ScrollText className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('shared-notes')} className={tabClass(activeTab === 'shared-notes')} aria-label="Shared Notes">
          <NotebookPen className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('handouts'); setNewHandoutCount(0); }}
          className={`relative ${tabClass(activeTab === 'handouts')}`}
          aria-label="Handouts"
        >
          <FileText className="h-4 w-4" />
          {newHandoutCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-background">
              {newHandoutCount}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setActiveTab('rules')} className={tabClass(activeTab === 'rules')} aria-label="Rules">
          <BookOpen className="h-4 w-4" />
        </button>
      </div>
    );
  }

  function renderTabContent() {
    if (activeTab === 'character') return renderCharacterTab();
    if (activeTab === 'party') return <PartyStatusPanel campaignId={campaignId} />;
    if (activeTab === 'notes') return <PlayerNotesTab campaignId={campaignId} />;
    if (activeTab === 'shared-notes') return <SharedNotesTab campaignId={campaignId} />;
    if (activeTab === 'handouts') return <HandoutsTab campaignId={campaignId} isDM={false} />;
    if (activeTab === 'rules') return <QuickReference campaignId={campaignId} />;
    return null;
  }

  function renderCharacterTab() {
    return (
      <>
        {myEntry && (
          <div className="mb-2 space-y-2 rounded border border-border/60 bg-background/30 p-2">
            <ConcentrationBadge campaignId={campaignId} entry={myEntry} canEdit />
            <DeathSavesTracker
              campaignId={campaignId}
              entry={myEntry}
              canEditPcDeathSaves
            />
            <DownedStatePanel
              campaignId={campaignId}
              entry={myEntry}
              canEdit={false}
            />
          </div>
        )}
        {myCharacter && renderConditions()}
        <LiveCharacterSheet campaignId={campaignId} isDM={false} />
      </>
    );
  }

  function renderConditions() {
    return (
      <div className="mb-2 rounded border border-border/60 bg-background/30 p-2">
        <div className="flex items-center justify-between">
          <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Conditions
          </p>
          <button
            type="button"
            onClick={() => setShowConditionPicker((prev) => !prev)}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            {showConditionPicker ? 'Done' : 'Edit'}
          </button>
        </div>
        {myConditions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {myConditions.map((c) => (
              <span key={c} className="rounded-full bg-blood/15 px-2 py-0.5 text-[10px] font-medium text-[hsl(0,55%,60%)] font-[Cinzel] uppercase tracking-wider">
                {c}
              </span>
            ))}
          </div>
        )}
        {myConditions.length === 0 && !showConditionPicker && (
          <p className="mt-1 text-[10px] text-muted-foreground/60 italic">No active conditions</p>
        )}
        {showConditionPicker && (
          <div className="mt-2 flex flex-wrap gap-1">
            {CONDITIONS.map((c) => {
              const active = myConditions.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium font-[Cinzel] uppercase tracking-wider transition-colors ${
                    active
                      ? 'bg-blood/20 text-[hsl(0,55%,60%)] border border-blood/40'
                      : 'bg-accent/40 text-muted-foreground hover:bg-accent/60 border border-transparent'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

function tabClass(active: boolean): string {
  return `inline-flex h-9 items-center justify-center rounded-md border text-muted-foreground transition-colors ${
    active
      ? 'border-primary/40 bg-primary/15 text-primary'
      : 'border-border/60 bg-background/40 hover:text-foreground'
  }`;
}
