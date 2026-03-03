import { useEffect, useState } from 'react';
import { Globe, MapPin, Plus, ScrollText, Sparkles, Swords, Target, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useWorldEntities, useCreateWorldEntity } from '@/hooks/useWorldEntities';
import { useEncounters } from '@/hooks/useEncounters';
import { useNotebook, useCreateNote } from '@/hooks/useNotebook';
import { useCharacters } from '@/hooks/useCharacters';
import { useInitiative } from '@/hooks/useLiveSession';
import { AIToolsTab } from '@/components/session/AIToolsTab';
import { InitiativeTracker } from '@/components/session/InitiativeTracker';
import InlineEncounterBuilder from '@/components/session/InlineEncounterBuilder';
import type { WorldEntityType } from '@/types/campaign';

type DMTab = 'world' | 'encounters' | 'notes' | 'party' | 'initiative' | 'ai';
type AIFocusTool = 'npc' | 'encounter' | 'quest' | 'lore' | 'location';

interface DMSidebarV2Props {
  campaignId: string;
  isDM: boolean;
}

export default function DMSidebarV2({ campaignId }: DMSidebarV2Props) {
  const [activeTab, setActiveTab] = useState<DMTab>(() => {
    const saved = localStorage.getItem('fablheim:session-v2-dm-tab');
    return (saved as DMTab) || 'world';
  });
  const [showQuickAIEverywhere, setShowQuickAIEverywhere] = useState(() => {
    const saved = localStorage.getItem('fablheim:session-v2-show-quick-ai');
    return saved !== '0';
  });
  const [aiFocusSeed, setAiFocusSeed] = useState(0);

  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-dm-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('fablheim:session-v2-show-quick-ai', showQuickAIEverywhere ? '1' : '0');
  }, [showQuickAIEverywhere]);

  function openAITool(tool: AIFocusTool) {
    localStorage.setItem('fablheim:session-v2-ai-focus', tool);
    setAiFocusSeed((v) => v + 1);
    setActiveTab('ai');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-6 gap-1 border-b border-border/70 p-2">
        <button type="button" onClick={() => setActiveTab('world')} className={tabClass(activeTab === 'world')} aria-label="World">
          <Globe className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('encounters')} className={tabClass(activeTab === 'encounters')} aria-label="Encounters">
          <Swords className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('initiative')} className={tabClass(activeTab === 'initiative')} aria-label="Initiative">
          <Target className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('notes')} className={tabClass(activeTab === 'notes')} aria-label="Notes">
          <ScrollText className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('party')} className={tabClass(activeTab === 'party')} aria-label="Party">
          <Users className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setActiveTab('ai')} className={tabClass(activeTab === 'ai')} aria-label="AI Tools">
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-border/50 px-2 py-1.5">
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

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {showQuickAIEverywhere && activeTab !== 'ai' && (
          <QuickAIActions activeTab={activeTab} onOpenTool={openAITool} />
        )}

        {activeTab === 'world' && <CompactWorldPanel campaignId={campaignId} />}
        {activeTab === 'encounters' && <CompactEncountersPanel campaignId={campaignId} />}
        {activeTab === 'initiative' && <InitiativeTracker campaignId={campaignId} isDM />}
        {activeTab === 'notes' && <CompactNotesPanel campaignId={campaignId} />}
        {activeTab === 'party' && <CompactPartyPanel campaignId={campaignId} />}
        {activeTab === 'ai' && <AIToolsTab campaignId={campaignId} focusSeed={aiFocusSeed} />}
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

function QuickAIActions({
  activeTab,
  onOpenTool,
}: {
  activeTab: DMTab;
  onOpenTool: (tool: AIFocusTool) => void;
}) {
  if (activeTab !== 'world' && activeTab !== 'encounters') {
    return null;
  }

  return (
    <div className="mb-2 rounded border border-primary/30 bg-primary/5 p-2">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Quick AI actions</div>
      {activeTab === 'world' ? (
        <div className="grid grid-cols-3 gap-1">
          <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => onOpenTool('npc')}>
            NPC
          </button>
          <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => onOpenTool('location')}>
            Location
          </button>
          <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => onOpenTool('quest')}>
            Quest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          <button type="button" className="rounded bg-background/60 px-2 py-1 text-xs hover:bg-background" onClick={() => onOpenTool('encounter')}>
            Encounter
          </button>
        </div>
      )}
    </div>
  );
}

