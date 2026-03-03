import { useEffect, useState } from 'react';
import { BookOpen, ScrollText, User } from 'lucide-react';
import { LiveCharacterSheet } from '@/components/session/LiveCharacterSheet';
import { SessionNotesTab } from '@/components/session/SessionNotesTab';
import { QuickReference } from '@/components/session/QuickReference';

type PlayerTab = 'character' | 'notes' | 'rules';

interface PlayerSidebarV2Props {
  campaignId: string;
}

export default function PlayerSidebarV2({ campaignId }: PlayerSidebarV2Props) {
  const [activeTab, setActiveTab] = useState<PlayerTab>(() => {
    const saved = localStorage.getItem('fablheim:session-v2-player-tab');
    return (saved as PlayerTab) || 'character';
  });

  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-player-tab', activeTab);
  }, [activeTab]);

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-3 gap-1 border-b border-border/70 p-2">
        <button type="button" onClick={() => setActiveTab('character')} className={tabClass(activeTab === 'character')} aria-label="Character">
          <User className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('notes')} className={tabClass(activeTab === 'notes')} aria-label="Notes">
          <ScrollText className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('rules')} className={tabClass(activeTab === 'rules')} aria-label="Rules">
          <BookOpen className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {activeTab === 'character' && <LiveCharacterSheet campaignId={campaignId} isDM={false} />}
        {activeTab === 'notes' && <SessionNotesTab campaignId={campaignId} />}
        {activeTab === 'rules' && <QuickReference campaignId={campaignId} />}
      </div>
    </div>
  );
}

function tabClass(active: boolean): string {
  return `inline-flex h-9 items-center justify-center rounded-md border text-muted-foreground transition-colors ${
    active
      ? 'border-primary/40 bg-primary/15 text-primary'
      : 'border-border/60 bg-background/40 hover:text-foreground'
  }`;
}
