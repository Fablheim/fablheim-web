import { useMemo } from 'react';
import {
  BookOpen,
  Brain,
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useCharacters } from '@/hooks/useCharacters';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { formatCharacterClass } from '@/lib/character-utils';
import type { Character, Session, WorldEntity } from '@/types/campaign';
import { ENTITY_TYPE_CONFIG } from './world/world-config';
import { useWorldExplorerContext } from './world/useWorldExplorerContext';
import { formatWorldEntityContext, startCase } from './world/world-ui';
import {
  dedupeEntities,
  dedupeStrings,
  extractSessionMoment,
  sessionMentionsCharacter,
  sessionMentionsEntity,
} from '@/lib/session-utils';

interface CampaignBrainPanelV2Props {
  campaignId: string;
  onNavigateToEntity?: (entityId: string) => void;
}

export function CampaignBrainPanelV2({ campaignId, onNavigateToEntity }: CampaignBrainPanelV2Props) {
  const {
    activeCharacterId,
    activeEntityId,
    activeSessionId,
    activeView,
    requestEntityNavigation,
    requestSessionNavigation,
  } = useWorldExplorerContext();

  const { data: characters } = useCharacters(campaignId);
  const { data: allEntities } = useWorldEntities(campaignId);
  const { data: sessions } = useSessions(campaignId);

  const characterList = useMemo(() => characters ?? [], [characters]);
  const sessionList = useMemo(() => sessions ?? [], [sessions]);
  const activeCharacter = useMemo(
    () => characterList.find((character) => character._id === activeCharacterId) ?? null,
    [activeCharacterId, characterList],
  );
  const activeSession = useMemo(
    () => sessionList.find((session) => session._id === activeSessionId) ?? null,
    [activeSessionId, sessionList],
  );
  const activeEntity = useMemo(
    () => (allEntities ?? []).find((entity) => entity._id === activeEntityId) ?? null,
    [activeEntityId, allEntities],
  );
  const sessionHistory = useMemo(
    () => buildSessionHistory(activeEntity, sessionList),
    [activeEntity, sessionList],
  );
  const currentState = useMemo(
    () => (activeEntity ? buildCurrentState(activeEntity, sessionHistory.sessions) : []),
    [activeEntity, sessionHistory.sessions],
  );
  const partyKnowledge = useMemo(
    () => (activeEntity ? buildPartyKnowledge(activeEntity, sessionHistory.sessions) : []),
    [activeEntity, sessionHistory.sessions],
  );
  const openThreads = useMemo(
    () => (activeEntity ? buildOpenThreads(activeEntity, sessionHistory.sessions) : []),
    [activeEntity, sessionHistory.sessions],
  );
  const gmReminder = useMemo(
    () => (activeEntity ? buildGmReminder(activeEntity, sessionHistory.sessions) : null),
    [activeEntity, sessionHistory.sessions],
  );
  const characterBrain = useMemo(
    () => buildCharacterBrain(activeCharacter, sessionList, allEntities ?? []),
    [activeCharacter, sessionList, allEntities],
  );

  function handleEntityNavigate(entityId: string) {
    requestEntityNavigation(entityId);
    onNavigateToEntity?.(entityId);
  }

  if (activeSession) {
    const sessionPlans = getSessionPlanStack(activeSession, sessionList);
    const currentRecap = extractSessionMoment(activeSession);

    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-4">
            <section className="rounded-xl border border-[hsla(32,24%,30%,0.32)] bg-[linear-gradient(180deg,hsla(25,16%,14%,0.96),hsla(24,14%,10%,0.98))] p-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsla(38,70%,46%,0.12)] text-[hsl(38,82%,63%)]">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">
                    {formatSessionIdentity(activeSession)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[hsl(30,12%,58%)]">
                    {formatScheduleLine(activeSession)} · {getSessionStatusLabel(activeSession)}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,50%)]">
                    Session focus
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-1.5">
              <SectionTitle icon={BookOpen} title="Current Session" />
              <div className="rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2">
                <p className="text-[11px] leading-relaxed text-[hsl(30,14%,66%)]">
                  {currentRecap}
                </p>
              </div>
            </section>

            {sessionPlans.length > 0 && (
              <section className="space-y-1.5">
                <SectionTitle icon={Clock3} title="Session Plans" />
                <div className="space-y-1">
                  {sessionPlans.map((session) => (
                    <button
                      key={session._id}
                      type="button"
                      onClick={() => requestSessionNavigation(session._id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        session._id === activeSession._id
                          ? 'border-[hsla(38,60%,52%,0.34)] bg-[hsla(38,70%,46%,0.08)]'
                          : 'border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] hover:bg-[hsl(24,20%,15%)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] text-[hsl(35,24%,92%)]">
                          Session {session.sessionNumber}
                          {session.title ? ` - ${session.title}` : ''}
                        </p>
                        <span className="rounded-full border border-[hsla(32,24%,30%,0.28)] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,58%)]">
                          {getSessionStatusLabel(session)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-[hsl(30,12%,58%)]">
                        {extractSessionMoment(session)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {renderSessionThreads(activeSession, allEntities ?? [])}
          </div>
        </div>
      </div>
    );
  }

  if (activeCharacter) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-4">
            <section className="rounded-xl border border-[hsla(32,24%,30%,0.32)] bg-[linear-gradient(180deg,hsla(25,16%,14%,0.96),hsla(24,14%,10%,0.98))] p-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsla(38,70%,46%,0.12)] text-[hsl(38,82%,63%)]">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">{activeCharacter.name}</p>
                  <p className="mt-0.5 text-[11px] text-[hsl(30,12%,58%)]">
                    {formatCharacterLine(activeCharacter)}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,50%)]">
                    Character memory
                  </p>
                </div>
              </div>
            </section>

            {renderCharacterSessionHistory(characterBrain)}
            {renderEntityListSection('NPC Relationships', Users, characterBrain.npcs, 'No recurring NPC ties are explicitly linked to this character yet.', handleEntityNavigate)}
            {renderEntityListSection('Places Tied To Them', MapPin, characterBrain.locations, 'No locations are clearly tied to this character yet.', handleEntityNavigate)}
            {renderEntityListSection('Threads Involving Them', Target, characterBrain.quests, 'No active threads are explicitly tied to this character yet.', handleEntityNavigate)}
            {renderRecentMentions(characterBrain.sessions)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-4">
          {renderFocusHeader()}
          {activeEntity ? (
            <>
              {renderBulletSection('Current State', Clock3, currentState)}
              {renderEntitySessionHistory(sessionHistory)}
              {renderBulletSection('Party Knowledge', BookOpen, partyKnowledge)}
              {renderBulletSection('Open Threads', Target, openThreads)}
              {renderReminder(gmReminder)}
            </>
          ) : (
            renderEmptyState()
          )}
        </div>
      </div>
    </div>
  );

  function renderFocusHeader() {
    if (!activeEntity) {
      return (
        <section className="rounded-xl border border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.78)] p-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[hsl(38,82%,63%)]" />
            <div>
              <p className="text-[12px] text-[hsl(35,24%,92%)]">Campaign Brain</p>
              <p className="text-[11px] text-[hsl(30,12%,58%)]">
                Open a world entity or session to see campaign memory and continuity.
              </p>
            </div>
          </div>
        </section>
      );
    }

    const config = ENTITY_TYPE_CONFIG[activeEntity.type];
    const Icon = config.icon;

    return (
      <section className="rounded-xl border border-[hsla(32,24%,30%,0.32)] bg-[linear-gradient(180deg,hsla(25,16%,14%,0.96),hsla(24,14%,10%,0.98))] p-3">
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${config.color}15`, color: config.color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">
              {activeEntity.name}
            </p>
            <p className="mt-0.5 text-[11px] text-[hsl(30,12%,58%)]">
              {formatWorldEntityContext(activeEntity)}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,50%)]">
              {activeView?.kind === 'hierarchy' ? 'Hierarchy focus' : activeView?.kind === 'detail' ? 'Detail focus' : 'World focus'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  function renderBulletSection(title: string, icon: typeof Brain, items: string[]) {
    if (!items.length) return null;

    return (
      <section className="space-y-1.5">
        <SectionTitle icon={icon} title={title} />
        <div className="rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2">
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-[hsl(30,14%,66%)]">
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[hsl(38,82%,63%)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  function renderEntitySessionHistory(history: ReturnType<typeof buildSessionHistory>) {
    if (!history.sessions.length && !history.firstAppearance && !history.lastAppearance) {
      return null;
    }

    return (
      <section className="space-y-1.5">
        <SectionTitle icon={CalendarDays} title="Session History" />
        <div className="space-y-1">
          {(history.firstAppearance || history.lastAppearance) && (
            <div className="rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2">
              {history.firstAppearance && (
                <p className="text-[11px] text-[hsl(30,14%,66%)]">
                  First appearance: <span className="text-[hsl(35,24%,92%)]">Session {history.firstAppearance.sessionNumber}</span>
                  {history.firstAppearance.title ? ` - ${history.firstAppearance.title}` : ''}
                </p>
              )}
              {history.lastAppearance && (
                <p className="mt-1 text-[11px] text-[hsl(30,14%,66%)]">
                  Last appearance: <span className="text-[hsl(35,24%,92%)]">Session {history.lastAppearance.sessionNumber}</span>
                  {history.lastAppearance.title ? ` - ${history.lastAppearance.title}` : ''}
                </p>
              )}
            </div>
          )}

          {history.sessions.slice(0, 3).map((session) => (
            <div
              key={session._id}
              className="rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2"
            >
              <p className="text-[12px] text-[hsl(35,24%,92%)]">
                Session {session.sessionNumber}{session.title ? ` - ${session.title}` : ''}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-[hsl(30,12%,58%)]">
                {extractSessionMoment(session)}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderReminder(reminder: string | null) {
    if (!reminder) return null;

    return (
      <section className="space-y-1.5">
        <SectionTitle icon={Sparkles} title="GM Reminder" />
        <div className="rounded-lg border border-[hsla(38,60%,52%,0.22)] bg-[hsla(38,70%,46%,0.08)] px-3 py-2">
          <p className="text-[11px] leading-relaxed text-[hsl(30,16%,72%)]">
            {reminder}
          </p>
        </div>
      </section>
    );
  }

  function renderEmptyState() {
    return (
      <section className="rounded-xl border border-dashed border-[hsla(32,24%,28%,0.34)] px-4 py-5 text-center">
        <p className="text-[12px] text-[hsl(35,24%,88%)]">
          Browse to a location, NPC, quest, faction, lore entry, or session.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
          The Campaign Brain will stay focused on campaign memory and continuity.
        </p>
      </section>
    );
  }
}

function renderCharacterSessionHistory(history: ReturnType<typeof buildCharacterBrain>) {
  if (!history.firstAppearance && !history.lastAppearance) return null;

  return (
    <section className="space-y-1.5">
      <SectionTitle icon={CalendarDays} title="Session Memory" />
      <div className="rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2">
        {history.firstAppearance && (
          <p className="text-[11px] text-[hsl(30,14%,66%)]">
            First seen: <span className="text-[hsl(35,24%,92%)]">Session {history.firstAppearance.sessionNumber}</span>
            {history.firstAppearance.title ? ` - ${history.firstAppearance.title}` : ''}
          </p>
        )}
        {history.lastAppearance && (
          <p className="mt-1 text-[11px] text-[hsl(30,14%,66%)]">
            Last seen: <span className="text-[hsl(35,24%,92%)]">Session {history.lastAppearance.sessionNumber}</span>
            {history.lastAppearance.title ? ` - ${history.lastAppearance.title}` : ''}
          </p>
        )}
      </div>
    </section>
  );
}

function renderEntityListSection(
  title: string,
  icon: typeof Brain,
  items: WorldEntity[],
  emptyLabel: string,
  onNavigate?: (entityId: string) => void,
) {
  return (
    <section className="space-y-1.5">
      <SectionTitle icon={icon} title={title} />
      {items.length ? (
        <div className="space-y-1">
          {items.map((item) =>
            onNavigate ? (
              <button
                key={item._id}
                type="button"
                onClick={() => onNavigate(item._id)}
                className="w-full rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2 text-left transition-colors hover:bg-[hsl(24,20%,15%)]"
              >
                <p className="text-[12px] text-[hsl(35,24%,92%)]">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-[hsl(30,12%,58%)]">{formatWorldEntityContext(item)}</p>
              </button>
            ) : (
              <div
                key={item._id}
                className="rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2"
              >
                <p className="text-[12px] text-[hsl(35,24%,92%)]">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-[hsl(30,12%,58%)]">{formatWorldEntityContext(item)}</p>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[hsla(32,24%,28%,0.3)] px-3 py-2">
          <p className="text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">{emptyLabel}</p>
        </div>
      )}
    </section>
  );
}

function renderRecentMentions(sessions: Session[]) {
  if (!sessions.length) return null;

  return (
    <section className="space-y-1.5">
      <SectionTitle icon={BookOpen} title="Recent Mentions" />
      <div className="space-y-1">
        {sessions.slice(0, 3).map((session) => (
          <div
            key={session._id}
            className="rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2"
          >
            <p className="text-[12px] text-[hsl(35,24%,92%)]">
              Session {session.sessionNumber}{session.title ? ` - ${session.title}` : ''}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-[hsl(30,12%,58%)]">
              {extractSessionMoment(session)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderSessionThreads(
  session: Session,
  worldEntities: WorldEntity[],
) {
  const linkedWorld = buildLinkedWorldSummary(session, worldEntities);
  if (!linkedWorld.length) return null;

  return (
    <section className="space-y-1.5">
      <SectionTitle icon={Target} title="In Play" />
      <div className="rounded-lg border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2">
        <ul className="space-y-1.5">
          {linkedWorld.map((item) => (
            <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-[hsl(30,14%,66%)]">
              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[hsl(38,82%,63%)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Brain;
  title: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-[hsl(30,12%,58%)]" />
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-[hsl(38,36%,72%)]">
        {title}
      </h3>
    </div>
  );
}

function getSessionPlanStack(activeSession: Session, sessions: Session[]) {
  const normalizedStatus = (session: Session) => (session.status === 'planned' ? 'scheduled' : session.status);
  const priority = (session: Session) => {
    if (session._id === activeSession._id) return 0;
    const status = normalizedStatus(session);
    if (status === 'ready') return 1;
    if (status === 'scheduled') return 2;
    if (status === 'draft') return 3;
    if (status === 'in_progress') return 4;
    return 5;
  };

  return [...sessions].sort((a, b) => {
    const priorityDelta = priority(a) - priority(b);
    if (priorityDelta !== 0) return priorityDelta;
    return b.sessionNumber - a.sessionNumber;
  });
}

function getSessionStatusLabel(session: Session) {
  const status = session.status === 'planned' ? 'scheduled' : session.status;
  return status === 'in_progress' ? 'Live' : startCase(status);
}

function buildLinkedWorldSummary(session: Session, entities: WorldEntity[]) {
  const byIds = (ids: string[] | undefined) =>
    (ids ?? [])
      .map((id) => entities.find((entity) => entity._id === id))
      .filter((entity): entity is WorldEntity => Boolean(entity));

  const npcs = byIds(session.npcIds).slice(0, 2).map((entity) => `NPC: ${entity.name}`);
  const locations = byIds(session.locationIds).slice(0, 2).map((entity) => `Location: ${entity.name}`);
  const quests = byIds(session.questIds).slice(0, 2).map((entity) => `Thread: ${entity.name}`);
  return [...npcs, ...locations, ...quests];
}

function buildCharacterBrain(character: Character | null, sessions: Session[], entities: WorldEntity[]) {
  if (!character) {
    return {
      sessions: [] as Session[],
      firstAppearance: null as Session | null,
      lastAppearance: null as Session | null,
      npcs: [] as WorldEntity[],
      locations: [] as WorldEntity[],
      quests: [] as WorldEntity[],
    };
  }

  const mentions = sessions
    .filter((session) => sessionMentionsCharacter(session, character))
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  const byIds = (ids: string[] | undefined, expectedTypes?: WorldEntity['type'][]) =>
    (ids ?? [])
      .map((id) => entities.find((entity) => entity._id === id))
      .filter((entity): entity is WorldEntity => {
        if (!entity) return false;
        return !expectedTypes || expectedTypes.includes(entity.type);
      });

  return {
    sessions: [...mentions].sort((a, b) => b.sessionNumber - a.sessionNumber),
    firstAppearance: mentions[0] ?? null,
    lastAppearance: mentions[mentions.length - 1] ?? null,
    npcs: dedupeEntities(mentions.flatMap((session) => byIds(session.npcIds, ['npc', 'npc_minor']))).slice(0, 4),
    locations: dedupeEntities(mentions.flatMap((session) => byIds(session.locationIds, ['location', 'location_detail']))).slice(0, 4),
    quests: dedupeEntities(mentions.flatMap((session) => byIds(session.questIds, ['quest']))).slice(0, 4),
  };
}

function buildSessionHistory(entity: WorldEntity | null, sessions: Session[]) {
  if (!entity) {
    return {
      sessions: [] as Session[],
      firstAppearance: null as Session | null,
      lastAppearance: null as Session | null,
    };
  }

  const mentions = sessions
    .filter((session) => sessionMentionsEntity(session, entity))
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  return {
    sessions: [...mentions].sort((a, b) => b.sessionNumber - a.sessionNumber),
    firstAppearance: mentions[0] ?? null,
    lastAppearance: mentions[mentions.length - 1] ?? null,
  };
}


function buildCurrentState(entity: WorldEntity, sessions: Session[]) {
  const items: string[] = [];

  if (entity.type === 'quest') {
    items.push(`Quest status: ${startCase(entity.questStatus ?? 'active')}.`);
    if (hasIncompleteObjectives(entity)) {
      items.push('There are still unresolved objectives keeping this thread open.');
    } else if (isResolvedQuest(entity)) {
      items.push('This quest reads as resolved in the campaign record.');
    }
  } else if (entity.type === 'location' || entity.type === 'location_detail') {
    items.push(sessions.length ? 'This location has already entered play.' : 'This location has not clearly entered play yet.');
    if (entity.discoveredByParty) {
      items.push('The party knows this place and can anchor future scenes here.');
    }
  } else if (entity.type === 'faction') {
    if (entity.reputation != null) {
      items.push(`Current reputation stands at ${entity.reputation}.`);
    }
    if (entity.disposition) {
      items.push(`Faction stance is ${startCase(entity.disposition)}.`);
    }
  } else if (entity.type === 'npc' || entity.type === 'npc_minor') {
    if (entity.npcDisposition) {
      items.push(`Current party-facing disposition is ${startCase(entity.npcDisposition)}.`);
    }
    items.push(sessions.length ? 'This NPC has campaign history with the party.' : 'This NPC still feels mostly preparatory.');
  } else {
    items.push(entity.discoveredByParty ? 'This entity is in active campaign memory.' : 'This entity is still mostly a GM-side thread.');
  }

  if (entity.visibility === 'dm-only') {
    items.push('This remains hidden from players unless revealed in play.');
  }

  return items.slice(0, 3);
}

function buildPartyKnowledge(entity: WorldEntity, sessions: Session[]) {
  const items: string[] = [];

  if (entity.discoveredByParty) {
    items.push('The party has directly encountered or learned about this entity.');
  } else if (entity.visibility === 'dm-only') {
    items.push('The party does not currently know this entity exists.');
  } else {
    items.push('This entity may be visible in prep, but it has not clearly been established in play yet.');
  }

  if (sessions.length > 0) {
    items.push(`The entity has shown up across ${sessions.length} session${sessions.length === 1 ? '' : 's'} of campaign memory.`);
  }

  if (entity.type === 'npc' && entity.secrets?.length) {
    items.push(`${entity.secrets.length} secret${entity.secrets.length === 1 ? '' : 's'} may still be hidden from the party.`);
  }

  if (entity.type === 'quest' && hasIncompleteObjectives(entity)) {
    items.push('The party likely understands only part of the full quest state until remaining objectives resolve.');
  }

  return items.slice(0, 3);
}

function buildOpenThreads(entity: WorldEntity, sessions: Session[]) {
  const items: string[] = [];

  if (entity.type === 'quest') {
    if (hasIncompleteObjectives(entity)) {
      items.push('Incomplete objectives still need resolution.');
    }
    if (!isResolvedQuest(entity)) {
      items.push('This quest remains an open campaign thread.');
    }
  }

  if ((entity.type === 'npc' || entity.type === 'npc_minor') && entity.secrets?.some((secret) => !secret.revealed)) {
    items.push('Unrevealed secrets are still attached to this NPC.');
  }

  if (entity.type === 'faction' && entity.hiddenGoals) {
    items.push('Hidden faction goals may still reshape future sessions.');
  }

  if ((entity.type === 'location' || entity.type === 'location_detail') && sessions.length > 0) {
    items.push('This place has campaign history that can be revisited or escalated.');
  }

  const unresolvedHooks = sessions
    .flatMap((session) => session.aiSummary?.unresolvedHooks ?? [])
    .filter((hook) => hook.toLowerCase().includes(entity.name.toLowerCase()));

  for (const hook of unresolvedHooks.slice(0, 2)) {
    items.push(hook);
  }

  return dedupeStrings(items).slice(0, 4);
}

function buildGmReminder(entity: WorldEntity, sessions: Session[]) {
  if (entity.type === 'quest') {
    if (hasIncompleteObjectives(entity)) {
      return 'Keep the blockers and next step clear. This quest should remind the GM what still needs to move before the party feels progress.';
    }
    return 'Remember what offering, payoff, or consequence makes this quest matter in the campaign right now.';
  }

  if (entity.type === 'npc' || entity.type === 'npc_minor') {
    if (entity.motivations?.length) {
      return `Play this NPC through their motivations: ${entity.motivations.slice(0, 2).join(', ')}.`;
    }
    return 'Remember what this NPC wants from the party, and what tension or promise is still unresolved.';
  }

  if (entity.type === 'faction') {
    if (entity.hiddenGoals) {
      return `Keep the faction's hidden agenda in mind: ${truncate(entity.hiddenGoals, 140)}`;
    }
    return 'Remember how this faction is pressuring the campaign now, not just what it is structurally connected to.';
  }

  if (entity.type === 'location' || entity.type === 'location_detail') {
    if (sessions.length > 0) {
      return 'Remember what happened here before. This location should carry history, consequences, or mood when the party returns.';
    }
    return 'Anchor this place with one memorable tension, reveal, or event the next time it enters play.';
  }

  if (entity.description) {
    return truncate(entity.description, 160);
  }

  return 'Keep one clear campaign-purpose note in mind for this entity: why it matters now, and what could bring it back into play.';
}

function hasIncompleteObjectives(entity: WorldEntity) {
  return Boolean(entity.objectives?.some((objective) => !objective.completed));
}

function isResolvedQuest(entity: WorldEntity) {
  const status = entity.questStatus?.trim().toLowerCase();
  return Boolean(status && ['completed', 'resolved', 'failed', 'abandoned'].includes(status));
}

function formatSessionIdentity(session: Session) {
  return session.title?.trim() || `Session ${session.sessionNumber}`;
}

function formatScheduleLine(session: Session) {
  if (!session.scheduledDate) return 'Not scheduled yet';
  const date = new Date(session.scheduledDate);
  if (Number.isNaN(date.getTime())) return 'Schedule unavailable';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatCharacterLine(character: Character) {
  const classStr = formatCharacterClass(character);
  const parts = [character.race, classStr].filter(Boolean);
  const identity = parts.length ? parts.join(' · ') : 'Adventurer';
  return `${identity} · Level ${character.level}`;
}
