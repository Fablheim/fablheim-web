import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ChevronRight,
  Heart,
  Loader2,
  Plus,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { EncounterMapEditor } from '@/components/encounters/EncounterMapEditor';
import { useCharacters } from '@/hooks/useCharacters';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { useArcs } from '@/hooks/useCampaigns';
import type { CampaignArc } from '@/types/campaign';
import { useAllies } from '@/hooks/useAllies';
import { useEnemyTemplates } from '@/hooks/useCreatureTemplates';
import { formatCharacterClass } from '@/lib/character-utils';
import type { Character, WorldEntity, Ally } from '@/types/campaign';
import type {
  EncounterParticipant,
  EncounterParticipantAttack,
  EncounterParticipantTrait,
  EncounterParticipantType,
} from '@/types/encounter';
import type { EnemyTemplate } from '@/types/creature-template';
import type { ConditionDef } from '@/types/combat-rules';
import type { EncounterDifficulty, EncounterStatus } from '@/types/encounter';
import { shellPanelClass } from '@/lib/panel-styles';
import { useEncounterPrepContext } from './EncounterPrepContext';

interface EncounterCenterStageV2Props {
  campaignId: string;
}

type DetailSubject =
  | { kind: 'player'; character: Character }
  | { kind: 'participant'; participant: EncounterParticipant };

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(212,42%,58%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const numberInputClass = `${inputClass} text-center`;
const textareaClass = `${inputClass} min-h-[120px] resize-y`;
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
  // ── Shared context ───────────────────────────────────────
  const {
    encounter,
    pickerType,
    setPickerType,
    pickerQuery,
    setPickerQuery,
    updateEncounterPatch,
    selectedKey,
    setSelectedKey,
    upsertParticipant,
    removeParticipant,
  } = useEncounterPrepContext();

  // ── Data ─────────────────────────────────────────────────
  const { data: sessions } = useSessions(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const { data: allies } = useAllies(campaignId);
  const { data: enemyTemplates } = useEnemyTemplates();
const { uploadBattleMap, progress: uploadProgress } = useFileUpload();

  // ── Local UI state ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'notes' | 'map' | 'stat-block'>('notes');
  const [conditionDraft, setConditionDraft] = useState('');

  // ── Derived ───────────────────────────────────────────────
  const conditionOptions = DEFAULT_CONDITIONS;
  const npcEntities = useMemo(
    () => (worldEntities ?? []).filter((e) => e.type === 'npc' || e.type === 'npc_minor'),
    [worldEntities],
  );
  const locationEntities = useMemo(
    () => (worldEntities ?? []).filter((e) => e.type === 'location' || e.type === 'location_detail'),
    [worldEntities],
  );
  const participants = useMemo(() => encounter?.participants ?? [], [encounter?.participants]);
  const participantById = useMemo(
    () => new Map(participants.map((p) => [p.id, p])),
    [participants],
  );
  const selectableKeys = useMemo(
    () => [
      ...(characters ?? []).map((c) => `player:${c._id}`),
      ...participants.map((p) => `participant:${p.id}`),
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
      const character = (characters ?? []).find((c) => c._id === id);
      return character ? { kind: 'player', character } : null;
    }
    if (resolvedSelectedKey.startsWith('participant:')) {
      const id = resolvedSelectedKey.replace('participant:', '');
      const participant = participantById.get(id);
      return participant ? { kind: 'participant', participant } : null;
    }
    return null;
  }, [characters, participantById, resolvedSelectedKey]);

  // ── Participant management ────────────────────────────────

  // Switch to stat-block tab when a roster item is selected from the right panel
  useEffect(() => {
    if (selectedKey) setActiveTab('stat-block');
  }, [selectedKey]);

  function addCondition(participant: EncounterParticipant, condition: string) {
    if (!condition || participant.conditions.includes(condition)) return;
    upsertParticipant({ ...participant, conditions: [...participant.conditions, condition] });
    setConditionDraft('');
  }

  function removeCondition(participant: EncounterParticipant, condition: string) {
    upsertParticipant({ ...participant, conditions: participant.conditions.filter((c) => c !== condition) });
  }

  function addParticipantFromTemplate(template: EnemyTemplate) {
    const existingCount = participants.filter((p) => p.entityId === template._id).length;
    const name = existingCount > 0 ? `${template.name} ${existingCount + 1}` : template.name;
    const participant: EncounterParticipant = {
      id: safeId('encp'),
      entityType: 'enemy',
      entityId: template._id,
      name,
      sourceLabel: template.source || template.category,
      hpCurrent: template.hp.average,
      hpMax: template.hp.average,
      ac: template.ac,
      initiativeBonus: template.initiativeBonus ?? 0,
      speed: formatEnemySpeed(template),
      conditions: [],
      notes: template.notes,
      cr: template.cr,
      size: template.size,
      abilities: template.abilities,
      tokenImage: template.tokenImage,
      tokenColor: template.tokenColor,
      attacks: template.attacks.map((a) => ({ name: a.name, bonus: a.bonus, damage: a.damage, actionCost: a.actionCost, range: a.range, notes: a.description })),
      traits: template.traits.map((t) => ({ name: t.name, description: t.description })),
    };
    upsertParticipant(participant);
    setSelectedKey(`participant:${participant.id}`);
    toast.success(`${template.name} added`);
  }

  function addParticipantFromNpc(entity: WorldEntity) {
    const td = (entity.typeData ?? {}) as Record<string, unknown>;
    const participant: EncounterParticipant = {
      id: safeId('encp'),
      entityType: 'npc',
      entityId: entity._id,
      name: entity.name,
      sourceLabel: entity.type === 'npc_minor' ? 'Minor NPC' : 'NPC',
      hpCurrent: readNumber(td.hp),
      hpMax: readNumber(td.hp),
      ac: readNumber(td.ac),
      initiativeBonus: readNumber(td.initiativeBonus) ?? 0,
      speed: readString(td.speed),
      conditions: [],
      notes: entity.description,
    };
    upsertParticipant(participant);
    setSelectedKey(`participant:${participant.id}`);
    toast.success(`${entity.name} added`);
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
      attacks: ally.statBlock.actions ? [{ name: 'Actions', notes: ally.statBlock.actions }] : undefined,
    };
    upsertParticipant(participant);
    setSelectedKey(`participant:${participant.id}`);
    toast.success(`${ally.name} added`);
  }

  function saveDetailNotes(value: string) {
    if (detailSubject?.kind === 'participant') {
      upsertParticipant({ ...detailSubject.participant, notes: value });
    }
  }

  function saveParticipantField(field: 'name' | 'hpMax' | 'ac', value: string) {
    if (detailSubject?.kind !== 'participant') return;
    const p = detailSubject.participant;
    if (field === 'name') {
      const trimmed = value.trim();
      if (trimmed) upsertParticipant({ ...p, name: trimmed });
    } else if (field === 'hpMax') {
      const n = Number(value);
      if (!Number.isNaN(n) && n >= 0) {
        upsertParticipant({ ...p, hpMax: n, hpCurrent: Math.min(p.hpCurrent ?? n, n) });
      }
    } else if (field === 'ac') {
      const n = Number(value);
      if (!Number.isNaN(n)) upsertParticipant({ ...p, ac: n || undefined });
    }
  }

  function saveInitiativeValue(value: string) {
    if (detailSubject?.kind !== 'participant') return;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    upsertParticipant({ ...detailSubject.participant, initiativeBonus: numeric });
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="min-h-0 flex-1 p-4">
        {renderSection()}
      </div>

      {pickerType && encounter && (
        <ParticipantPickerModal
          type={pickerType}
          query={pickerQuery}
          onQueryChange={setPickerQuery}
          onClose={() => { setPickerType(null); setPickerQuery(''); }}
          enemyTemplates={enemyTemplates ?? []}
          npcEntities={npcEntities}
          allies={allies ?? []}
          onPickEnemy={addParticipantFromTemplate}
          onPickNpc={addParticipantFromNpc}
          onPickCompanion={addParticipantFromCompanion}
        />
      )}
    </div>
  );

  // ── Section ───────────────────────────────────────────────

  function renderSection() {
    return (
      <section className={`${shellPanelClass} flex-1 min-h-0 flex flex-col overflow-hidden`}>
        {encounter && renderSectionHeader()}
        {renderNotesTab()}
        {renderMapTab()}
        {renderStatBlockTab()}
      </section>
    );
  }

  function renderSectionHeader() {
    if (!encounter) return null;
    return (
      <div className="relative z-10 shrink-0 border-b border-[hsla(32,24%,24%,0.42)]">
        <TabStrip
          active={activeTab}
          onSelect={setActiveTab}
          statBlockLabel={detailSubject?.kind === 'participant' ? detailSubject.participant.name : undefined}
          onCloseStatBlock={activeTab === 'stat-block' ? () => { setSelectedKey(null); setActiveTab('notes'); } : undefined}
        />
      </div>
    );
  }

  function renderNotesTab() {
    if (encounter && activeTab !== 'notes') return null;
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[840px] px-4 py-5 pb-10">
          {encounter ? (
            <EncounterDossier
              encounter={encounter}
              locationEntities={locationEntities}
              sessions={(sessions ?? []).filter((s): s is typeof s & { title: string } => !!s.title)}
              playerCount={characters?.length ?? 0}
              onPatch={updateEncounterPatch}
              campaignId={campaignId}
              encounterId={encounter._id}
            />
          ) : (
            <ParticipantDetail
              subject={null}
              encounter={null}
              characters={characters ?? []}
              participantCount={0}
              conditionOptions={conditionOptions}
              onSaveInitiative={saveInitiativeValue}
              conditionDraft={conditionDraft}
              onConditionDraftChange={setConditionDraft}
              onAddCondition={() => {}}
              onRemoveCondition={() => {}}
              onSaveNotes={saveDetailNotes}
              onSaveParticipantField={saveParticipantField}
              onRemoveParticipant={removeParticipant}
            />
          )}
        </div>
      </div>
    );
  }

  function renderMapTab() {
    if (!encounter || activeTab !== 'map') return null;
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-10">
        <EncounterBattlemapSection
          encounter={encounter}
          campaignId={campaignId}
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
        />
      </div>
    );
  }

  function renderStatBlockTab() {
    if (!encounter || activeTab !== 'stat-block') return null;
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[840px] px-4 py-5 pb-10">
          <ParticipantDetail
            subject={detailSubject}
            encounter={encounter}
            characters={characters ?? []}
            participantCount={participants.length}
            conditionOptions={conditionOptions}
            onSaveInitiative={saveInitiativeValue}
            conditionDraft={conditionDraft}
            onConditionDraftChange={setConditionDraft}
            onAddCondition={() => {
              if (!conditionDraft || detailSubject?.kind !== 'participant') return;
              addCondition(detailSubject.participant, conditionDraft);
            }}
            onRemoveCondition={(condition) => {
              if (detailSubject?.kind !== 'participant') return;
              removeCondition(detailSubject.participant, condition);
            }}
            onSaveNotes={saveDetailNotes}
            onSaveParticipantField={saveParticipantField}
            onRemoveParticipant={removeParticipant}
          />
        </div>
      </div>
    );
  }
}

