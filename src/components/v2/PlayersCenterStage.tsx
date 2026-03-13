import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  ArrowUpCircle,
  Compass,
  Crown,
  HeartPulse,
  MapPin,
  Medal,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Users,
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
import { useCharacters } from '@/hooks/useCharacters';
import { useUpdateCharacter } from '@/hooks/useCharacters';
import {
  useAddTempHP,
  useHeal,
  useRollDeathSave,
  useTakeDamage,
  useUpdateFateSkill,
} from '@/hooks/useCharacterCombat';
import { useSetLevel } from '@/hooks/useProgression';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { Character, Session, WorldEntity } from '@/types/campaign';
import { useWorldExplorerContext } from './world/useWorldExplorerContext';

interface PlayersCenterStageProps {
  campaignId: string;
  isDM: boolean;
  onOpenWorldEntity: () => void;
}

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

export function PlayersCenterStage({ campaignId, isDM, onOpenWorldEntity }: PlayersCenterStageProps) {
  const { data: characters, isLoading } = useCharacters(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const {
    requestEntityNavigation,
    setActiveCharacterId,
    setActiveEntityId,
    setActiveSessionId,
    setActiveView,
  } = useWorldExplorerContext();

  const party = useMemo(() => characters ?? [], [characters]);
  const sessionList = useMemo(() => sessions ?? [], [sessions]);
  const allWorldEntities = useMemo(() => worldEntities ?? [], [worldEntities]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const resolvedSelectedCharacterId = useMemo(() => {
    if (selectedCharacterId && party.some((character) => character._id === selectedCharacterId)) {
      return selectedCharacterId;
    }

    return party[0]?._id ?? null;
  }, [party, selectedCharacterId]);

  const selectedCharacter = useMemo(
    () => party.find((character) => character._id === resolvedSelectedCharacterId) ?? null,
    [party, resolvedSelectedCharacterId],
  );

  useEffect(() => {
    setActiveCharacterId(selectedCharacter?._id ?? null);
    setActiveEntityId(null);
    setActiveSessionId(null);
    setActiveView(null);
  }, [selectedCharacter?._id, setActiveCharacterId, setActiveEntityId, setActiveSessionId, setActiveView]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-[hsl(30,14%,40%)]">Loading party…</p>
      </div>
    );
  }

  if (!party.length) {
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

  const partySnapshot = buildPartySnapshot(party, sessionList);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[hsla(32,26%,26%,0.4)] px-4 py-3">
        <h2 className="text-[14px] text-[hsl(38,36%,82%)]" style={{ fontFamily: "'Cinzel', serif" }}>
          Players
        </h2>
        <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">
          A party table view of the adventuring group, their condition, and what is pulling on them in the campaign.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 pb-10">
          <PartyOverviewCard snapshot={partySnapshot} />

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
                onOpenWorldEntity={(entityId) => {
                  requestEntityNavigation(entityId);
                  onOpenWorldEntity();
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyOverviewCard({
  snapshot,
}: {
  snapshot: ReturnType<typeof buildPartySnapshot>;
}) {
  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.42)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.97),hsla(24,14%,11%,0.99))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Party Snapshot</p>
          <h3 className="mt-1 text-[20px] text-[hsl(35,24%,92%)]" style={{ fontFamily: "'Cinzel', serif" }}>
            {snapshot.headline}
          </h3>
          <p className="mt-2 max-w-[720px] text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">
            {snapshot.summary}
          </p>
        </div>
        <div className="rounded-full border border-[hsla(38,60%,52%,0.24)] bg-[hsla(38,70%,46%,0.08)] px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(38,82%,63%)]">
          {snapshot.partyState}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <OverviewPill icon={Users} label="Party" value={`${snapshot.partySize} adventurer${snapshot.partySize === 1 ? '' : 's'}`} detail={snapshot.roleSpread} />
        <OverviewPill icon={HeartPulse} label="Condition" value={snapshot.healthLine} detail={snapshot.conditionLine} />
        <OverviewPill icon={ScrollText} label="Recent Play" value={snapshot.recentSessionLabel} detail={snapshot.recentEvent} />
      </div>
    </section>
  );
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
      <div className="mb-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">Party Roster</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
          A live lineup of who is at the table, what shape they are in, and what campaign pressure is sitting on them.
        </p>
      </div>

      <div className="space-y-3">
        {characters.map((character) => {
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
                <div className="min-w-0 flex-1">
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
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
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
  onOpenWorldEntity,
}: {
  character: Character;
  campaignId: string;
  isDM: boolean;
  context: CharacterContext;
  onOpenWorldEntity: (entityId: string) => void;
}) {
  const updateCharacter = useUpdateCharacter();
  const takeDamage = useTakeDamage();
  const heal = useHeal();
  const addTempHP = useAddTempHP();
  const rollDeathSave = useRollDeathSave();
  const setLevel = useSetLevel();
  const updateFateSkill = useUpdateFateSkill();
  const hasSpellBook = useCampaignModuleEnabled(campaignId, 'spell-slots-dnd');
  const hasFateSkills = useCampaignModuleEnabled(campaignId, 'skills-fate-core');
  const noteValue = (character.mechanicData?.notes as string | undefined) ?? '';
  const passiveSkills = Object.entries(character.passiveScores ?? {});
  const hasSpells = hasSpellBook || Boolean(character.spellSlotsPf2e) || hasSpellSlots(character);
  const [mode, setMode] = useState<CharacterWorkspaceMode>('overview');
  const activeMode = mode === 'spells' && !hasSpells ? 'overview' : mode;

  return (
    <section className="rounded-2xl border border-[hsla(32,26%,26%,0.35)] bg-[hsla(24,15%,11%,0.9)] p-4">
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

      <div className="mt-4 flex flex-wrap gap-2 border-b border-[hsla(32,24%,28%,0.28)] pb-3">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'sheet', label: 'Sheet' },
          { id: 'inventory', label: 'Inventory' },
          ...(hasSpells ? [{ id: 'spells', label: 'Spells' }] : []),
          { id: 'campaign', label: 'Campaign' },
        ] as { id: CharacterWorkspaceMode; label: string }[]).map((option) => (
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

      <div className="mt-4">
        {activeMode === 'overview' && (
          <div className="space-y-5">
            <DetailSection title="Current State" icon={Activity}>
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
            </DetailSection>

            {isDM && (
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
            )}
          </div>
        )}

        {activeMode === 'sheet' && (
          <div className="space-y-5">
            <DetailSection title="Attributes" icon={Crown}>
              <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)]">
                {buildAttributeBlocks(character).map((attribute, index) => (
                  <SheetRow
                    key={attribute.label}
                    label={attribute.label}
                    value={attribute.value}
                    detail={attribute.detail}
                    isLast={index === buildAttributeBlocks(character).length - 1}
                  />
                ))}
              </div>
            </DetailSection>

            <DetailSection title="Core Mechanics" icon={Compass}>
              <div className="space-y-4">
                <CombatStats character={character} editable={false} />
                <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)]">
                  <SheetRow label="Condition" value={buildConditionSummary(character)} detail={character.exhaustionLevel > 0 ? `Exhaustion ${character.exhaustionLevel}` : 'No exhaustion showing'} />
                  <SheetRow label="Survival" value={renderDeathSaveLine(character)} detail="Death save pressure only matters while the character is down." isLast />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Skills" icon={Compass}>
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
          </div>
        )}

        {activeMode === 'inventory' && (
          <div className="space-y-5">
            <DetailSection title="Inventory" icon={Shield}>
              <InventoryPanel character={character} campaignId={campaignId} />
            </DetailSection>
          </div>
        )}

        {activeMode === 'spells' && hasSpells && (
          <div className="space-y-5">
            <DetailSection title="Spells" icon={Sparkles}>
              {hasSpellBook ? (
                <SpellBook character={character} campaignId={campaignId} />
              ) : (
                <p className="text-[12px] text-[hsl(30,12%,58%)]">Spell management for this ruleset is not yet surfaced in the v2 workspace.</p>
              )}
            </DetailSection>
          </div>
        )}

        {activeMode === 'campaign' && (
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
              <div className="space-y-4">
                {context.recentMoment && (
                  <div className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">Recent Moment</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[hsl(30,16%,72%)]">{context.recentMoment}</p>
                  </div>
                )}

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
                <MentionList sessions={context.mentionedSessions} />
              </div>
            </DetailSection>
          </div>
        )}
      </div>
    </section>
  );
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