function CompactWorldPanel({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useWorldEntities(campaignId);
  const createEntity = useCreateWorldEntity();
  const [quickType, setQuickType] = useState<'npc' | 'location' | 'quest' | null>(null);
  const [quickName, setQuickName] = useState('');
  const entities = data ?? [];

  const counts = entities.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  function handleQuickCreate() {
    if (!quickType || !quickName.trim() || createEntity.isPending) return;
    createEntity.mutate(
      {
        campaignId,
        data: {
          name: quickName.trim(),
          type: quickType === 'npc' ? 'npc' : quickType === 'quest' ? 'quest' : 'location',
        },
      },
      {
        onSuccess: () => {
          toast.success(`${quickType === 'npc' ? 'NPC' : quickType === 'quest' ? 'Quest' : 'Location'} created`);
          setQuickType(null);
          setQuickName('');
        },
        onError: () => toast.error('Failed to create world entry'),
      },
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1 rounded border border-border/60 bg-background/30 p-2">
        <div className="flex gap-1">
          <button type="button" className={miniSelect(quickType === 'npc')} onClick={() => setQuickType('npc')}>
            + NPC
          </button>
          <button type="button" className={miniSelect(quickType === 'location')} onClick={() => setQuickType('location')}>
            + Location
          </button>
          <button type="button" className={miniSelect(quickType === 'quest')} onClick={() => setQuickType('quest')}>
            + Quest
          </button>
        </div>
        {quickType ? (
          <div className="flex gap-1">
            <input
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder={quickType === 'npc' ? 'NPC name...' : quickType === 'quest' ? 'Quest name...' : 'Location name...'}
              className="min-w-0 flex-1 rounded border border-input bg-input px-2 py-1 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
            />
            <button
              type="button"
              className="rounded bg-primary/20 px-2 py-1 text-xs text-primary disabled:opacity-50"
              disabled={!quickName.trim() || createEntity.isPending}
              onClick={handleQuickCreate}
            >
              Add
            </button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <CompactLoadingRows />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1">
            <CountPill label="NPCs" value={countByTypes(counts, ['npc', 'npc_minor'])} />
            <CountPill label="Locations" value={countByTypes(counts, ['location', 'location_detail'])} />
            <CountPill label="Quests" value={countByTypes(counts, ['quest'])} />
            <CountPill label="Lore" value={countByTypes(counts, ['lore'])} />
          </div>
          <div className="space-y-1">
            {entities.length === 0 ? (
              <CompactEmptyState text="No world entries yet." />
            ) : (
              entities.slice(0, 10).map((entity) => (
                <CompactListRow key={entity._id} name={entity.name} meta={labelForType(entity.type)} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CompactEncountersPanel({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useEncounters(campaignId);
  const [creating, setCreating] = useState(false);
  const encounters = data ?? [];

  const ready = encounters.filter((e) => e.status === 'ready').length;
  const used = encounters.filter((e) => e.status === 'used').length;

  if (creating) {
    return (
      <InlineEncounterBuilder
        campaignId={campaignId}
        compact
        onDone={() => setCreating(false)}
      />
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2 py-1.5 text-xs text-primary hover:bg-primary/15 transition-colors font-[Cinzel] uppercase tracking-wider"
      >
        <Plus className="h-3.5 w-3.5" />
        Create Encounter
      </button>

      {isLoading ? (
        <CompactLoadingRows />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1">
            <CountPill label="Ready" value={ready} />
            <CountPill label="Draft" value={encounters.length - ready - used} />
            <CountPill label="Used" value={used} />
          </div>
          <div className="space-y-1">
            {encounters.length === 0 ? (
              <CompactEmptyState text="No encounters created." />
            ) : (
              encounters.slice(0, 10).map((encounter) => (
                <CompactListRow
                  key={encounter._id}
                  name={encounter.name}
                  meta={`${encounter.difficulty} · ${encounter.estimatedXP ?? 0} XP`}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CompactNotesPanel({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useNotebook(campaignId, { limit: 12 });
  const createNote = useCreateNote();
  const [newTitle, setNewTitle] = useState('');
  const notes = data?.notes ?? [];

  function handleAddNote() {
    if (!newTitle.trim() || createNote.isPending) return;
    createNote.mutate(
      { campaignId, title: newTitle.trim(), category: 'session_notes' },
      {
        onSuccess: () => {
          toast.success('Note created');
          setNewTitle('');
        },
        onError: () => toast.error('Failed to create note'),
      },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded border border-border/60 bg-background/30 p-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Quick note title..."
          className="min-w-0 flex-1 rounded border border-input bg-input px-2 py-1 text-xs"
          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
        />
        <button
          type="button"
          className="rounded bg-primary/20 px-2 py-1 text-xs text-primary disabled:opacity-50"
          disabled={!newTitle.trim() || createNote.isPending}
          onClick={handleAddNote}
        >
          Add
        </button>
      </div>

      {isLoading ? (
        <CompactLoadingRows />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1">
            <CountPill label="Pinned" value={notes.filter((n) => n.isPinned).length} />
            <CountPill label="General" value={notes.filter((n) => n.category === 'general').length} />
          </div>
          <div className="space-y-1">
            {notes.length === 0 ? (
              <CompactEmptyState text="No notes created." />
            ) : (
              notes.slice(0, 10).map((note) => (
                <CompactListRow
                  key={note._id}
                  name={note.title}
                  meta={note.category.replace('_', ' ')}
                  accent={note.isPinned}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CompactPartyPanel({ campaignId }: { campaignId: string }) {
  const { data: characters, isLoading } = useCharacters(campaignId);
  const { data: initiative } = useInitiative(campaignId);
  const party = characters ?? [];

  if (isLoading) {
    return <CompactLoadingRows />;
  }

  return (
    <div className="space-y-1.5">
      {party.length === 0 ? (
        <CompactEmptyState text="No characters in campaign." />
      ) : (
        party.map((character) => {
          const entry = initiative?.entries?.find(
            (candidate) => candidate.characterId === character._id || candidate.name === character.name,
          );
          const hp = entry?.currentHp ?? character.hp?.current;
          const maxHp = entry?.maxHp ?? character.hp?.max;
          const hpPercent = maxHp && maxHp > 0 ? Math.max(0, Math.min(100, ((hp ?? 0) / maxHp) * 100)) : 0;
          return (
            <div key={character._id} className="rounded border border-border/60 bg-background/40 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">{character.name}</p>
                <div className="shrink-0 text-xs text-muted-foreground">AC {entry?.ac ?? character.ac}</div>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all ${
                    hpPercent <= 25 ? 'bg-red-500' : hpPercent <= 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                HP {hp ?? 0}/{maxHp ?? 0}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function miniSelect(active: boolean): string {
  return `rounded px-2 py-1 text-xs ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`;
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border/60 bg-background/40 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function CompactListRow({
  name,
  meta,
  accent,
}: {
  name: string;
  meta?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 rounded border border-border/60 bg-background/30 px-2 py-1.5">
      <MapPin className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{name}</p>
        {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </div>
  );
}

function CompactLoadingRows() {
  return (
    <div className="space-y-1.5 animate-pulse">
      <div className="h-10 rounded bg-muted/60" />
      <div className="h-10 rounded bg-muted/60" />
      <div className="h-10 rounded bg-muted/60" />
    </div>
  );
}

function CompactEmptyState({ text }: { text: string }) {
  return <p className="rounded border border-dashed border-border/60 p-2 text-center text-xs text-muted-foreground">{text}</p>;
}

function countByTypes(counts: Record<string, number>, types: WorldEntityType[]): number {
  return types.reduce((sum, type) => sum + (counts[type] ?? 0), 0);
}

function labelForType(type: WorldEntityType): string {
  switch (type) {
    case 'npc':
    case 'npc_minor':
      return 'NPC';
    case 'location':
    case 'location_detail':
      return 'Location';
    case 'quest':
      return 'Quest';
    case 'lore':
      return 'Lore';
    case 'item':
      return 'Item';
    case 'faction':
      return 'Faction';
    case 'event':
      return 'Event';
    default:
      return 'Entry';
  }
}
