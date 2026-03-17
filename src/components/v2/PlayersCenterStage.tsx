import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  ArrowUpCircle,
  Compass,
  Crown,
  HeartPulse,
  Layers,
  MapPin,
  Medal,
  Minus,
  Plus,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Swords,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { EditableTextSection } from '@/components/characters/EditableTextSection';
import { HPTracker } from '@/components/characters/HPTracker';
import { CombatStats } from '@/components/characters/CombatStats';
import { FateCoreSkillsPanel } from '@/components/characters/FateCoreSkillsPanel';
import { InventoryPanel } from '@/components/character/inventory/InventoryPanel';
import { SpellBook } from '@/components/character/spells/SpellBook';
import { XPTracker } from '@/components/character/progression/XPTracker';
import { ContentBrowser } from '@/components/content/ContentBrowser';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';
import { useCampaign } from '@/hooks/useCampaigns';
import { useContentEntry } from '@/hooks/useContentRegistry';
import { formatCharacterClass } from '@/lib/character-utils';
import { shellPanelClass } from '@/lib/panel-styles';
import { PlayersProvider, usePlayersContext } from './players/PlayersContext';
import { useNavigationBus } from './NavigationBusContext';
import type { CampaignArc, Character, Session, WorldEntity } from '@/types/campaign';
import {
  dedupeEntities,
  dedupeStrings,
  extractSessionMoment,
  sessionMentionsCharacter,
} from '@/lib/session-utils';

type CharacterWorkspaceMode = 'overview' | 'sheet' | 'inventory' | 'spells' | 'campaign';

type CharacterContext = {
  roleLabel: string;
  stateLabel: string;
  stateTone: string;
  hook: string;
  traitTags: string[];
  recentMoment: string | null;
  relatedLocations: WorldEntity[];
  relatedThreads: WorldEntity[];
  mentionedSessions: Session[];
};

// ── Public export — accepts original props and self-wraps with provider ───────

interface PlayersCenterStageProps {
  campaignId: string;
  isDM: boolean;
  onOpenWorldEntity: (entityId: string) => void;
  onOpenArcs?: () => void;
  onTabChange?: (tab: string) => void;
}

export function PlayersCenterStage({ campaignId, isDM, onOpenWorldEntity, onOpenArcs, onTabChange }: PlayersCenterStageProps) {
  return (
    <PlayersProvider
      campaignId={campaignId}
      isDM={isDM}
      onOpenWorldEntity={onOpenWorldEntity}
      onOpenArcs={onOpenArcs ?? (() => {})}
    >
      <PlayersCenterStageInner onTabChange={onTabChange} />
    </PlayersProvider>
  );
}

function PlayersCenterStageInner({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const {
    campaignId,
    isDM,
    onOpenWorldEntity,
    onOpenArcs,
    party,
    sessionList,
    allWorldEntities,
    allArcs,
    isLoading,
    resolvedSelectedCharacterId,
    selectedCharacter,
    setSelectedCharacterId,
  } = usePlayersContext();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Loading party…</p>
      </div>
    );
  }

  if (!party.length) {
    return renderEmptyParty();
  }

  const partySnapshot = buildPartySnapshot(party, sessionList);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      <section className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader(partySnapshot)}
        {renderShellBody()}
      </section>
    </div>
  );

  function renderEmptyParty() {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-dashed border-[hsla(32,26%,26%,0.42)] bg-[hsla(24,15%,11%,0.9)] p-8 text-center">
          <p className="text-[14px] text-[hsl(35,24%,92%)]" style={{ fontFamily: "'Cinzel', serif" }}>
            No party assembled yet
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[hsl(30,12%,58%)]">
            Once characters join the campaign, this page becomes the party table: who is here, what shape they are in, and what is pressing on them now.
          </p>
        </div>
      </div>
    );
  }

  function renderShellHeader(snapshot: ReturnType<typeof buildPartySnapshot>) {
    const title = selectedCharacter?.name ?? 'Party Overview';
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderShellHeaderLeft(title)}
          {renderShellHeaderRight(snapshot)}
        </div>
      </div>
    );
  }

  function renderShellHeaderLeft(title: string) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          Party Roster
        </p>
        <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
          {title}
        </h2>
      </div>
    );
  }

  function renderShellHeaderRight(snapshot: ReturnType<typeof buildPartySnapshot>) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[hsla(38,60%,52%,0.24)] bg-[hsla(38,70%,46%,0.08)] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-[hsl(38,82%,63%)]">
          {snapshot.partyState}
        </span>
        <span className="rounded-full border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.7)] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
          {snapshot.partySize} adventurer{snapshot.partySize === 1 ? '' : 's'}
        </span>
      </div>
    );
  }

  function renderShellBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 pb-10">
          <PartyOverviewCard snapshot={buildPartySnapshot(party, sessionList)} />
          {renderRosterAndFocus()}
        </div>
      </div>
    );
  }

  function renderRosterAndFocus() {
    return (
      <div className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
        <PartyRoster
          characters={party}
          sessions={sessionList}
          worldEntities={allWorldEntities}
          selectedCharacterId={resolvedSelectedCharacterId}
          onSelect={setSelectedCharacterId}
        />
        {selectedCharacter ? (
          <CharacterFocusPanel
            key={selectedCharacter._id}
            character={selectedCharacter}
            campaignId={campaignId}
            isDM={isDM}
            context={buildCharacterContext(selectedCharacter, sessionList, allWorldEntities)}
            involvedArcs={allArcs.filter((arc) => arcInvolvesCharacter(arc, selectedCharacter))}
            onOpenWorldEntity={onOpenWorldEntity}
            onOpenArcs={onOpenArcs}
            onTabChange={onTabChange}
          />
        ) : null}
      </div>
    );
  }
}