function buildPartySnapshot(characters: Character[], sessions: Session[]) {
  const wounded = characters.filter((character) => getHealthRatio(character) <= 0.5).length;
  const burdened = characters.filter((character) => character.conditions.length > 0 || character.exhaustionLevel > 0).length;
  const lastSession = [...sessions].sort((a, b) => b.sessionNumber - a.sessionNumber)[0] ?? null;
  const roleSpread = dedupeStrings(characters.map((character) => buildRoleLabel(character))).slice(0, 3).join(' · ') || 'Adventuring company';

  return {
    headline: `${characters.length} at the table`,
    summary: lastSession
      ? `The party is carrying forward from ${formatSessionIdentity(lastSession)}. ${extractSessionMoment(lastSession)}`
      : 'No session memory is linked yet, so this view leans on the party’s current condition and character notes.',
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
  const identity = [character.class, character.race].filter(Boolean).join(' · ');
  return identity || 'Adventurer';
}

function buildConditionSummary(character: Character) {
  if (character.hp.current <= 0) return 'Down';
  if (character.conditions.length) return character.conditions.slice(0, 2).join(', ');
  if (character.exhaustionLevel > 0) return `Exhausted ${character.exhaustionLevel}`;
  return 'Steady';
}

function buildRoleLabel(character: Character) {
  const classLabel = character.class?.trim();
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

function renderDeathSaveLine(character: Character) {
  if (!character.deathSaves) return 'No death save pressure';
  return `${character.deathSaves.successes} successes · ${character.deathSaves.failures} failures`;
}

function MentionList({ sessions }: { sessions: Session[] }) {
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
          <div
            key={session._id}
            className="rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.62)] px-4 py-3"
          >
            <p className="text-[12px] text-[hsl(35,24%,92%)]">
              Session {session.sessionNumber}
              {session.title ? ` - ${session.title}` : ''}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
              {truncate(extractSessionMoment(session), 140)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
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

function sessionMentionsCharacter(session: Session, character: Character) {
  const haystack = [
    session.title ?? '',
    session.summary ?? '',
    session.notes ?? '',
    session.aiRecap ?? '',
    session.aiSummary?.summary ?? '',
    ...(session.aiSummary?.keyEvents ?? []),
    ...(session.aiSummary?.unresolvedHooks ?? []),
    ...(session.statistics.keyMoments ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(character.name.toLowerCase());
}

function extractSessionMoment(session: Session) {
  return session.aiSummary?.summary
    || session.summary
    || session.aiRecap
    || session.notes
    || 'This session has no summary yet.';
}

function formatCharacterIdentity(character: Character) {
  const identity = [character.race, character.class].filter(Boolean).join(' · ');
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

function dedupeEntities(entities: WorldEntity[]) {
  const seen = new Set<string>();
  return entities.filter((entity) => {
    if (seen.has(entity._id)) return false;
    seen.add(entity._id);
    return true;
  });
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
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
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}