// ── Sub-components ────────────────────────────────────────────

function EncounterDossier({
  encounter,
  locationEntities,
  sessions,
  playerCount,
  onPatch,
  campaignId,
  encounterId,
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
  playerCount: number;
  onPatch: (patch: Record<string, unknown>) => void;
  campaignId: string;
  encounterId: string;
}) {
  const { data: arcsData } = useArcs(campaignId);
  const linkedArcs = useMemo(() => {
    if (!arcsData) return [];
    return (arcsData as CampaignArc[]).filter(
      (arc) => arc.links?.encounterIds?.includes(encounterId),
    );
  }, [arcsData, encounterId]);

  return (
    <div>
      {linkedArcs.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Advances</span>
          {linkedArcs.slice(0, 3).map((arc) => (
            <span
              key={arc._id}
              className="inline-flex items-center gap-1 rounded-full border border-[hsla(38,60%,52%,0.32)] bg-[hsla(38,60%,52%,0.1)] px-2 py-0.5 text-[10px] font-medium text-[hsl(38,82%,63%)]"
            >
              {arc.name}
              <span className="text-[9px] opacity-60">{arc.status}</span>
            </span>
          ))}
          {linkedArcs.length > 3 && (
            <span className="text-[10px] text-[hsl(30,12%,58%)]">+{linkedArcs.length - 3} more</span>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Prep Notes & Framing</p>
        <div className="flex flex-wrap gap-1.5">
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
            onBlur={(e) => onPatch({ description: e.target.value })}
            rows={4}
            className={`${inputClass} min-h-[110px] resize-y`}
            placeholder="What is the setup, pressure, or battlefield fiction for this encounter?"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Difficulty</span>
            <select value={encounter.difficulty} onChange={(e) => onPatch({ difficulty: e.target.value as EncounterDifficulty })} className={inputClass}>
              {['easy', 'medium', 'hard', 'deadly'].map((d) => (
                <option key={d} value={d}>{startCase(d)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Status</span>
            <select value={encounter.status} onChange={(e) => onPatch({ status: e.target.value as EncounterStatus })} className={inputClass}>
              {['draft', 'ready', 'used'].map((s) => (
                <option key={s} value={s}>{startCase(s)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Estimated XP</span>
            <input
              defaultValue={encounter.estimatedXP || ''}
              onBlur={(e) => onPatch({ estimatedXP: Number(e.target.value) || 0 })}
              inputMode="numeric"
              className={inputClass}
            />
            {encounter.estimatedXP > 0 && playerCount > 0 && (
              <p className="mt-1 text-[10px] text-[hsl(30,12%,52%)]">
                ~{Math.round(encounter.estimatedXP / playerCount).toLocaleString()} per player ({playerCount}p)
              </p>
            )}
          </label>
          <label>
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Location</span>
            <select value={encounter.locationEntityId ?? ''} onChange={(e) => onPatch({ locationEntityId: e.target.value || null })} className={inputClass}>
              <option value="">No linked location</option>
              {locationEntities.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Session Link</span>
            <select value={encounter.sessionId ?? ''} onChange={(e) => onPatch({ sessionId: e.target.value || null })} className={inputClass}>
              <option value="">No linked session</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>{s.title}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-[hsla(32,24%,24%,0.36)] pt-4 lg:grid-cols-2">
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Tactics</span>
          <textarea defaultValue={encounter.tactics ?? ''} onBlur={(e) => onPatch({ tactics: e.target.value })} className={textareaClass} placeholder="How do these participants fight, retreat, or coordinate?" />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Terrain</span>
          <textarea defaultValue={encounter.terrain ?? ''} onBlur={(e) => onPatch({ terrain: e.target.value })} className={textareaClass} placeholder="Chokepoints, hazards, verticality, visibility, cover…" />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Treasure / Aftermath</span>
          <textarea defaultValue={encounter.treasure ?? ''} onBlur={(e) => onPatch({ treasure: e.target.value })} className={textareaClass} placeholder="Loot, clues, consequences, or rewards." />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Hooks</span>
          <textarea
            defaultValue={encounter.hooks.join('\n')}
            onBlur={(e) => onPatch({ hooks: e.target.value.split('\n').map((h) => h.trim()).filter(Boolean) })}
            className={textareaClass}
            placeholder="One beat per line."
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 border-t border-[hsla(32,24%,24%,0.36)] pt-4 lg:grid-cols-2">
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">GM Notes</span>
          <textarea defaultValue={encounter.notes} onBlur={(e) => onPatch({ notes: e.target.value })} className={`${textareaClass} min-h-[150px]`} placeholder="Private reminders, pacing notes, fallback plans." />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Tags</span>
          <textarea
            defaultValue={encounter.tags.join(', ')}
            onBlur={(e) => onPatch({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
            className={textareaClass}
            placeholder="ambush, social pressure, boss fight, city watch"
          />
        </label>
      </div>
    </div>
  );
}

function EncounterBattlemapSection({
  encounter,
  campaignId,
  uploadProgress,
  uploadPending,
  onUpload,
}: {
  encounter: import('@/types/encounter').Encounter;
  campaignId: string;
  uploadProgress: { percentage: number } | null;
  uploadPending: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Battlemap Setup</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
            Pre-place tokens on the grid before loading into session.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <DetailBadge>{encounter.gridWidth} x {encounter.gridHeight}</DetailBadge>
          <DetailBadge>{encounter.gridSquareSizeFt} ft squares</DetailBadge>
          <DetailBadge>{encounter.tokens.length} saved token{encounter.tokens.length === 1 ? '' : 's'}</DetailBadge>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ImageUpload onFileSelect={onUpload} maxSizeMB={10} label="Upload Map" compact />
        {uploadPending && (
          <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-[hsl(30,14%,58%)]">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            <div className="min-w-0 flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-[hsla(32,24%,20%,0.8)]">
                {uploadProgress && (
                  <div className="h-full rounded-full bg-[hsl(42,72%,52%)] transition-all" style={{ width: `${uploadProgress.percentage}%` }} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-[hsla(32,24%,24%,0.42)]" style={{ height: 560 }}>
        <EncounterMapEditor campaignId={campaignId} encounter={encounter} />
      </div>
    </div>
  );
}

function ParticipantDetail({
  subject,
  encounter,
  characters,
  participantCount,
  conditionOptions,
  onSaveInitiative,
  conditionDraft,
  onConditionDraftChange,
  onAddCondition,
  onRemoveCondition,
  onSaveNotes,
  onSaveParticipantField,
  onRemoveParticipant,
}: {
  subject: DetailSubject | null;
  encounter: { difficulty: EncounterDifficulty; estimatedXP: number; notes: string; tactics?: string; terrain?: string; } | null;
  characters: Character[];
  participantCount: number;
  conditionOptions: ConditionDef[];
  onSaveInitiative: (value: string) => void;
  conditionDraft: string;
  onConditionDraftChange: (value: string) => void;
  onAddCondition: () => void;
  onRemoveCondition: (condition: string) => void;
  onSaveNotes: (value: string) => void;
  onSaveParticipantField: (field: 'name' | 'hpMax' | 'ac', value: string) => void;
  onRemoveParticipant: (participantId: string) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  const subjectId = subject?.kind === 'participant' ? subject.participant.id : subject?.kind === 'player' ? subject.character._id : null;
  useEffect(() => {
    setFlipped(false);
  }, [subjectId]);

  if (!subject) {
    const partyLevelTotal = characters.reduce((sum, c) => sum + c.level, 0);
    const averagePartyLevel = characters.length ? (partyLevelTotal / characters.length).toFixed(1) : '—';
    const totalPartyHp = characters.reduce((sum, c) => sum + (c.hp.max ?? 0), 0);

    return renderOverview(averagePartyLevel, totalPartyHp);
  }

  const stats = getDetailStats(subject);
  const conditions = getDetailConditions(subject);
  const notes = getDetailNotes(subject);
  const attacks = getDetailAttacks(subject);
  const traits = getDetailTraits(subject);
  const isEncounterParticipant = subject.kind === 'participant';
  const participant = subject.kind === 'participant' ? subject.participant : null;

  return (
    <div>
      {renderDetailHeader()}
      <div style={{ perspective: '1200px' }}>
        <div
          className="grid transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          {renderStatsFace()}
          {renderLoreFace()}
        </div>
      </div>
    </div>
  );

  function renderOverview(averagePartyLevel: string, totalPartyHp: number) {
    return (
      <div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Encounter Overview</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
            Select a participant to adjust stats. Until then, use this to judge whether the scene is ready for the party.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <StatTile icon={Users} label="Party Size" value={String(characters.length)} />
            <StatTile icon={Sparkles} label="Avg Level" value={String(averagePartyLevel)} />
            <StatTile icon={Heart} label="Party HP" value={String(totalPartyHp || '—')} />
            <StatTile icon={Swords} label="Participants" value={String(participantCount)} />
          </div>
        </div>

        <div className="mt-4 border-t border-[hsla(32,24%,24%,0.36)] pt-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Party Rating</p>
          <div className="mt-3 divide-y divide-[hsla(32,24%,24%,0.36)] text-[13px] text-[hsl(35,24%,88%)]">
            <div className="pb-3">
              <p className="text-[13px] text-[hsl(35,24%,88%)]">
                {encounter ? startCase(encounter.difficulty) : 'Draft'} encounter
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
                {encounter?.estimatedXP
                  ? `${encounter.estimatedXP} XP budget currently set for this scene.`
                  : 'No XP budget has been set yet for this encounter.'}
              </p>
            </div>
            <div className="pt-3">
              <p className="text-[13px] text-[hsl(35,24%,88%)]">Read at a glance</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
                {characters.length
                  ? `Built for ${characters.length} player${characters.length === 1 ? '' : 's'} around level ${averagePartyLevel}.`
                  : 'No party characters were found for this campaign yet.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-[hsla(32,24%,24%,0.36)] pt-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">GM Prep Notes</p>
          <div className="mt-3 space-y-3 text-[13px] leading-7 text-[hsl(35,24%,88%)]">
            <p className="text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">{encounter?.notes?.trim() || 'No encounter notes yet.'}</p>
            {encounter?.tactics && (
              <p className="text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
                <span className="text-[hsl(35,24%,88%)]">Tactics:</span> {encounter.tactics}
              </p>
            )}
            {encounter?.terrain && (
              <p className="text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
                <span className="text-[hsl(35,24%,88%)]">Terrain:</span> {encounter.terrain}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-[hsla(32,24%,24%,0.36)] pt-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Next Step</p>
          <p className="mt-2 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
            Add enemies, NPCs, or companions from the right panel, then click a participant in the roster to tune HP, AC, initiative bonus, or conditions.
          </p>
        </div>
      </div>
    );
  }

  function renderDetailHeader() {
    return (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Participant Detail</p>
          <p className="mt-1 font-['Cinzel'] text-[14px] text-[hsl(38,36%,82%)]">{stats.name}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <DetailBadge>{stats.typeLabel}</DetailBadge>
            <DetailBadge>{stats.sourceLabel}</DetailBadge>
            {stats.cr && <DetailBadge>CR {stats.cr}</DetailBadge>}
            {stats.size && <DetailBadge>{startCase(stats.size)}</DetailBadge>}
            {stats.speed && <DetailBadge>{stats.speed}</DetailBadge>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="inline-flex items-center gap-2 rounded-full border border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,12%,0.74)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(30,12%,64%)] transition hover:border-[hsla(32,36%,36%,0.5)] hover:text-[hsl(35,20%,78%)]"
          >
            {flipped ? 'Stats' : 'Lore'}
          </button>
          {isEncounterParticipant && (
            <button
              type="button"
              onClick={() => onRemoveParticipant(participant!.id)}
              className="inline-flex items-center gap-2 rounded-full border border-[hsla(2,52%,42%,0.34)] bg-[hsla(2,42%,12%,0.54)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(2,62%,78%)]"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderEditPanel() {
    return (
      <div className="space-y-4">
        {isEncounterParticipant && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Edit Stats</p>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">Name</label>
              <input
                key={`name-${participant!.id}`}
                defaultValue={participant!.name}
                onBlur={(e) => onSaveParticipantField('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">Max HP</label>
                <input key={`maxhp-${participant!.id}`} defaultValue={participant!.hpMax ?? ''} onBlur={(e) => onSaveParticipantField('hpMax', e.target.value)} className={numberInputClass} inputMode="numeric" />
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">AC</label>
                <input key={`ac-${participant!.id}`} defaultValue={participant!.ac ?? ''} onBlur={(e) => onSaveParticipantField('ac', e.target.value)} className={numberInputClass} inputMode="numeric" />
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">Init</label>
                <input key={`init-${participant!.id}`} defaultValue={participant!.initiativeBonus ?? ''} onBlur={(e) => onSaveInitiative(e.target.value)} className={numberInputClass} inputMode="numeric" />
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Starting Conditions</p>
          <div className="mt-3 flex gap-2">
            <select value={conditionDraft} onChange={(e) => onConditionDraftChange(e.target.value)} className={inputClass}>
              <option value="">Choose condition</option>
              {conditionOptions.map((c) => (
                <option key={c.key} value={c.label}>{c.label}</option>
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
                className="rounded-full border border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,11%,0.98)] px-3 py-1.5 text-xs text-[hsl(35,24%,88%)]"
              >
                {condition}
              </button>
            )) : (
              <p className="text-sm text-[hsl(30,14%,56%)]">No active conditions.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderStatsFace() {
    return (
      <div className="col-start-1 row-start-1 [backface-visibility:hidden]">
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <StatTile icon={Heart} label="HP" value={formatHp(stats.hpCurrent, stats.hpMax)} />
          <StatTile icon={Shield} label="AC" value={stats.ac ? String(stats.ac) : '—'} />
          <StatTile icon={Sparkles} label="Init Bonus" value={stats.initiative ?? '—'} />
          <StatTile icon={ScrollText} label="Conditions" value={String(conditions.length)} />
        </div>
        <div className="mt-4 grid gap-4 border-t border-[hsla(32,24%,24%,0.36)] pt-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          {renderEditPanel()}
          {renderCombatPanel()}
        </div>
      </div>
    );
  }

  function renderCombatPanel() {
    const character = subject!.kind === 'player' ? subject!.character : null;
    return (
      <div className="space-y-4">
        {character && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Passive Scores</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Perception', value: character.passiveScores.perception },
                { label: 'Insight', value: character.passiveScores.insight },
                { label: 'Investigation', value: character.passiveScores.investigation },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] px-2 py-2 text-center">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{label}</p>
                  <p className="mt-1 font-['Cinzel'] text-[15px] leading-none text-[hsl(35,24%,92%)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {stats.abilities && Object.keys(stats.abilities).length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Ability Scores</p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {Object.entries(stats.abilities).map(([key, score]) => (
                <div key={key} className="rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] px-2 py-2 text-center">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{key.slice(0, 3)}</p>
                  <p className="mt-1 font-['Cinzel'] text-[15px] leading-none text-[hsl(35,24%,92%)]">{score}</p>
                  <p className="mt-0.5 text-[10px] text-[hsl(30,12%,58%)]">{abilityMod(score)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {attacks.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Attacks</p>
            <div className="mt-3 divide-y divide-[hsla(32,24%,24%,0.36)]">
              {attacks.map((attack) => (
                <div key={attack.name} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-[Cinzel] text-[14px] text-[hsl(35,24%,92%)]">{attack.name}</p>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      {attack.actionCost && <DetailBadge>{startCase(attack.actionCost)}</DetailBadge>}
                      {(attack.bonus != null || attack.damage) && (
                        <span className="text-xs text-[hsl(30,14%,58%)]">
                          {attack.bonus != null ? `${attack.bonus >= 0 ? '+' : ''}${attack.bonus}` : '—'}
                          {attack.damage ? ` · ${attack.damage}` : ''}
                          {attack.range ? ` · ${attack.range}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {attack.notes && <p className="mt-2 text-[11px] leading-relaxed text-[hsl(30,14%,58%)]">{attack.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderLoreFace() {
    const isPlayer = subject!.kind === 'player';
    const character = subject!.kind === 'player' ? subject!.character : null;

    return (
      <div className="col-start-1 row-start-1 [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <div className="mt-4 space-y-5">
          {/* Traits / flavor (participants) */}
          {traits.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Traits & Abilities</p>
              <div className="mt-3 divide-y divide-[hsla(32,24%,24%,0.36)]">
                {traits.map((trait) => (
                  <div key={trait.name} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-[Cinzel] text-[14px] text-[hsl(35,24%,92%)]">{trait.name}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-[hsl(30,14%,58%)]">{trait.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PC: backstory */}
          {isPlayer && character && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Backstory</p>
              <p className="mt-2 text-[13px] leading-7 text-[hsl(35,24%,82%)]">
                {character.backstory?.trim() || <span className="text-[hsl(30,12%,52%)]">No backstory recorded.</span>}
              </p>
            </div>
          )}

          {/* Participant: description/notes */}
          {!isPlayer && notes && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Description</p>
              <p className="mt-2 text-[13px] leading-7 text-[hsl(35,24%,82%)]">{notes}</p>
            </div>
          )}

          {/* DM Notes textarea (participants only) */}
          {isEncounterParticipant && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">DM Notes</p>
              <textarea
                key={`notes-${participant!.id}`}
                defaultValue={participant!.notes ?? ''}
                onBlur={(e) => onSaveNotes(e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(212,42%,58%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)] min-h-[120px] resize-y"
                placeholder="Encounter-specific notes, tactics, reminders…"
              />
            </div>
          )}

          {/* Empty state when no lore */}
          {traits.length === 0 && !notes && !isPlayer && !isEncounterParticipant && (
            <p className="text-[12px] text-[hsl(30,12%,52%)]">No lore recorded for this entity.</p>
          )}
        </div>
      </div>
    );
  }
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
  const enemies = enemyTemplates.filter((t) => matchesQuery([t.name, t.category, t.source, t.tags.join(' ')], lowered));
  const npcs = npcEntities.filter((e) => matchesQuery([e.name, e.description, e.tags.join(' ')], lowered));
  const companions = allies.filter((a) => matchesQuery([a.name, a.role, a.kind, a.description], lowered));

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 px-4">
      <div className={`${shellPanelClass} w-full max-w-3xl overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Add Participant</p>
            <p className="mt-1 font-['Cinzel'] text-[14px] text-[hsl(38,36%,82%)]">{startCase(type)}</p>
          </div>
          <button type="button" onClick={onClose} className={actionButtonClass()}>
            Close
          </button>
        </div>
        <div className="p-5">
          <input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder={`Search ${type}s…`} className={inputClass} />
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {type === 'enemy' && (
              <PickerList
                items={enemies}
                getKey={(item) => item._id}
                renderItem={(item) => (
                  <button key={item._id} type="button" onClick={() => onPickEnemy(item)} className={pickerRowClass()}>
                    <div>
                      <p className="font-[Cinzel] text-[14px] text-[hsl(35,24%,92%)]">{item.name}</p>
                      <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{item.category} · AC {item.ac} · HP {item.hp.average}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(30,12%,58%)]" />
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
                      <p className="font-[Cinzel] text-[14px] text-[hsl(35,24%,92%)]">{item.name}</p>
                      <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{item.type === 'npc_minor' ? 'Minor NPC' : 'NPC'}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(30,12%,58%)]" />
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
                      <p className="font-[Cinzel] text-[14px] text-[hsl(35,24%,92%)]">{item.name}</p>
                      <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">{item.role || item.kind}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(30,12%,58%)]" />
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

function StatTile({ icon: Icon, label, value }: { icon: typeof Heart; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] px-4 py-3">
      <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-1.5 font-['Cinzel'] text-[18px] leading-none text-[hsl(35,24%,92%)]">{value}</p>
    </div>
  );
}

function DetailBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[hsla(38,60%,52%,0.28)] bg-[hsla(38,70%,46%,0.12)] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[hsl(38,82%,63%)]">
      {children}
    </span>
  );
}

function TabStrip({
  active,
  onSelect,
  statBlockLabel,
  onCloseStatBlock,
}: {
  active: 'notes' | 'map' | 'stat-block';
  onSelect: (tab: 'notes' | 'map' | 'stat-block') => void;
  statBlockLabel?: string;
  onCloseStatBlock?: () => void;
}) {
  const tabs: Array<{ id: 'notes' | 'map' | 'stat-block'; label: string }> = [
    { id: 'notes', label: 'Prep Notes' },
    { id: 'map', label: 'Battlemap' },
    { id: 'stat-block', label: statBlockLabel ?? 'Stat Block' },
  ];
  return (
    <div className="flex items-end gap-0.5 px-4 pb-0">
      {tabs.map((tab) => (
        <div key={tab.id} className="relative flex items-end">
          <button
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`max-w-[140px] truncate rounded-t-lg border border-b-0 px-4 py-2 text-[10px] uppercase tracking-[0.14em] transition ${
              active === tab.id
                ? 'border-[hsla(32,24%,24%,0.42)] bg-[hsla(26,20%,12%,0.96)] text-[hsl(38,36%,82%)]'
                : 'border-transparent text-[hsl(30,12%,52%)] hover:text-[hsl(35,20%,72%)]'
            } ${tab.id === 'stat-block' && onCloseStatBlock ? 'pr-7' : ''}`}
          >
            {tab.label}
          </button>
          {tab.id === 'stat-block' && onCloseStatBlock && (
            <button
              type="button"
              onClick={onCloseStatBlock}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded text-[hsl(30,12%,52%)] hover:text-[hsl(35,20%,72%)]"
              aria-label="Close stat block"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Pure helpers ──────────────────────────────────────────────

function actionButtonClass(accent = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
    accent
      ? 'border-[hsla(42,72%,52%,0.34)] bg-[hsla(42,72%,42%,0.16)] text-[hsl(42,82%,78%)] hover:bg-[hsla(42,72%,42%,0.22)]'
      : 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)] hover:bg-[hsla(220,18%,16%,0.9)]'
  }`;
}

function pickerRowClass() {
  return 'flex w-full items-center justify-between rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] px-4 py-3 text-left transition hover:border-[hsla(38,50%,58%,0.4)] hover:bg-[linear-gradient(180deg,hsla(26,20%,16%,0.98),hsla(24,16%,12%,1))]';
}

function getDetailStats(subject: DetailSubject) {
  if (subject.kind === 'player') {
    return {
      name: subject.character.name,
      typeLabel: 'Player',
      sourceLabel: formatCharacterClass(subject.character) || 'Campaign character',
      hpCurrent: subject.character.hp.current,
      hpMax: subject.character.hp.max,
      ac: subject.character.ac,
      initiative: String(subject.character.initiativeBonus),
      speed: subject.character.speed ? `${subject.character.speed} ft` : undefined,
      cr: undefined as string | undefined,
      size: undefined as string | undefined,
      abilities: subject.character.stats,
    };
  }
  return {
    name: subject.participant.name,
    typeLabel: startCase(subject.participant.entityType),
    sourceLabel: subject.participant.sourceLabel ?? 'Encounter participant',
    hpCurrent: subject.participant.hpCurrent,
    hpMax: subject.participant.hpMax,
    ac: subject.participant.ac,
    initiative: String(subject.participant.initiativeBonus ?? '—'),
    speed: subject.participant.speed,
    cr: subject.participant.cr,
    size: subject.participant.size,
    abilities: subject.participant.abilities,
  };
}

function getDetailConditions(subject: DetailSubject) {
  if (subject.kind === 'player') return subject.character.conditions;
  return subject.participant.conditions;
}

function getDetailNotes(subject: DetailSubject) {
  if (subject.kind === 'player') return subject.character.backstory ?? '';
  return subject.participant.notes ?? '';
}

function getDetailAttacks(subject: DetailSubject): EncounterParticipantAttack[] {
  if (subject.kind === 'participant') return subject.participant.attacks ?? [];
  return [];
}

function getDetailTraits(subject: DetailSubject): EncounterParticipantTrait[] {
  if (subject.kind === 'participant') return subject.participant.traits ?? [];
  return [];
}

function matchesQuery(values: Array<string | undefined>, query: string) {
  if (!query) return true;
  return values.some((v) => v?.toLowerCase().includes(query));
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
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function abilityMod(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
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