function PartyOverviewCard({
  snapshot,
}: {
  snapshot: ReturnType<typeof buildPartySnapshot>;
}) {
  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.42)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.97),hsla(24,14%,11%,0.99))] p-5">
      {renderPartyOverviewTop(snapshot)}
      {renderPartyOverviewPills(snapshot)}
    </section>
  );

  function renderPartyOverviewTop(s: typeof snapshot) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Party Snapshot</p>
          <h3 className="mt-1 text-[20px] text-[hsl(35,24%,92%)]" style={{ fontFamily: "'Cinzel', serif" }}>
            {s.headline}
          </h3>
          <p className="mt-2 max-w-[720px] text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
            {s.summary}
          </p>
        </div>
        <div className="rounded-full border border-[hsla(38,60%,52%,0.24)] bg-[hsla(38,70%,46%,0.08)] px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(38,82%,63%)]">
          {s.partyState}
        </div>
      </div>
    );
  }

  function renderPartyOverviewPills(s: typeof snapshot) {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <OverviewPill icon={Users} label="Party" value={`${s.partySize} adventurer${s.partySize === 1 ? '' : 's'}`} detail={s.roleSpread} />
        <OverviewPill icon={HeartPulse} label="Condition" value={s.healthLine} detail={s.conditionLine} />
        <OverviewPill icon={ScrollText} label="Recent Play" value={s.recentSessionLabel} detail={s.recentEvent} />
      </div>
    );
  }
}

function OverviewPill({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[hsla(32,24%,30%,0.28)] bg-[hsla(24,16%,12%,0.7)] px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-[13px] text-[hsl(35,24%,92%)]">{value}</p>
      <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{detail}</p>
    </div>
  );
}

