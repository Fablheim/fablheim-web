import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Copy,
  ChevronRight,
  Heart,
  Loader2,
  Plus,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { encountersApi } from '@/api/encounters';
import defaultForestMap from '@/assets/battle-map.webp';
import defaultStoneDungeonMap from '@/assets/battle-map-stone-dungeon.webp';
import defaultOpenGrasslandMap from '@/assets/battle-map-open-grassland.webp';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useBattleMap } from '@/hooks/useBattleMap';
import { useCreateEncounter, useDeleteEncounter, useEncounter, useLoadEncounter, useUpdateEncounter, useEncounters } from '@/hooks/useEncounters';
import { useCharacters } from '@/hooks/useCharacters';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { useAllies } from '@/hooks/useAllies';
import { useEnemyTemplates } from '@/hooks/useEnemyTemplates';
import {
  useInitiative,
  useUpdateInitiativeEntry,
} from '@/hooks/useLiveSession';
import type { Character, WorldEntity, Ally } from '@/types/campaign';
import type {
  EncounterParticipant,
  EncounterParticipantAttack,
  EncounterParticipantType,
} from '@/types/encounter';
import type { EnemyTemplate } from '@/types/enemy-template';
import type { ConditionDef } from '@/types/combat-rules';
import type { InitiativeEntry } from '@/types/live-session';
import type { EncounterDifficulty, EncounterStatus, LoadEncounterRequest } from '@/types/encounter';

interface EncounterCenterStageV2Props {
  campaignId: string;
}

type PickerType = EncounterParticipantType | null;
type DetailSubject =
  | { kind: 'player'; character: Character }
  | { kind: 'participant'; participant: EncounterParticipant };

const panelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(22,24%,9%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(212,42%,58%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const numberInputClass = `${inputClass} text-center`;
const textareaClass = `${inputClass} min-h-[120px] resize-y`;
const DEFAULT_MAPS = [
  { key: 'none', label: 'No Map', url: '' },
  { key: 'forest', label: 'Forest Clearing', url: defaultForestMap },
  { key: 'stone', label: 'Stone Dungeon', url: defaultStoneDungeonMap },
  { key: 'grass', label: 'Open Grassland', url: defaultOpenGrasslandMap },
] as const;

const DEFAULT_CONDITIONS: ConditionDef[] = [
  { key: 'blinded', label: 'Blinded', description: '' },
  { key: 'charmed', label: 'Charmed', description: '' },
  { key: 'deafened', label: 'Deafened', description: '' },
  { key: 'frightened', label: 'Frightened', description: '' },
  { key: 'grappled', label: 'Grappled', description: '' },
  { key: 'paralyzed', label: 'Paralyzed', description: '' },
  { key: 'poisoned', label: 'Poisoned', description: '' },
  { key: 'prone', label: 'Prone', description: '' },
  { key: 'restrained', label: 'Restrained', description: '' },
  { key: 'stunned', label: 'Stunned', description: '' },
  { key: 'unconscious', label: 'Unconscious', description: '' },
];

export function EncounterCenterStageV2({ campaignId }: EncounterCenterStageV2Props) {
  const { data: encounters } = useEncounters(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const { data: allies } = useAllies(campaignId);
  const { data: enemyTemplates } = useEnemyTemplates();
  const { data: initiative } = useInitiative(campaignId);

  const createEncounter = useCreateEncounter(campaignId);
  const deleteEncounter = useDeleteEncounter(campaignId);
  const loadEncounter = useLoadEncounter(campaignId);
  const { uploadBattleMap, progress: uploadProgress } = useFileUpload();
  const updateInitiativeEntry = useUpdateInitiativeEntry(campaignId);

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [deltaAmount, setDeltaAmount] = useState('5');
  const [conditionDraft, setConditionDraft] = useState('');
  const [showLoadOptions, setShowLoadOptions] = useState(false);

  const hasLoadedMap = !!(
    battleMap?.backgroundImageUrl ||
    battleMap?.isActive ||
    (battleMap?.tokens?.length ?? 0) > 0
  );
  const [loadOptions, setLoadOptions] = useState<LoadEncounterRequest>({
    addToInitiative: true,
    clearExisting: true,
    clearExistingMap: true,
    spawnTokens: hasLoadedMap,
    autoRollInitiative: true,
    startCombat: false,
  });

  const encounterId = selectedEncounterId;
  const { data: encounter } = useEncounter(campaignId, encounterId ?? undefined);
  const updateEncounter = useUpdateEncounter(campaignId, encounterId ?? '');

  const conditionOptions = DEFAULT_CONDITIONS;
  const npcEntities = useMemo(
    () => (worldEntities ?? []).filter((entity) => entity.type === 'npc' || entity.type === 'npc_minor'),
    [worldEntities],
  );
  const locationEntities = useMemo(
    () => (worldEntities ?? []).filter((entity) => entity.type === 'location' || entity.type === 'location_detail'),
    [worldEntities],
  );
  const participants = useMemo(() => encounter?.participants ?? [], [encounter?.participants]);
  const participantById = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant])),
    [participants],
  );
  const selectableKeys = useMemo(
    () => [
      ...(characters ?? []).map((character) => `player:${character._id}`),
      ...participants.map((participant) => `participant:${participant.id}`),
    ],
    [characters, participants],
  );

  const resolvedSelectedKey = useMemo(() => {
    if (!selectableKeys.length) return null;
    if (selectedKey && selectableKeys.includes(selectedKey)) return selectedKey;
    return null;
  }, [selectableKeys, selectedKey]);

  const detailSubject = useMemo<DetailSubject | null>(() => {
    if (!resolvedSelectedKey) return null;
    if (resolvedSelectedKey.startsWith('player:')) {
      const id = resolvedSelectedKey.replace('player:', '');
      const character = (characters ?? []).find((item) => item._id === id);
      return character ? { kind: 'player', character } : null;
    }
    if (resolvedSelectedKey.startsWith('participant:')) {
      const id = resolvedSelectedKey.replace('participant:', '');
      const participant = participantById.get(id);
      return participant ? { kind: 'participant', participant } : null;
    }
    return null;
  }, [characters, participantById, resolvedSelectedKey]);

  const linkedInitiativeEntry = useMemo<InitiativeEntry | null>(() => {
    if (!detailSubject || !initiative?.entries?.length) return null;
    if (detailSubject.kind === 'player') {
      return initiative.entries.find((entry) =>
        entry.characterId === detailSubject.character._id ||
        entry.name.toLowerCase() === detailSubject.character.name.toLowerCase(),
      ) ?? null;
    }

    return initiative.entries.find((entry) =>
      entry.name.toLowerCase() === detailSubject.participant.name.toLowerCase(),
    ) ?? null;
  }, [detailSubject, initiative]);

  function updateEncounterPatch(patch: Record<string, unknown>) {
    if (!encounter) return;
    updateEncounter.mutate(patch as never, {
      onError: () => toast.error('Failed to update encounter'),
    });
  }

  function createBlankEncounter() {
    const count = (encounters?.length ?? 0) + 1;
    createEncounter.mutate(
      { name: `Encounter ${count}`, difficulty: 'medium' },
      {
        onSuccess: (created) => {
          setSelectedEncounterId(created._id);
          setSelectedKey(null);
          toast.success('New encounter created');
        },
        onError: () => toast.error('Failed to create encounter'),
      },
    );
  }

  function createEncounterAndContinue(onReady?: (createdId: string) => void) {
    const count = (encounters?.length ?? 0) + 1;
    createEncounter.mutate(
      { name: `Encounter ${count}`, difficulty: 'medium' },
      {
        onSuccess: (created) => {
          setSelectedEncounterId(created._id);
          setSelectedKey(null);
          toast.success('New encounter created');
          onReady?.(created._id);
        },
        onError: () => toast.error('Failed to create encounter'),
      },
    );
  }

  function openParticipantPicker(type: EncounterParticipantType) {
    if (encounter) {
      setPickerType(type);
      return;
    }

    createEncounterAndContinue(() => {
      setPickerType(type);
    });
  }

  async function duplicateEncounter() {
    if (!encounter) return;
    try {
      const created = await createEncounter.mutateAsync({
        name: `${encounter.name} (Copy)`,
        description: encounter.description || undefined,
        difficulty: encounter.difficulty,
        estimatedXP: encounter.estimatedXP || undefined,
        locationEntityId: encounter.locationEntityId,
        sessionId: encounter.sessionId,
        gridWidth: encounter.gridWidth,
        gridHeight: encounter.gridHeight,
        gridSquareSizeFt: encounter.gridSquareSizeFt,
        backgroundImageUrl: encounter.backgroundImageUrl,
        notes: encounter.notes || undefined,
        tags: encounter.tags.length ? encounter.tags : undefined,
      });

      await encountersApi.update(campaignId, created._id, {
        status: encounter.status,
        tactics: encounter.tactics,
        terrain: encounter.terrain,
        treasure: encounter.treasure,
        hooks: encounter.hooks,
        npcs: encounter.npcs,
        participants: encounter.participants,
      });

      setSelectedEncounterId(created._id);
      toast.success('Encounter duplicated');
    } catch {
      toast.error('Failed to duplicate encounter');
    }
  }

  function deleteSelectedEncounter() {
    if (!encounter) return;
    deleteEncounter.mutate(encounter._id, {
      onSuccess: () => {
        setSelectedEncounterId(null);
        setSelectedKey(null);
        toast.success('Encounter deleted');
      },
      onError: () => toast.error('Failed to delete encounter'),
    });
  }

  function openLoadOptions() {
    setLoadOptions((prev) => ({
      ...prev,
      spawnTokens: hasLoadedMap ? prev.spawnTokens : false,
    }));
    setShowLoadOptions(true);
  }

  function handleLoadToSession() {
    if (!encounter) return;
    loadEncounter.mutate(
      {
        encounterId: encounter._id,
        body: {
          ...loadOptions,
          spawnTokens: hasLoadedMap ? loadOptions.spawnTokens : false,
        },
      },
      {
        onSuccess: () => {
          setShowLoadOptions(false);
          toast.success('Encounter loaded into session');
        },
        onError: () => toast.error('Failed to load encounter'),
      },
    );
  }

  function upsertParticipant(nextParticipant: EncounterParticipant) {
    if (!encounter) return;
    const nextParticipants = participants.some((participant) => participant.id === nextParticipant.id)
      ? participants.map((participant) => (participant.id === nextParticipant.id ? nextParticipant : participant))
      : [...participants, nextParticipant];
    updateEncounterPatch({ participants: nextParticipants });
  }

  function removeParticipant(participantId: string) {
    if (!encounter) return;
    updateEncounterPatch({
      participants: participants.filter((participant) => participant.id !== participantId),
    });
    setSelectedKey(null);
  }

  function applyPrepHpDelta(participant: EncounterParticipant, delta: number) {
    const current = participant.hpCurrent ?? participant.hpMax ?? 0;
    const max = participant.hpMax ?? participant.hpCurrent ?? 0;
    upsertParticipant({
      ...participant,
      hpCurrent: max ? clamp(current + delta, 0, max) : Math.max(0, current + delta),
    });
  }

  function applyInitiativeHpDelta(entry: InitiativeEntry, delta: number) {
    const current = entry.currentHp ?? 0;
    const max = entry.maxHp ?? current;
    updateInitiativeEntry.mutate(
      {
        entryId: entry.id,
        body: { currentHp: max ? clamp(current + delta, 0, max) : Math.max(0, current + delta) },
      },
      { onError: () => toast.error('Failed to update HP') },
    );
  }

  function addPrepCondition(participant: EncounterParticipant, condition: string) {
    if (!condition) return;
    if (participant.conditions.includes(condition)) return;
    upsertParticipant({ ...participant, conditions: [...participant.conditions, condition] });
    setConditionDraft('');
  }

  function removePrepCondition(participant: EncounterParticipant, condition: string) {
    upsertParticipant({
      ...participant,
      conditions: participant.conditions.filter((item) => item !== condition),
    });
  }

  function addInitiativeCondition(entry: InitiativeEntry, condition: string) {
    if (!condition) return;
    const current = entry.conditions ?? [];
    if (current.some((item) => item.name === condition)) return;
    updateInitiativeEntry.mutate(
      {
        entryId: entry.id,
        body: {
          conditions: [
            ...current,
            { id: safeId('cond'), name: condition },
          ],
        },
      },
      { onError: () => toast.error('Failed to add condition') },
    );
    setConditionDraft('');
  }

  function removeInitiativeCondition(entry: InitiativeEntry, condition: string) {
    updateInitiativeEntry.mutate(
      {
        entryId: entry.id,
        body: {
          conditions: (entry.conditions ?? []).filter((item) => item.name !== condition),
        },
      },
      { onError: () => toast.error('Failed to remove condition') },
    );
  }

  function addParticipantFromTemplate(template: EnemyTemplate) {
    const participant: EncounterParticipant = {
      id: safeId('encp'),
      entityType: 'enemy',
      entityId: template._id,
      name: template.name,
      sourceLabel: template.source || template.category,
      hpCurrent: template.hp.average,
      hpMax: template.hp.average,
      ac: template.ac,
      initiativeBonus: template.initiativeBonus ?? 0,
      speed: formatEnemySpeed(template),
      conditions: [],
      notes: template.notes,
      attacks: template.attacks.map((attack) => ({
        name: attack.name,
        bonus: attack.bonus,
        damage: attack.damage,
        notes: attack.description,
      })),
    };
    upsertParticipant(participant);
    setSelectedKey(`participant:${participant.id}`);
    setPickerType(null);
    toast.success(`${template.name} added to encounter`);
  }

  function addParticipantFromNpc(entity: WorldEntity) {
    const typeData = (entity.typeData ?? {}) as Record<string, unknown>;
    const participant: EncounterParticipant = {
      id: safeId('encp'),
      entityType: 'npc',
      entityId: entity._id,
      name: entity.name,
      sourceLabel: entity.type === 'npc_minor' ? 'Minor NPC' : 'NPC',
      hpCurrent: readNumber(typeData.hp),
      hpMax: readNumber(typeData.hp),
      ac: readNumber(typeData.ac),
      initiativeBonus: readNumber(typeData.initiativeBonus) ?? 0,
      speed: readString(typeData.speed),
      conditions: [],
      notes: entity.description,
    };
    upsertParticipant(participant);
    setSelectedKey(`participant:${participant.id}`);
    setPickerType(null);
    toast.success(`${entity.name} added to encounter`);
  }

  function addParticipantFromCompanion(ally: Ally) {
    const participant: EncounterParticipant = {
      id: safeId('encp'),
      entityType: 'companion',
      entityId: ally._id,
      name: ally.name,
      sourceLabel: ally.role || ally.kind,
      hpCurrent: ally.statBlock.hp?.current ?? ally.statBlock.hp?.max,
      hpMax: ally.statBlock.hp?.max ?? ally.statBlock.hp?.current,
      ac: ally.statBlock.ac,
      initiativeBonus: ally.statBlock.initiativeBonus ?? 0,
      speed: ally.statBlock.speed,
      conditions: [],
      notes: ally.statBlock.notes || ally.notes || ally.description,
      attacks: ally.statBlock.actions
        ? [{ name: 'Actions', notes: ally.statBlock.actions }]
        : undefined,
    };
    upsertParticipant(participant);
    setSelectedKey(`participant:${participant.id}`);
    setPickerType(null);
    toast.success(`${ally.name} added to encounter`);
  }

  function saveDetailNotes(value: string) {
    if (!detailSubject) return;
    if (detailSubject.kind === 'participant') {
      upsertParticipant({ ...detailSubject.participant, notes: value });
    }
    if (linkedInitiativeEntry) {
      updateInitiativeEntry.mutate(
        {
          entryId: linkedInitiativeEntry.id,
          body: { notes: value },
        },
        { onError: () => toast.error('Failed to update notes') },
      );
    }
  }

  function saveInitiativeValue(value: string) {
    if (detailSubject?.kind !== 'participant') return;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    upsertParticipant({ ...detailSubject.participant, initiativeBonus: numeric });
    if (linkedInitiativeEntry) {
      updateInitiativeEntry.mutate(
        {
          entryId: linkedInitiativeEntry.id,
          body: { initiativeRoll: numeric },
        },
        { onError: () => toast.error('Failed to update initiative') },
      );
    }
  }

  const participantCount = (characters?.length ?? 0) + participants.length;
  const associatedSession = sessions?.find((session) => session._id === encounter?.sessionId);
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">Encounter Desk</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">
              {encounter?.name ?? 'Encounters'}
            </h2>
            <p className="mt-2 text-xs text-[hsl(30,14%,62%)]">
              Build the battle before the session: assemble participants, tune combat stats, and link the encounter to the right scene.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetaPill icon={Swords} label="Difficulty" value={encounter?.difficulty ?? 'draft'} />
            <MetaPill icon={Users} label="Participants" value={String(participantCount)} />
            <MetaPill icon={ScrollText} label="Session" value={associatedSession?.title ?? 'Unlinked'} />
            {initiative?.isActive && <MetaPill icon={Sparkles} label="Live Session" value="Combat Active" />}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => openParticipantPicker('enemy')} className={actionButtonClass()}>
            <Plus className="h-4 w-4" />
            Add Enemy
          </button>
          <button type="button" onClick={() => openParticipantPicker('npc')} className={actionButtonClass()}>
            <Plus className="h-4 w-4" />
            Add NPC
          </button>
          <button type="button" onClick={() => openParticipantPicker('companion')} className={actionButtonClass()}>
            <Plus className="h-4 w-4" />
            Add Companion
          </button>
          <button type="button" onClick={duplicateEncounter} disabled={!encounter || createEncounter.isPending} className={actionButtonClass()}>
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <button type="button" onClick={deleteSelectedEncounter} disabled={!encounter || deleteEncounter.isPending} className={actionButtonClass()}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            type="button"
            onClick={openLoadOptions}
            disabled={!encounter || loadEncounter.isPending}
            className={actionButtonClass(true)}
          >
            <Sparkles className="h-4 w-4" />
            {loadEncounter.isPending ? 'Loading…' : 'Load to Session'}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${panelClass} min-h-0 overflow-visible`}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="relative z-20 shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Encounter Roster</p>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={encounterId ?? ''}
                    onChange={(event) => setSelectedEncounterId(event.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">
                      {(encounters ?? []).length ? 'Select an encounter' : 'No encounters yet'}
                    </option>
                    {(encounters ?? []).map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => createEncounterAndContinue()} className={actionButtonClass(true)}>
                    <Plus className="h-4 w-4" />
                    New
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {!encounter ? (
                  <EmptyEncounterState onCreate={createBlankEncounter} />
                ) : (
                  <>
                    {initiative?.isActive && (
                      <div className="mb-4 rounded-[16px] border border-[hsla(42,62%,52%,0.24)] bg-[hsla(42,52%,16%,0.24)] px-3 py-3 text-sm text-[hsl(38,34%,82%)]">
                        Combat is currently active in the live session. This page stays in prep mode so you can keep shaping the encounter without turning into the combat runner.
                      </div>
                    )}
                  <PrepRoster
                    characters={characters ?? []}
                    participants={participants}
                    selectedKey={resolvedSelectedKey}
                    onSelect={setSelectedKey}
                  />
                  </>
                )}
              </div>
            </div>
          </aside>

          <section className={`${panelClass} min-h-0 overflow-visible`}>
            <div className="flex h-full min-h-0 flex-col">
              {encounter && (
                <div className="relative z-10 shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                    <label>
                      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Encounter Title</span>
                      <input
                        defaultValue={encounter.name}
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if (value && value !== encounter.name) updateEncounterPatch({ name: value });
                        }}
                        className={inputClass}
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Associated Session</span>
                      <select
                        value={encounter.sessionId ?? ''}
                        onChange={(event) => updateEncounterPatch({ sessionId: event.target.value || null })}
                        className={inputClass}
                      >
                        <option value="">No linked session</option>
                        {(sessions ?? []).map((session) => (
                          <option key={session._id} value={session._id}>
                            {session.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {encounter && (
                    <EncounterDossier
                      encounter={encounter}
                      locationEntities={locationEntities}
                      sessions={sessions ?? []}
                      onPatch={updateEncounterPatch}
                    />
                  )}

                  {encounter && (
                    <EncounterBattlemapPrep
                      key={`${encounter._id}-${encounter.updatedAt}`}
                      encounter={encounter}
                      uploadProgress={uploadProgress}
                      uploadPending={uploadBattleMap.isPending}
                      onUpload={(file) => {
                        uploadBattleMap.mutate(
                          { file, campaignId },
                          {
                            onSuccess: (result) => {
                              updateEncounterPatch({ backgroundImageUrl: result.url });
                              toast.success('Battlemap uploaded');
                            },
                            onError: () => toast.error('Failed to upload battlemap'),
                          },
                        );
                      }}
                      onPatch={updateEncounterPatch}
                    />
                  )}

                  <ParticipantDetail
                    subject={detailSubject}
                    encounter={encounter ?? null}
                    characters={characters ?? []}
                    participantCount={participants.length}
                    linkedInitiativeEntry={linkedInitiativeEntry}
                    conditionOptions={conditionOptions}
                    deltaAmount={deltaAmount}
                    onDeltaAmountChange={setDeltaAmount}
                    onSaveInitiative={saveInitiativeValue}
                    conditionDraft={conditionDraft}
                    onConditionDraftChange={setConditionDraft}
                    onApplyDamage={(amount) => {
                      if (!detailSubject) return;
                      if (detailSubject.kind === 'participant') applyPrepHpDelta(detailSubject.participant, -amount);
                      if (linkedInitiativeEntry) applyInitiativeHpDelta(linkedInitiativeEntry, -amount);
                    }}
                    onApplyHeal={(amount) => {
                      if (!detailSubject) return;
                      if (detailSubject.kind === 'participant') applyPrepHpDelta(detailSubject.participant, amount);
                      if (linkedInitiativeEntry) applyInitiativeHpDelta(linkedInitiativeEntry, amount);
                    }}
                    onAddCondition={() => {
                      if (!conditionDraft || !detailSubject) return;
                      if (detailSubject.kind === 'participant') addPrepCondition(detailSubject.participant, conditionDraft);
                      if (linkedInitiativeEntry) addInitiativeCondition(linkedInitiativeEntry, conditionDraft);
                    }}
                    onRemoveCondition={(condition) => {
                      if (!detailSubject) return;
                      if (detailSubject.kind === 'participant') removePrepCondition(detailSubject.participant, condition);
                      if (linkedInitiativeEntry) removeInitiativeCondition(linkedInitiativeEntry, condition);
                    }}
                    onSaveNotes={saveDetailNotes}
                    onRemoveParticipant={(participantId) => removeParticipant(participantId)}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {pickerType && encounter && (
        <ParticipantPickerModal
          type={pickerType}
          query={pickerQuery}
          onQueryChange={setPickerQuery}
          onClose={() => {
            setPickerType(null);
            setPickerQuery('');
          }}
          enemyTemplates={enemyTemplates ?? []}
          npcEntities={npcEntities}
          allies={allies ?? []}
          onPickEnemy={addParticipantFromTemplate}
          onPickNpc={addParticipantFromNpc}
          onPickCompanion={addParticipantFromCompanion}
        />
      )}

      {showLoadOptions && encounter && (
        <LoadEncounterModal
          encounterName={encounter.name}
          options={loadOptions}
          hasLoadedMap={hasLoadedMap}
          pending={loadEncounter.isPending}
          onChange={(patch) => setLoadOptions((prev) => ({ ...prev, ...patch }))}
          onClose={() => setShowLoadOptions(false)}
          onConfirm={handleLoadToSession}
        />
      )}
    </div>
  );
}

function EmptyEncounterState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm text-center">
        <p className="font-['IM_Fell_English'] text-2xl text-[hsl(38,40%,90%)]">No encounter yet.</p>
        <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,58%)]">
          Start by creating an encounter, then add enemies, NPCs, and companions into the roster from the header actions.
        </p>
        <button type="button" onClick={onCreate} className={`${actionButtonClass(true)} mt-5`}>
          <Plus className="h-4 w-4" />
          Create Your First Encounter
        </button>
      </div>
    </div>
  );
}

function PrepRoster({
  characters,
  participants,
  selectedKey,
  onSelect,
}: {
  characters: Character[];
  participants: EncounterParticipant[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const groups = [
    { label: 'Players', rows: characters.map((character) => ({ key: `player:${character._id}`, name: character.name, subtitle: character.class ? `${character.class} ${character.level}` : `Level ${character.level}`, hpCurrent: character.hp.current, hpMax: character.hp.max, ac: character.ac, conditions: character.conditions })) },
    { label: 'Companions', rows: participants.filter((participant) => participant.entityType === 'companion').map(toParticipantRow) },
    { label: 'NPCs', rows: participants.filter((participant) => participant.entityType === 'npc').map(toParticipantRow) },
    { label: 'Enemies', rows: participants.filter((participant) => participant.entityType === 'enemy').map(toParticipantRow) },
  ];

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">{group.label}</p>
          <div className="mt-2 space-y-2">
            {group.rows.length ? group.rows.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => onSelect(row.key)}
                className={`w-full rounded-[16px] border px-3 py-3 text-left transition ${
                  selectedKey === row.key
                    ? 'border-[hsla(212,42%,58%,0.36)] bg-[hsla(212,42%,58%,0.1)]'
                    : 'border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] hover:border-[hsla(212,24%,34%,0.42)]'
                }`}
              >
                <RosterRow row={row} />
              </button>
            )) : (
              <p className="rounded-[16px] border border-[hsla(32,24%,24%,0.36)] bg-[hsla(22,18%,10%,0.5)] px-3 py-3 text-sm text-[hsl(30,14%,52%)]">
                No {group.label.toLowerCase()} in this encounter yet.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EncounterDossier({
  encounter,
  locationEntities,
  sessions,
  onPatch,
}: {
  encounter: {
    name: string;
    description: string;
    difficulty: EncounterDifficulty;
    estimatedXP: number;
    status: EncounterStatus;
    locationEntityId?: string;
    sessionId?: string;
    notes: string;
    tags: string[];
    tactics?: string;
    terrain?: string;
    treasure?: string;
    hooks: string[];
  };
  locationEntities: WorldEntity[];
  sessions: Array<{ _id: string; title: string }>;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Encounter Dossier</p>
          <h3 className="mt-1 font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,40%,90%)]">
            Prep Notes & Framing
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <DetailBadge>{startCase(encounter.difficulty)}</DetailBadge>
          <DetailBadge>{startCase(encounter.status)}</DetailBadge>
          <DetailBadge>{encounter.estimatedXP ? `${encounter.estimatedXP} XP` : 'XP unset'}</DetailBadge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Description</span>
          <textarea
            defaultValue={encounter.description}
            onBlur={(event) => onPatch({ description: event.target.value })}
            rows={4}
            className={`${inputClass} min-h-[110px] resize-y`}
            placeholder="What is the setup, pressure, or battlefield fiction for this encounter?"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Difficulty</span>
            <select
              value={encounter.difficulty}
              onChange={(event) => onPatch({ difficulty: event.target.value as EncounterDifficulty })}
              className={inputClass}
            >
              {['easy', 'medium', 'hard', 'deadly'].map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {startCase(difficulty)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Status</span>
            <select
              value={encounter.status}
              onChange={(event) => onPatch({ status: event.target.value as EncounterStatus })}
              className={inputClass}
            >
              {['draft', 'ready', 'used'].map((status) => (
                <option key={status} value={status}>
                  {startCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Estimated XP</span>
            <input
              defaultValue={encounter.estimatedXP || ''}
              onBlur={(event) => onPatch({ estimatedXP: Number(event.target.value) || 0 })}
              inputMode="numeric"
              className={inputClass}
            />
          </label>
          <label>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Location</span>
            <select
              value={encounter.locationEntityId ?? ''}
              onChange={(event) => onPatch({ locationEntityId: event.target.value || null })}
              className={inputClass}
            >
              <option value="">No linked location</option>
              {locationEntities.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Session Link</span>
            <select
              value={encounter.sessionId ?? ''}
              onChange={(event) => onPatch({ sessionId: event.target.value || null })}
              className={inputClass}
            >
              <option value="">No linked session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Tactics</span>
          <textarea
            defaultValue={encounter.tactics ?? ''}
            onBlur={(event) => onPatch({ tactics: event.target.value })}
            className={textareaClass}
            placeholder="How do these participants fight, retreat, or coordinate?"
          />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Terrain</span>
          <textarea
            defaultValue={encounter.terrain ?? ''}
            onBlur={(event) => onPatch({ terrain: event.target.value })}
            className={textareaClass}
            placeholder="Chokepoints, hazards, verticality, visibility, cover…"
          />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Treasure / Aftermath</span>
          <textarea
            defaultValue={encounter.treasure ?? ''}
            onBlur={(event) => onPatch({ treasure: event.target.value })}
            className={textareaClass}
            placeholder="Loot, clues, consequences, or rewards."
          />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Hooks</span>
          <textarea
            defaultValue={encounter.hooks.join('\n')}
            onBlur={(event) => onPatch({
              hooks: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean),
            })}
            className={textareaClass}
            placeholder="One beat per line."
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">GM Notes</span>
          <textarea
            defaultValue={encounter.notes}
            onBlur={(event) => onPatch({ notes: event.target.value })}
            className={`${textareaClass} min-h-[150px]`}
            placeholder="Private reminders, pacing notes, fallback plans."
          />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Tags</span>
          <textarea
            defaultValue={encounter.tags.join(', ')}
            onBlur={(event) => onPatch({
              tags: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
            })}
            className={textareaClass}
            placeholder="ambush, social pressure, boss fight, city watch"
          />
        </label>
      </div>
    </div>
  );
}

function EncounterBattlemapPrep({
  encounter,
  uploadProgress,
  uploadPending,
  onUpload,
  onPatch,
}: {
  encounter: {
    gridWidth: number;
    gridHeight: number;
    gridSquareSizeFt: number;
    backgroundImageUrl?: string;
    tokens: Array<{ id: string }>;
  };
  uploadProgress: { percentage: number } | null;
  uploadPending: boolean;
  onUpload: (file: File) => void;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const [gridWidth, setGridWidth] = useState(String(encounter.gridWidth));
  const [gridHeight, setGridHeight] = useState(String(encounter.gridHeight));
  const [gridSquareSizeFt, setGridSquareSizeFt] = useState(String(encounter.gridSquareSizeFt));
  const [bgUrl, setBgUrl] = useState(encounter.backgroundImageUrl ?? '');

  function applyMapSettings() {
    const width = Number.parseInt(gridWidth, 10);
    const height = Number.parseInt(gridHeight, 10);
    const squareFeet = Number.parseInt(gridSquareSizeFt, 10);

    if (!width || width < 5 || width > 100) {
      toast.error('Grid width must be between 5 and 100');
      return;
    }
    if (!height || height < 5 || height > 100) {
      toast.error('Grid height must be between 5 and 100');
      return;
    }
    if (!squareFeet || squareFeet < 1 || squareFeet > 30) {
      toast.error('Grid square size must be between 1 and 30 feet');
      return;
    }

    onPatch({
      gridWidth: width,
      gridHeight: height,
      gridSquareSizeFt: squareFeet,
      backgroundImageUrl: bgUrl.trim() || undefined,
    });
    toast.success('Battlemap settings saved');
  }

  return (
    <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Battlemap Setup</p>
          <h3 className="mt-1 font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,40%,90%)]">
            Staging Ground
          </h3>
          <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,58%)]">
            Upload or choose a map, set the grid, and make sure the encounter will land cleanly in session.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DetailBadge>{encounter.gridWidth} x {encounter.gridHeight}</DetailBadge>
          <DetailBadge>{encounter.gridSquareSizeFt} ft squares</DetailBadge>
          <DetailBadge>{encounter.tokens.length} saved token{encounter.tokens.length === 1 ? '' : 's'}</DetailBadge>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] p-4">
            <ImageUpload
              onFileSelect={onUpload}
              maxSizeMB={10}
              currentImage={bgUrl || undefined}
              label="Battlemap Upload"
            />
            {uploadPending && (
              <div className="mt-3 space-y-2">
                <div className="inline-flex items-center gap-2 text-xs text-[hsl(30,14%,58%)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading map...
                </div>
                {uploadProgress && (
                  <div className="h-2 overflow-hidden rounded-full bg-[hsla(32,24%,20%,0.8)]">
                    <div
                      className="h-full rounded-full bg-[hsl(42,72%,52%)] transition-all"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Map Sources</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEFAULT_MAPS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setBgUrl(option.url)}
                  className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition ${
                    bgUrl === option.url
                      ? 'border-[hsla(42,72%,52%,0.34)] bg-[hsla(42,72%,42%,0.16)] text-[hsl(42,82%,78%)]'
                      : 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Map URL</span>
              <input
                value={bgUrl}
                onChange={(event) => setBgUrl(event.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Grid & Scale</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Width</span>
                <input value={gridWidth} onChange={(event) => setGridWidth(event.target.value)} inputMode="numeric" className={inputClass} />
              </label>
              <label>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Height</span>
                <input value={gridHeight} onChange={(event) => setGridHeight(event.target.value)} inputMode="numeric" className={inputClass} />
              </label>
              <label>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Square Ft</span>
                <input value={gridSquareSizeFt} onChange={(event) => setGridSquareSizeFt(event.target.value)} inputMode="numeric" className={inputClass} />
              </label>
            </div>
            <button type="button" onClick={applyMapSettings} className={`${actionButtonClass(true)} mt-4`}>
              Save Map Setup
            </button>
          </div>

          <div className="rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Preview</p>
              <span className="text-xs text-[hsl(30,14%,58%)]">
                {gridWidth || encounter.gridWidth} x {gridHeight || encounter.gridHeight}
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(20,18%,8%,0.86)]">
              {bgUrl ? (
                <img
                  src={bgUrl}
                  alt="Encounter battlemap preview"
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-[linear-gradient(135deg,hsla(28,18%,12%,0.96),hsla(18,18%,8%,0.96))]">
                  <p className="max-w-xs text-center text-sm leading-7 text-[hsl(30,14%,58%)]">
                    No battlemap selected yet. Upload one, paste a URL, or choose a preset to stage the field.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadEncounterModal({
  encounterName,
  options,
  hasLoadedMap,
  pending,
  onChange,
  onClose,
  onConfirm,
}: {
  encounterName: string;
  options: LoadEncounterRequest;
  hasLoadedMap: boolean;
  pending: boolean;
  onChange: (patch: Partial<LoadEncounterRequest>) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 px-4">
      <div className={`${panelClass} w-full max-w-xl overflow-hidden`}>
        <div className="border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Load Encounter</p>
          <h3 className="mt-1 font-['IM_Fell_English'] text-3xl text-[hsl(38,40%,90%)]">{encounterName}</h3>
          <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">
            Keep the prep desk here, but choose how this encounter should arrive in the live session.
          </p>
        </div>

        <div className="space-y-3 px-5 py-5 text-sm text-[hsl(38,26%,86%)]">
          <ToggleRow
            checked={options.addToInitiative ?? true}
            label="Add to initiative"
            onChange={(checked) => onChange({ addToInitiative: checked })}
          />
          <ToggleRow
            checked={options.clearExisting ?? true}
            label="Clear existing initiative first"
            onChange={(checked) => onChange({ clearExisting: checked })}
          />
          <ToggleRow
            checked={options.clearExistingMap ?? true}
            label="Clear existing map first"
            onChange={(checked) => onChange({ clearExistingMap: checked })}
          />
          <ToggleRow
            checked={hasLoadedMap ? options.spawnTokens ?? false : false}
            label={`Spawn tokens on map${hasLoadedMap ? '' : ' (map not active)'}`}
            disabled={!hasLoadedMap}
            onChange={(checked) => onChange({ spawnTokens: checked })}
          />
          <ToggleRow
            checked={options.autoRollInitiative ?? true}
            label="Auto-roll non-player initiative"
            disabled={!(options.addToInitiative ?? true)}
            onChange={(checked) => onChange({ autoRollInitiative: checked })}
          />
          <ToggleRow
            checked={options.startCombat ?? false}
            label="Start combat immediately"
            disabled={!(options.addToInitiative ?? true)}
            onChange={(checked) => onChange({ startCombat: checked })}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-[hsla(32,24%,24%,0.42)] px-5 py-4">
          <button type="button" onClick={onClose} disabled={pending} className={actionButtonClass()}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className={actionButtonClass(true)}>
            {pending ? 'Loading…' : 'Load Encounter'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ParticipantDetail({
  subject,
  encounter,
  characters,
  participantCount,
  linkedInitiativeEntry,
  conditionOptions,
  deltaAmount,
  onDeltaAmountChange,
  onSaveInitiative,
  conditionDraft,
  onConditionDraftChange,
  onApplyDamage,
  onApplyHeal,
  onAddCondition,
  onRemoveCondition,
  onSaveNotes,
  onRemoveParticipant,
}: {
  subject: DetailSubject | null;
  encounter: {
    difficulty: EncounterDifficulty;
    estimatedXP: number;
    sessionId?: string;
    notes: string;
    tactics?: string;
    terrain?: string;
  } | null;
  characters: Character[];
  participantCount: number;
  linkedInitiativeEntry: InitiativeEntry | null;
  conditionOptions: ConditionDef[];
  deltaAmount: string;
  onDeltaAmountChange: (value: string) => void;
  onSaveInitiative: (value: string) => void;
  conditionDraft: string;
  onConditionDraftChange: (value: string) => void;
  onApplyDamage: (amount: number) => void;
  onApplyHeal: (amount: number) => void;
  onAddCondition: () => void;
  onRemoveCondition: (condition: string) => void;
  onSaveNotes: (value: string) => void;
  onRemoveParticipant: (participantId: string) => void;
}) {
  if (!subject) {
    const partyLevelTotal = characters.reduce((sum, character) => sum + character.level, 0);
    const averagePartyLevel = characters.length ? (partyLevelTotal / characters.length).toFixed(1) : '—';
    const totalPartyHp = characters.reduce((sum, character) => sum + (character.hp.max ?? 0), 0);

    return (
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Encounter Overview</p>
          <h3 className="mt-1 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,40%,90%)]">
            Prep the table first
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[hsl(30,14%,58%)]">
            Select a participant when you want to adjust a specific stat block. Until then, this panel should help you judge whether the scene is ready for the party.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <StatTile icon={Users} label="Party Size" value={String(characters.length)} />
            <StatTile icon={Sparkles} label="Avg Level" value={String(averagePartyLevel)} />
            <StatTile icon={Heart} label="Party HP" value={String(totalPartyHp || '—')} />
            <StatTile icon={Swords} label="Participants" value={String(participantCount)} />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Party Rating</p>
            <div className="mt-3 space-y-3 text-sm text-[hsl(30,14%,58%)]">
              <div className="rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] px-3 py-3">
                <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">
                  {encounter ? startCase(encounter.difficulty) : 'Draft'} encounter
                </p>
                <p className="mt-2 leading-6">
                  {encounter?.estimatedXP
                    ? `${encounter.estimatedXP} XP budget currently set for this scene.`
                    : 'No XP budget has been set yet for this encounter.'}
                </p>
              </div>
              <div className="rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] px-3 py-3">
                <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">Read at a glance</p>
                <p className="mt-2 leading-6">
                  {characters.length
                    ? `Built for ${characters.length} player${characters.length === 1 ? '' : 's'} around level ${averagePartyLevel}.`
                    : 'No party characters were found for this campaign yet.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">GM Prep Notes</p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[hsl(30,14%,58%)]">
                <p>{encounter?.notes?.trim() || 'No encounter notes yet.'}</p>
                {encounter?.tactics && (
                  <p>
                    <span className="font-[Cinzel] text-[hsl(38,34%,86%)]">Tactics:</span> {encounter.tactics}
                  </p>
                )}
                {encounter?.terrain && (
                  <p>
                    <span className="font-[Cinzel] text-[hsl(38,34%,86%)]">Terrain:</span> {encounter.terrain}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Next Step</p>
              <p className="mt-3 text-sm leading-7 text-[hsl(30,14%,58%)]">
                Add enemies, NPCs, or companions from the header, then click a participant in the roster when you want to tune HP, AC, initiative bonus, or conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getDetailStats(subject, linkedInitiativeEntry);
  const conditions = getDetailConditions(subject, linkedInitiativeEntry);
  const notes = getDetailNotes(subject, linkedInitiativeEntry);
  const attacks = getDetailAttacks(subject);
  const isEncounterParticipant = subject.kind === 'participant';

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Participant Detail</p>
            <h3 className="mt-1 font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,40%,90%)]">
              {stats.name}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <DetailBadge>{stats.typeLabel}</DetailBadge>
              <DetailBadge>{stats.sourceLabel}</DetailBadge>
              {stats.speed && <DetailBadge>{stats.speed}</DetailBadge>}
            </div>
          </div>

          <div className="flex gap-2">
            {isEncounterParticipant && (
              <button
                type="button"
                onClick={() => onRemoveParticipant(subject.participant.id)}
                className="inline-flex items-center gap-2 rounded-full border border-[hsla(2,52%,42%,0.34)] bg-[hsla(2,42%,12%,0.54)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(2,62%,78%)]"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <StatTile icon={Heart} label="HP" value={formatHp(stats.hpCurrent, stats.hpMax)} />
          <StatTile icon={Shield} label="AC" value={stats.ac ? String(stats.ac) : '—'} />
          <StatTile icon={Sparkles} label={isEncounterParticipant ? 'Init Bonus' : 'Initiative'} value={stats.initiative ?? '—'} />
          <StatTile icon={ScrollText} label="Conditions" value={String(conditions.length)} />
        </div>
        {linkedInitiativeEntry && (
          <p className="mt-4 text-sm text-[hsl(30,14%,58%)]">
            This participant is also active in live initiative right now. Prep changes here stay encounter-first, and linked combat values are mirrored into the active session.
          </p>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Quick Actions</p>
            <div className="mt-3 space-y-3">
              <input
                value={deltaAmount}
                onChange={(event) => onDeltaAmountChange(event.target.value)}
                className={numberInputClass}
                inputMode="numeric"
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onApplyDamage(Number(deltaAmount) || 0)} className={dangerButtonClass()}>
                  Damage
                </button>
                <button type="button" onClick={() => onApplyHeal(Number(deltaAmount) || 0)} className={successButtonClass()}>
                  Heal
                </button>
              </div>
              {isEncounterParticipant && (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">Initiative Bonus</label>
                  <input
                    key={subject.participant.id}
                    defaultValue={subject.participant.initiativeBonus ?? ''}
                    onBlur={(event) => onSaveInitiative(event.target.value)}
                    className={numberInputClass}
                    inputMode="numeric"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Conditions</p>
            <div className="mt-3 flex gap-2">
              <select value={conditionDraft} onChange={(event) => onConditionDraftChange(event.target.value)} className={inputClass}>
                <option value="">Choose condition</option>
                {conditionOptions.map((condition) => (
                  <option key={condition.key} value={condition.label}>
                    {condition.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={onAddCondition} className={actionButtonClass()}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {conditions.length ? conditions.map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => onRemoveCondition(condition)}
                  className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1.5 text-xs text-[hsl(212,34%,74%)]"
                >
                  {condition}
                </button>
              )) : (
                <p className="text-sm text-[hsl(30,14%,56%)]">No active conditions.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {attacks.length > 0 && (
            <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Attack Options</p>
              <div className="mt-3 space-y-3">
                {attacks.map((attack) => (
                  <div key={attack.name} className="rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{attack.name}</p>
                      {(attack.bonus != null || attack.damage) && (
                        <p className="text-xs text-[hsl(30,14%,58%)]">
                          {attack.bonus != null ? `${attack.bonus >= 0 ? '+' : ''}${attack.bonus}` : '—'}
                          {attack.damage ? ` · ${attack.damage}` : ''}
                        </p>
                      )}
                    </div>
                    {attack.notes && <p className="mt-2 text-sm leading-6 text-[hsl(30,14%,58%)]">{attack.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Notes & Abilities</p>
            <textarea
              defaultValue={notes}
              onBlur={(event) => onSaveNotes(event.target.value)}
              rows={10}
              className={`${inputClass} min-h-[240px] resize-y`}
              placeholder="Encounter-specific notes, tactics, abilities, or reminders…"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantPickerModal({
  type,
  query,
  onQueryChange,
  onClose,
  enemyTemplates,
  npcEntities,
  allies,
  onPickEnemy,
  onPickNpc,
  onPickCompanion,
}: {
  type: EncounterParticipantType;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  enemyTemplates: EnemyTemplate[];
  npcEntities: WorldEntity[];
  allies: Ally[];
  onPickEnemy: (template: EnemyTemplate) => void;
  onPickNpc: (entity: WorldEntity) => void;
  onPickCompanion: (ally: Ally) => void;
}) {
  const lowered = query.trim().toLowerCase();
  const enemies = enemyTemplates.filter((template) => matchesQuery([template.name, template.category, template.source, template.tags.join(' ')], lowered));
  const npcs = npcEntities.filter((entity) => matchesQuery([entity.name, entity.description, entity.tags.join(' ')], lowered));
  const companions = allies.filter((ally) => matchesQuery([ally.name, ally.role, ally.kind, ally.description], lowered));

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 px-4">
      <div className={`${panelClass} w-full max-w-3xl overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Add Participant</p>
            <h3 className="mt-1 font-['IM_Fell_English'] text-3xl text-[hsl(38,40%,90%)]">{startCase(type)}</h3>
          </div>
          <button type="button" onClick={onClose} className={actionButtonClass()}>
            Close
          </button>
        </div>
        <div className="p-5">
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={`Search ${type}s…`}
            className={inputClass}
          />
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {type === 'enemy' && (
              <PickerList
                items={enemies}
                getKey={(item) => item._id}
                renderItem={(item) => (
                  <button key={item._id} type="button" onClick={() => onPickEnemy(item)} className={pickerRowClass()}>
                    <div>
                      <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{item.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
                        {item.category} · AC {item.ac} · HP {item.hp.average}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[hsl(212,24%,66%)]" />
                  </button>
                )}
                emptyLabel="No enemy templates match this search."
              />
            )}
            {type === 'npc' && (
              <PickerList
                items={npcs}
                getKey={(item) => item._id}
                renderItem={(item) => (
                  <button key={item._id} type="button" onClick={() => onPickNpc(item)} className={pickerRowClass()}>
                    <div>
                      <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{item.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
                        {item.type === 'npc_minor' ? 'Minor NPC' : 'NPC'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[hsl(212,24%,66%)]" />
                  </button>
                )}
                emptyLabel="No campaign NPCs match this search."
              />
            )}
            {type === 'companion' && (
              <PickerList
                items={companions}
                getKey={(item) => item._id}
                renderItem={(item) => (
                  <button key={item._id} type="button" onClick={() => onPickCompanion(item)} className={pickerRowClass()}>
                    <div>
                      <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{item.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">
                        {item.role || item.kind}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[hsl(212,24%,66%)]" />
                  </button>
                )}
                emptyLabel="No companions match this search."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PickerList<T>({
  items,
  getKey,
  renderItem,
  emptyLabel,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyLabel: string;
}) {
  if (!items.length) {
    return <p className="rounded-[16px] border border-[hsla(32,24%,24%,0.42)] px-4 py-4 text-sm text-[hsl(30,14%,56%)]">{emptyLabel}</p>;
  }

  return <div className="space-y-2">{items.map((item) => <div key={getKey(item)}>{renderItem(item)}</div>)}</div>;
}

function RosterRow({
  row,
}: {
  row: {
    key: string;
    name: string;
    subtitle: string;
    hpCurrent?: number;
    hpMax?: number;
    ac?: number;
    conditions: string[];
  };
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-[Cinzel] text-sm text-[hsl(38,34%,86%)]">{row.name}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{row.subtitle}</p>
        </div>
        <div className="text-right text-xs text-[hsl(30,12%,58%)]">
          {formatHp(row.hpCurrent, row.hpMax)}
        </div>
      </div>
      <RosterFooter row={row} />
    </>
  );
}

function RosterFooter({
  row,
}: {
  row: {
    hpCurrent?: number;
    hpMax?: number;
    ac?: number;
    conditions: string[];
  };
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[hsl(30,12%,58%)]">
      {row.ac != null && <span>AC {row.ac}</span>}
      {row.conditions.slice(0, 3).map((condition) => (
        <span key={condition} className="rounded-full border border-[hsla(212,24%,28%,0.34)] px-2 py-0.5 text-[10px] text-[hsl(212,34%,74%)]">
          {condition}
        </span>
      ))}
    </div>
  );
}

function MetaPill({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1.5">
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="ml-2 font-[Cinzel] text-sm text-[hsl(38,40%,88%)]">{value}</span>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Heart; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.72)] px-4 py-3">
      <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 font-['IM_Fell_English'] text-[24px] leading-none text-[hsl(38,40%,88%)]">{value}</p>
    </div>
  );
}

function DetailBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] px-3 py-1 text-xs text-[hsl(212,34%,74%)]">
      {children}
    </span>
  );
}

function ToggleRow({
  checked,
  label,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-center gap-3 rounded-[16px] border px-3 py-3 ${disabled ? 'border-[hsla(32,14%,20%,0.42)] opacity-55' : 'border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.5)]'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[hsl(42,72%,52%)]"
      />
      <span>{label}</span>
    </label>
  );
}

function actionButtonClass(accent = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
    accent
      ? 'border-[hsla(42,72%,52%,0.34)] bg-[hsla(42,72%,42%,0.16)] text-[hsl(42,82%,78%)] hover:bg-[hsla(42,72%,42%,0.22)]'
      : 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)] hover:bg-[hsla(220,18%,16%,0.9)]'
  }`;
}

function dangerButtonClass() {
  return 'rounded-2xl border border-[hsla(2,52%,42%,0.34)] bg-[hsla(2,42%,12%,0.54)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(2,62%,78%)]';
}

function successButtonClass() {
  return 'rounded-2xl border border-[hsla(145,42%,38%,0.34)] bg-[hsla(145,42%,12%,0.54)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(145,62%,78%)]';
}

function pickerRowClass() {
  return 'flex w-full items-center justify-between rounded-[16px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.68)] px-4 py-3 text-left transition hover:border-[hsla(212,24%,34%,0.42)]';
}

function toParticipantRow(participant: EncounterParticipant) {
  return {
    key: `participant:${participant.id}`,
    name: participant.name,
    subtitle: participant.sourceLabel ?? startCase(participant.entityType),
    hpCurrent: participant.hpCurrent,
    hpMax: participant.hpMax,
    ac: participant.ac,
    conditions: participant.conditions,
  };
}

function getDetailStats(subject: DetailSubject, linkedInitiativeEntry: InitiativeEntry | null) {
  if (subject.kind === 'player') {
    return {
      name: subject.character.name,
      typeLabel: 'Player',
      sourceLabel: subject.character.class ? `${subject.character.class} ${subject.character.level}` : 'Campaign character',
      hpCurrent: linkedInitiativeEntry?.currentHp ?? subject.character.hp.current,
      hpMax: linkedInitiativeEntry?.maxHp ?? subject.character.hp.max,
      ac: linkedInitiativeEntry?.ac ?? subject.character.ac,
      initiative: String(linkedInitiativeEntry?.initiativeRoll ?? subject.character.initiativeBonus),
      speed: subject.character.speed ? `${subject.character.speed} ft` : undefined,
    };
  }

  return {
    name: subject.participant.name,
    typeLabel: startCase(subject.participant.entityType),
    sourceLabel: subject.participant.sourceLabel ?? 'Encounter participant',
    hpCurrent: linkedInitiativeEntry?.currentHp ?? subject.participant.hpCurrent,
    hpMax: linkedInitiativeEntry?.maxHp ?? subject.participant.hpMax,
    ac: linkedInitiativeEntry?.ac ?? subject.participant.ac,
    initiative: String(linkedInitiativeEntry?.initiativeRoll ?? subject.participant.initiativeBonus ?? '—'),
    speed: subject.participant.speed,
  };
}

function getDetailConditions(subject: DetailSubject, linkedInitiativeEntry: InitiativeEntry | null) {
  if (subject.kind === 'player') return subject.character.conditions;
  if (linkedInitiativeEntry) return (linkedInitiativeEntry.conditions ?? []).map((condition) => condition.name);
  return subject.participant.conditions;
}

function getDetailNotes(subject: DetailSubject, linkedInitiativeEntry: InitiativeEntry | null) {
  if (subject.kind === 'player') return subject.character.backstory ?? '';
  return linkedInitiativeEntry?.notes ?? subject.participant.notes ?? '';
}

function getDetailAttacks(subject: DetailSubject): EncounterParticipantAttack[] {
  if (subject.kind === 'participant') return subject.participant.attacks ?? [];
  return [];
}

function matchesQuery(values: Array<string | undefined>, query: string) {
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

function formatHp(current?: number, max?: number) {
  if (current == null && max == null) return 'HP —';
  return `HP ${current ?? 0}/${max ?? current ?? 0}`;
}

function formatEnemySpeed(template: EnemyTemplate) {
  const parts = [`${template.speed.walk} ft`];
  if (template.speed.fly) parts.push(`Fly ${template.speed.fly}`);
  if (template.speed.swim) parts.push(`Swim ${template.speed.swim}`);
  if (template.speed.climb) parts.push(`Climb ${template.speed.climb}`);
  return parts.join(' · ');
}

function startCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}