function PartyRoster({
  characters,
  sessions,
  worldEntities,
  selectedCharacterId,
  onSelect,
}: {
  characters: Character[];
  sessions: Session[];
  worldEntities: WorldEntity[];
  selectedCharacterId: string | null;
  onSelect: (characterId: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      {renderRosterHeader()}
      <div className="space-y-3">
        {characters.map((character) => renderRosterCard(character))}
      </div>
    </section>
  );

  function renderRosterHeader() {
    return (
      <div className="mb-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">Party Roster</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
          A live lineup of who is at the table, what shape they are in, and what campaign pressure is sitting on them.
        </p>
      </div>
    );
  }

  function renderRosterCard(character: Character) {
    const context = buildCharacterContext(character, sessions, worldEntities);
    const selected = selectedCharacterId === character._id;
    return (
      <button
        key={character._id}
        type="button"
        onClick={() => onSelect(character._id)}
        className={`w-full rounded-2xl border p-4 text-left transition-colors ${
          selected
            ? 'border-[hsla(38,60%,52%,0.36)] bg-[hsla(38,70%,46%,0.08)]'
            : 'border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] hover:bg-[hsl(24,20%,15%)]'
        }`}
      >
        <div className="flex items-start gap-3">
          <PortraitSwatch character={character} />
          {renderRosterCardBody(character, context)}
        </div>
      </button>
    );
  }

  function renderRosterCardBody(character: Character, context: CharacterContext) {
    return (
      <div className="min-w-0 flex-1">
        {renderRosterCardHead(character, context)}
        {renderRosterCardMetrics(character, context)}
        {renderRosterCardTags(context)}
      </div>
    );
  }

  function renderRosterCardHead(character: Character, context: CharacterContext) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] text-[hsl(35,24%,92%)]">{character.name}</p>
          <p className="mt-0.5 text-[11px] text-[hsl(30,12%,58%)]">
            {formatCharacterIdentity(character)} · {context.roleLabel}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] ${context.stateTone}`}>
          {context.stateLabel}
        </span>
      </div>
    );
  }

  function renderRosterCardMetrics(character: Character, context: CharacterContext) {
    return (
      <div className="mt-3 grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-2">
          <RosterMetric icon={HeartPulse} label="HP" value={`${character.hp.current}/${character.hp.max}${character.hp.temp ? ` +${character.hp.temp}` : ''}`} />
          <RosterMetric icon={Shield} label="Combat" value={`AC ${character.ac} · Init ${formatSigned(character.initiativeBonus)}`} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">In Play</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">{context.hook}</p>
        </div>
      </div>
    );
  }

  function renderRosterCardTags(context: CharacterContext) {
    return (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {context.traitTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[hsla(32,24%,30%,0.32)] px-2 py-0.5 text-[11px] text-[hsl(35,24%,88%)]"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }
}

function PortraitSwatch({ character }: { character: Character }) {
  if (character.portrait?.url) {
    return (
      <img
        src={character.portrait.url}
        alt={`${character.name} portrait`}
        className="h-16 w-16 shrink-0 rounded-xl border border-[hsla(32,24%,30%,0.3)] object-cover"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[hsla(32,24%,30%,0.3)] bg-[hsla(38,70%,46%,0.08)] text-[hsl(38,82%,63%)]">
      <span className="text-[20px]" style={{ fontFamily: "'Cinzel', serif" }}>
        {character.name.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

function RosterMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HeartPulse;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[hsl(30,16%,72%)]">
      <Icon className="h-3.5 w-3.5 text-[hsl(38,82%,63%)]" />
      <span className="text-[hsl(30,12%,58%)]">{label}</span>
      <span className="text-[hsl(35,24%,92%)]">{value}</span>
    </div>
  );
}

function CharacterFocusPanel({
  character,
  campaignId,
  isDM,
  context,
  involvedArcs,
  onOpenWorldEntity,
  onOpenArcs,
  onTabChange,
}: {
  character: Character;
  campaignId: string;
  isDM: boolean;
  context: CharacterContext;
  involvedArcs: CampaignArc[];
  onOpenWorldEntity: (entityId: string) => void;
  onOpenArcs?: () => void;
  onTabChange?: (tab: string) => void;
}) {
  const {
    updateCharacter,
    takeDamage,
    heal,
    addTempHP,
    rollDeathSave,
    setLevel,
    updateFateSkill,
  } = usePlayersContext();

  const hasSpellBook = useCampaignModuleEnabled(campaignId, 'spell-slots-dnd');
  const hasFateSkills = useCampaignModuleEnabled(campaignId, 'skills-fate-core');
  const noteValue = (character.mechanicData?.notes as string | undefined) ?? '';
  const passiveSkills = Object.entries(character.passiveScores ?? {});
  const hasSpells = hasSpellBook || Boolean(character.spellSlotsPf2e) || hasSpellSlots(character);
  const [mode, setMode] = useState<CharacterWorkspaceMode>('overview');
  const [showClassBrowser, setShowClassBrowser] = useState(false);
  const activeMode = mode === 'spells' && !hasSpells ? 'overview' : mode;
  const { data: campaign } = useCampaign(campaignId);

  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
      {renderFocusHead()}
      {renderModeTabs()}
      <div className="mt-4">
        {renderFocusContent()}
      </div>
      <ContentBrowser
        open={showClassBrowser}
        onClose={() => setShowClassBrowser(false)}
        onSelect={(entry) => {
          const classes = character.classes ?? [];
          const updated = [
            ...classes,
            {
              classContentId: entry.contentId,
              className: entry.name,
              level: 1,
              subclassContentId: null,
              subclassName: null,
              isPrimary: classes.length === 0,
            },
          ];
          updateCharacter.mutate(
            { id: character._id, campaignId, data: { classes: updated } },
            { onError: () => toast.error('Failed to add class') },
          );
          setShowClassBrowser(false);
        }}
        contentType="class"
        system={campaign?.system ?? 'dnd5e'}
        campaignId={campaignId}
        label="Classes"
      />
    </section>
  );

  function renderFocusHead() {
    return (
      <div className="flex items-start gap-4">
        <PortraitSwatch character={character} />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] text-[hsl(38,36%,82%)]" style={{ fontFamily: "'Cinzel', serif" }}>
            {character.name}
          </p>
          <p className="mt-1 text-[12px] text-[hsl(30,12%,58%)]">
            {formatCharacterIdentity(character)} · {context.roleLabel}
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
            {context.hook}
          </p>
        </div>
      </div>
    );
  }

  function renderModeTabs() {
    const tabs: { id: CharacterWorkspaceMode; label: string }[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'sheet', label: 'Sheet' },
      { id: 'inventory', label: 'Inventory' },
      ...(hasSpells ? [{ id: 'spells' as const, label: 'Spells' }] : []),
      { id: 'campaign', label: 'Campaign' },
    ];
    return (
      <div className="mt-4 flex flex-wrap gap-2 border-b border-[hsla(32,24%,28%,0.28)] pb-3">
        {tabs.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
              activeMode === option.id
                ? 'border-[hsla(38,60%,52%,0.36)] bg-[hsla(38,70%,46%,0.08)] text-[hsl(38,82%,63%)]'
                : 'border-[hsla(32,24%,30%,0.28)] text-[hsl(30,12%,58%)] hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  function renderFocusContent() {
    if (activeMode === 'overview') return renderOverviewMode();
    if (activeMode === 'sheet') return renderSheetMode();
    if (activeMode === 'inventory') return renderInventoryMode();
    if (activeMode === 'spells' && hasSpells) return renderSpellsMode();
    if (activeMode === 'campaign') return renderCampaignMode();
    return null;
  }

  function renderOverviewMode() {
    return (
      <div className="space-y-5">
        <DetailSection title="Current State" icon={Activity}>
          {renderCurrentStateContent()}
        </DetailSection>
        {isDM && renderQuickActionsSection()}
      </div>
    );
  }

  function renderCurrentStateContent() {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <PlainStat label="Level" value={String(character.level)} />
          <PlainStat label="Class / Ancestry" value={buildIdentityLine(character)} />
          <PlainStat label="Condition" value={buildConditionSummary(character)} />
        </div>
        <HPTracker
          character={character}
          editable={isDM}
          onDamage={(amount) =>
            takeDamage.mutate({ id: character._id, amount }, { onError: () => toast.error('Failed to apply damage') })
          }
          onHeal={(amount) =>
            heal.mutate({ id: character._id, amount }, { onError: () => toast.error('Failed to heal') })
          }
          onTempHP={(amount) =>
            addTempHP.mutate({ id: character._id, amount }, { onError: () => toast.error('Failed to add temp HP') })
          }
          onDeathSave={(result) =>
            rollDeathSave.mutate({ id: character._id, result }, { onError: () => toast.error('Failed to update death save') })
          }
        />
        <div className="grid gap-3 md:grid-cols-3">
          <PlainStat label="AC" value={String(character.ac)} />
          <PlainStat label="Initiative" value={formatSigned(character.initiativeBonus)} />
          <PlainStat label="Speed" value={`${character.speed} ft`} />
        </div>
      </div>
    );
  }

  function renderQuickActionsSection() {
    return (
      <DetailSection title="Quick Actions" icon={Shield}>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setMode('inventory')}>
            Give Item
          </Button>
          <Button type="button" variant="outline" onClick={() => setMode('campaign')}>
            Open Campaign Notes
          </Button>
          <Button type="button" variant="outline" onClick={() => setMode('sheet')}>
            Open Sheet
          </Button>
        </div>
      </DetailSection>
    );
  }

  function renderSheetMode() {
    return (
      <div className="space-y-5">
        <DetailSection title="Attributes" icon={Crown}>
          {renderAttributeTable()}
        </DetailSection>
        <DetailSection title="Core Mechanics" icon={Compass}>
          {renderCoreMechanicsContent()}
        </DetailSection>
        {renderSkillsSection()}
        {renderClassesSection()}
        {renderContentDetailsSection()}
        {renderLevelSection()}
      </div>
    );
  }

  function renderContentDetailsSection() {
    const raceId = character.raceContentId;
    const classId = character.classes?.[0]?.classContentId;
    if (!raceId && !classId) return null;

    return (
      <DetailSection title="Content Details" icon={ScrollText}>
        <div className="space-y-2">
          {raceId && <ContentDetailSection contentId={raceId} label="Race" />}
          {classId && <ContentDetailSection contentId={classId} label="Class" />}
        </div>
      </DetailSection>
    );
  }

  function renderAttributeTable() {
    return (
      <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)]">
        {buildAttributeBlocks(character).map((attribute, index, all) => (
          <SheetRow
            key={attribute.label}
            label={attribute.label}
            value={attribute.value}
            detail={attribute.detail}
            isLast={index === all.length - 1}
          />
        ))}
      </div>
    );
  }

  function renderCoreMechanicsContent() {
    return (
      <div className="space-y-4">
        <CombatStats character={character} editable={false} />
        <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)]">
          <SheetRow label="Condition" value={buildConditionSummary(character)} detail={character.exhaustionLevel > 0 ? `Exhaustion ${character.exhaustionLevel}` : 'No exhaustion showing'} />
          <SheetRow label="Survival" value={renderDeathSaveLine(character)} detail="Death save pressure only matters while the character is down." isLast />
        </div>
      </div>
    );
  }

  function renderSkillsSection() {
    return (
      <DetailSection title="Skills" icon={Activity}>
        {hasFateSkills ? (
          <FateCoreSkillsPanel
            skills={(character.systemData?.fateSkills ?? {}) as Record<string, number>}
            editable={isDM}
            onUpdate={(skill, rating) =>
              updateFateSkill.mutate({ id: character._id, skill, rating }, { onError: () => toast.error('Failed to update skill') })
            }
          />
        ) : (
          <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)]">
            {passiveSkills.map(([label, value], index) => (
              <SheetRow
                key={label}
                label={startCase(label)}
                value={String(value)}
                detail="Passive score"
                isLast={index === passiveSkills.length - 1}
              />
            ))}
          </div>
        )}
      </DetailSection>
    );
  }

  function renderClassesSection() {
    const classes = character.classes ?? [];
    if (!classes.length && !isDM) return null;

    return (
      <DetailSection title="Classes" icon={Layers}>
        <div className="space-y-2">
          {classes.map((cls, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)] px-4 py-2.5"
            >
              {cls.isPrimary && (
                <span className="shrink-0 rounded bg-[hsla(38,60%,52%,0.18)] px-1.5 py-0.5 text-[10px] text-[hsl(38,82%,63%)]">Primary</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[hsl(35,24%,92%)]">
                  {cls.className}{cls.subclassName ? ` (${cls.subclassName})` : ''}
                </p>
                <p className="text-[11px] text-[hsl(30,12%,58%)]">Level {cls.level}</p>
              </div>
              {isDM && (
                <div className="flex items-center gap-1.5">
                  {!cls.isPrimary && (
                    <button
                      type="button"
                      title="Set as primary"
                      className="rounded-md border border-[hsla(38,60%,52%,0.24)] p-1 text-[hsl(30,12%,58%)] transition-colors hover:bg-[hsla(38,60%,52%,0.12)] hover:text-[hsl(38,82%,63%)]"
                      onClick={() => {
                        const updated = classes.map((c, i) => ({ ...c, isPrimary: i === idx }));
                        updateCharacter.mutate(
                          { id: character._id, campaignId, data: { classes: updated } },
                          { onError: () => toast.error('Failed to update primary class') },
                        );
                      }}
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-md border border-[hsla(32,24%,30%,0.28)] p-1 text-[hsl(30,12%,58%)] transition-colors hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
                    onClick={() => {
                      const updated = [...classes];
                      if (updated[idx].level > 1) {
                        updated[idx] = { ...updated[idx], level: updated[idx].level - 1 };
                        updateCharacter.mutate(
                          { id: character._id, campaignId, data: { classes: updated } },
                          { onError: () => toast.error('Failed to update class') },
                        );
                      }
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-[1.25rem] text-center text-[12px] text-[hsl(35,24%,92%)]">{cls.level}</span>
                  <button
                    type="button"
                    className="rounded-md border border-[hsla(32,24%,30%,0.28)] p-1 text-[hsl(30,12%,58%)] transition-colors hover:bg-[hsl(24,20%,15%)] hover:text-[hsl(35,24%,92%)]"
                    onClick={() => {
                      const updated = [...classes];
                      updated[idx] = { ...updated[idx], level: updated[idx].level + 1 };
                      updateCharacter.mutate(
                        { id: character._id, campaignId, data: { classes: updated } },
                        { onError: () => toast.error('Failed to update class') },
                      );
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="ml-1 rounded-md border border-[hsla(0,60%,50%,0.24)] p-1 text-[hsl(0,60%,65%)] transition-colors hover:bg-[hsla(0,60%,50%,0.12)]"
                    onClick={() => {
                      const updated = classes.filter((_, i) => i !== idx);
                      updateCharacter.mutate(
                        { id: character._id, campaignId, data: { classes: updated } },
                        { onError: () => toast.error('Failed to remove class') },
                      );
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {isDM && (
            <button
              type="button"
              className="w-full rounded-xl border border-dashed border-[hsla(32,24%,30%,0.32)] px-4 py-2.5 text-[12px] text-[hsl(30,12%,58%)] transition-colors hover:border-[hsla(38,60%,52%,0.34)] hover:text-[hsl(38,82%,63%)]"
              onClick={() => setShowClassBrowser(true)}
            >
              + Add Class
            </button>
          )}
        </div>
      </DetailSection>
    );
  }

  function renderLevelSection() {
    return (
      <DetailSection title="Level & XP" icon={Medal}>
        <div className="space-y-3">
          <XPTracker characterId={character._id} isDM={isDM} />
          {isDM && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLevel.mutate({ characterId: character._id, level: character.level + 1 })}
                disabled={setLevel.isPending}
              >
                <ArrowUpCircle className="mr-1.5 h-4 w-4" />
                Trigger Level Up
              </Button>
            </div>
          )}
        </div>
      </DetailSection>
    );
  }

  function renderInventoryMode() {
    return (
      <div className="space-y-5">
        <DetailSection title="Inventory" icon={Shield}>
          <InventoryPanel character={character} campaignId={campaignId} />
        </DetailSection>
      </div>
    );
  }

  function renderSpellsMode() {
    return (
      <div className="space-y-5">
        <DetailSection title="Spells" icon={Sparkles}>
          {hasSpellBook ? (
            <SpellBook character={character} campaignId={campaignId} />
          ) : (
            <p className="text-[12px] text-[hsl(30,12%,58%)]">Spell management for this ruleset is not yet surfaced in the v2 workspace.</p>
          )}
        </DetailSection>
      </div>
    );
  }

  function renderCampaignMode() {
    return (
      <div className="space-y-5">
        <DetailSection title="Notes" icon={ScrollText}>
          <EditableTextSection
            label="Character Notes"
            value={noteValue}
            canEdit={isDM}
            placeholder="Add current notes, reminders, or campaign-facing character details..."
            onSave={(value) =>
              updateCharacter.mutate({
                id: character._id,
                campaignId,
                data: {
                  mechanicData: {
                    ...(character.mechanicData ?? {}),
                    notes: value,
                  },
                },
              }, { onError: () => toast.error('Failed to save notes') })
            }
          />
        </DetailSection>
        <DetailSection title="Campaign Presence" icon={Swords}>
          {renderCampaignPresenceContent()}
        </DetailSection>
      </div>
    );
  }

  function renderCampaignPresenceContent() {
    return (
      <div className="space-y-4">
        {context.recentMoment && renderRecentMoment()}
        {renderInvolvedArcs()}
        <WorldLinkRow
          title="Places Tied To Them"
          items={context.relatedLocations}
          emptyLabel="No places are clearly tied to this character in current campaign notes yet."
          onOpenWorldEntity={onOpenWorldEntity}
          icon={MapPin}
        />
        <WorldLinkRow
          title="Threads Around Them"
          items={context.relatedThreads}
          emptyLabel="No open quest threads are explicitly tied to this character yet."
          onOpenWorldEntity={onOpenWorldEntity}
          icon={Sparkles}
        />
        <MentionList sessions={context.mentionedSessions} onTabChange={onTabChange} />
      </div>
    );
  }

  function renderRecentMoment() {
    return (
      <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">Recent Moment</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">{context.recentMoment}</p>
      </div>
    );
  }

  function renderInvolvedArcs() {
    return (
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
          <Activity className="h-3.5 w-3.5" />
          Involved Arcs
        </p>
        {involvedArcs.length ? (
          <div className="flex flex-wrap gap-1.5">
            {involvedArcs.map((arc) => (
              <button
                key={arc._id}
                type="button"
                onClick={onOpenArcs}
                className="rounded-full border border-[hsla(38,60%,52%,0.24)] bg-[hsla(38,70%,46%,0.08)] px-2.5 py-1 text-[11px] text-[hsl(38,82%,63%)] transition-colors hover:border-[hsla(38,60%,52%,0.42)]"
              >
                {arc.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[hsl(30,12%,58%)]">No arc connections found for this character yet.</p>
        )}
      </div>
    );
  }
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Activity;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-[hsl(38,82%,63%)]" />
        <h4 className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function PlainStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">{label}</p>
      <p className="mt-1 text-[13px] text-[hsl(35,24%,92%)]">{value}</p>
    </div>
  );
}

function SheetRow({
  label,
  value,
  detail,
  isLast = false,
}: {
  label: string;
  value: string;
  detail: string;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 px-4 py-3 ${isLast ? '' : 'border-b border-[hsla(32,24%,28%,0.24)]'}`}>
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">{label}</p>
        <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{detail}</p>
      </div>
      <p className="text-[14px] text-[hsl(35,24%,92%)]">{value}</p>
    </div>
  );
}

function WorldLinkRow({
  title,
  items,
  emptyLabel,
  onOpenWorldEntity,
  icon: Icon,
}: {
  title: string;
  items: WorldEntity[];
  emptyLabel: string;
  onOpenWorldEntity: (entityId: string) => void;
  icon: typeof MapPin;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => onOpenWorldEntity(item._id)}
              className="rounded-full border border-[hsla(32,24%,30%,0.32)] px-2.5 py-1 text-[11px] text-[hsl(35,24%,88%)] transition-colors hover:border-[hsla(38,60%,52%,0.34)] hover:text-[hsl(38,82%,63%)]"
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-[hsl(30,12%,58%)]">{emptyLabel}</p>
      )}
    </div>
  );
}

function MentionList({ sessions, onTabChange }: { sessions: Session[]; onTabChange?: (tab: string) => void }) {
  const { requestNavigation } = useNavigationBus();

  if (!sessions.length) {
    return (
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">Recent Mentions</p>
        <p className="text-[12px] text-[hsl(30,12%,58%)]">No recent session mentions are tied to this character yet.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">Recent Mentions</p>
      <div className="space-y-2">
        {sessions.slice(0, 3).map((session) => (
          <button
            key={session._id}
            type="button"
            onClick={() => {
              requestNavigation('sessions', session._id);
              onTabChange?.('sessions');
            }}
            className="w-full cursor-pointer rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)] px-4 py-3 text-left transition hover:bg-[hsla(32,20%,20%,0.4)]"
          >
            <p className="text-[12px] text-[hsl(35,24%,92%)]">
              Session {session.sessionNumber}
              {session.title ? ` - ${session.title}` : ''}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
              {truncate(extractSessionMoment(session), 140)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function buildPartySnapshot(characters: Character[], sessions: Session[]) {
  const wounded = characters.filter((character) => getHealthRatio(character) <= 0.5).length;
  const burdened = characters.filter((character) => character.conditions.length > 0 || character.exhaustionLevel > 0).length;
  const lastSession = [...sessions].sort((a, b) => b.sessionNumber - a.sessionNumber)[0] ?? null;
  const roleSpread = dedupeStrings(characters.map((character) => buildRoleLabel(character))).slice(0, 3).join(' · ') || 'Adventuring company';

  return {
    headline: `${characters.length} at the table`,
    summary: lastSession
      ? `The party is carrying forward from ${formatSessionIdentity(lastSession)}. ${extractSessionMoment(lastSession)}`
      : 'No session memory is linked yet, so this view leans on the party\u2019s current condition and character notes.',
    partyState:
      wounded > 1 ? 'Under pressure' : burdened > 1 ? 'Weathered' : 'Ready to move',
    partySize: characters.length,
    roleSpread,
    healthLine: wounded ? `${wounded} wounded` : 'All standing steady',
    conditionLine: burdened ? `${burdened} carrying conditions or exhaustion` : 'No shared burdens showing',
    recentSessionLabel: lastSession ? `Session ${lastSession.sessionNumber}` : 'No recent session',
    recentEvent: lastSession ? truncate(extractSessionMoment(lastSession), 110) : 'No recent party event captured yet.',
  };
}

function buildCharacterContext(character: Character, sessions: Session[], worldEntities: WorldEntity[]): CharacterContext {
  const mentionedSessions = sessions
    .filter((session) => sessionMentionsCharacter(session, character))
    .sort((a, b) => b.sessionNumber - a.sessionNumber);
  const relatedLocations = dedupeEntities(
    mentionedSessions.flatMap((session) => resolveEntitiesByIds(session.locationIds, worldEntities)),
  ).slice(0, 4);
  const relatedThreads = dedupeEntities(
    mentionedSessions.flatMap((session) => resolveEntitiesByIds(session.questIds, worldEntities)),
  ).slice(0, 4);

  return {
    roleLabel: buildRoleLabel(character),
    stateLabel: buildStateLabel(character),
    stateTone: buildStateTone(character),
    hook: buildCharacterHook(character, mentionedSessions[0] ?? null),
    traitTags: buildTraitTags(character, relatedThreads),
    recentMoment: mentionedSessions[0] ? truncate(extractSessionMoment(mentionedSessions[0]), 180) : null,
    relatedLocations,
    relatedThreads,
    mentionedSessions,
  };
}

function buildAttributeBlocks(character: Character) {
  const attributeOrder = [
    { key: 'str', label: 'STR' },
    { key: 'dex', label: 'DEX' },
    { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' },
    { key: 'wis', label: 'WIS' },
    { key: 'cha', label: 'CHA' },
  ] as const;

  return attributeOrder.map((attribute) => {
    const score = character.stats?.[attribute.key] ?? 10;
    const modifier = Math.floor((score - 10) / 2);
    return {
      label: attribute.label,
      value: String(score),
      detail: `${modifier >= 0 ? '+' : ''}${modifier} modifier`,
    };
  });
}

function buildIdentityLine(character: Character) {
  const classStr = formatCharacterClass(character);
  const identity = [classStr, character.race].filter(Boolean).join(' · ');
  return identity || 'Adventurer';
}

function buildConditionSummary(character: Character) {
  if (character.hp.current <= 0) return 'Down';
  if (character.conditions.length) return character.conditions.slice(0, 2).join(', ');
  if (character.exhaustionLevel > 0) return `Exhausted ${character.exhaustionLevel}`;
  return 'Steady';
}

function buildRoleLabel(character: Character) {
  const classLabel = formatCharacterClass(character).trim();
  if (classLabel) return classLabel;
  const topStat = getTopStats(character)[0];
  const statRoles: Record<string, string> = {
    str: 'Front line',
    dex: 'Scout',
    con: 'Anchor',
    int: 'Scholar',
    wis: 'Guide',
    cha: 'Face',
  };
  return statRoles[topStat?.key ?? ''] ?? 'Adventurer';
}

function buildStateLabel(character: Character) {
  if (character.hp.current <= 0) return 'Down';
  if (character.exhaustionLevel >= 3) return 'Spent';
  if (getHealthRatio(character) <= 0.25) return 'Critical';
  if (getHealthRatio(character) <= 0.5) return 'Wounded';
  if (character.conditions.length > 0) return 'Pressed';
  return 'Steady';
}

function buildStateTone(character: Character) {
  if (character.hp.current <= 0) return 'border-[hsla(0,72%,50%,0.28)] bg-[hsla(0,72%,50%,0.12)] text-[hsl(0,80%,74%)]';
  if (getHealthRatio(character) <= 0.25 || character.exhaustionLevel >= 3) {
    return 'border-[hsla(12,72%,50%,0.28)] bg-[hsla(12,72%,50%,0.12)] text-[hsl(12,86%,72%)]';
  }
  if (getHealthRatio(character) <= 0.5 || character.conditions.length > 0) {
    return 'border-[hsla(38,70%,52%,0.28)] bg-[hsla(38,70%,46%,0.12)] text-[hsl(38,82%,63%)]';
  }
  return 'border-[hsla(150,50%,45%,0.28)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]';
}

function buildCharacterHook(character: Character, latestSession: Session | null) {
  if (latestSession) {
    return truncate(extractSessionMoment(latestSession), 140);
  }
  if (character.backstory?.trim()) {
    return truncate(character.backstory.trim(), 140);
  }
  return 'This character needs a stronger campaign-facing hook in session notes or backstory.';
}

function buildTraitTags(character: Character, relatedThreads: WorldEntity[]) {
  const tags: string[] = [];
  if (character.race) tags.push(character.race);
  tags.push(...getTopStats(character).slice(0, 2).map((stat) => stat.label));
  if (character.conditions.length > 0) tags.push(...character.conditions.slice(0, 2));
  if (relatedThreads.length > 0) tags.push(...relatedThreads.slice(0, 1).map((thread) => thread.name));
  return dedupeStrings(tags).slice(0, 4);
}

function getTopStats(character: Character) {
  const labels: Record<string, string> = {
    str: 'Forceful',
    dex: 'Quick',
    con: 'Stubborn',
    int: 'Sharp',
    wis: 'Watchful',
    cha: 'Magnetic',
  };
  return Object.entries(character.stats ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => ({ key: key.toLowerCase(), label: labels[key.toLowerCase()] ?? key.toUpperCase() }));
}

// ── Content Detail Section (shows structured data from content registry) ──────

function ContentDetailSection({ contentId, label }: { contentId: string; label: string }) {
  const { data: entry, isLoading } = useContentEntry(contentId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !entry) return null;

  const sections: Array<{ heading: string; items: string[] }> = [];

  if (entry.raceData) {
    const rd = entry.raceData;
    if (rd.abilityBonuses && Object.keys(rd.abilityBonuses).length > 0) {
      sections.push({
        heading: 'Ability Bonuses',
        items: Object.entries(rd.abilityBonuses).map(([k, v]) => `${k.toUpperCase()} ${v >= 0 ? '+' : ''}${v}`),
      });
    }
    if (rd.speed) sections.push({ heading: 'Speed', items: [`${rd.speed} ft`] });
    if (rd.size) sections.push({ heading: 'Size', items: [rd.size] });
    if (rd.languages?.length) sections.push({ heading: 'Languages', items: rd.languages });
    if (rd.proficiencies?.length) sections.push({ heading: 'Proficiencies', items: rd.proficiencies });
    if (rd.traits?.length) {
      sections.push({ heading: 'Traits', items: rd.traits.map((t) => `**${t.name}:** ${t.description}`) });
    }
  }

  if (entry.classData) {
    const cd = entry.classData;
    if (cd.hitDie) sections.push({ heading: 'Hit Die', items: [cd.hitDie] });
    if (cd.primaryAbility?.length) sections.push({ heading: 'Primary Ability', items: cd.primaryAbility });
    if (cd.savingThrows?.length) sections.push({ heading: 'Saving Throws', items: cd.savingThrows });
    if (cd.armorProficiencies?.length) sections.push({ heading: 'Armor', items: cd.armorProficiencies });
    if (cd.weaponProficiencies?.length) sections.push({ heading: 'Weapons', items: cd.weaponProficiencies });
    if (cd.features?.length) {
      sections.push({ heading: 'Features', items: cd.features.map((f) => `**${f.name}** (Lv ${f.level}): ${f.description}`) });
    }
  }

  if (sections.length === 0) return null;

  return (
    <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-[12px] font-medium text-[hsl(38,82%,63%)]">{label} Details</span>
        <span className="text-[11px] text-[hsl(30,12%,58%)]">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="border-t border-[hsla(32,24%,30%,0.18)] px-4 py-3 space-y-2">
          {sections.map((s) => (
            <div key={s.heading}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(30,12%,58%)]">{s.heading}</p>
              <ul className="mt-0.5 space-y-0.5">
                {s.items.map((item, i) => (
                  <li key={i} className="text-[12px] text-[hsl(35,24%,88%)]">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderDeathSaveLine(character: Character) {
  if (!character.deathSaves) return 'No death save pressure';
  return `${character.deathSaves.successes} successes · ${character.deathSaves.failures} failures`;
}

function startCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatCharacterIdentity(character: Character) {
  const classStr = formatCharacterClass(character);
  const identity = [character.race, classStr].filter(Boolean).join(' · ');
  return identity ? `${identity} · Level ${character.level}` : `Level ${character.level} adventurer`;
}

function formatSessionIdentity(session: Session) {
  return session.title?.trim() || `Session ${session.sessionNumber}`;
}

function resolveEntitiesByIds(ids: string[] | undefined, worldEntities: WorldEntity[]) {
  if (!ids?.length) return [];
  return ids
    .map((id) => worldEntities.find((entity) => entity._id === id))
    .filter((entity): entity is WorldEntity => Boolean(entity));
}

function getHealthRatio(character: Character) {
  if (!character.hp.max) return 1;
  return character.hp.current / character.hp.max;
}

function formatSigned(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function hasSpellSlots(character: Character) {
  return Object.values(character.spellSlots ?? {}).some((slot) => slot.max > 0 || slot.current > 0);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}\u2026`;
}

function arcInvolvesCharacter(arc: CampaignArc, character: Character): boolean {
  const name = character.name.toLowerCase();
  const haystack = [arc.name, arc.description, arc.currentState, arc.stakes, arc.recentChange, arc.nextDevelopment]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(name);
}
