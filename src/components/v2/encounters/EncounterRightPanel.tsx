import { useMemo } from 'react';
import {
  ChevronRight,
  Copy,
  Loader2,
  MapPin,
  Plus,
  ScrollText,
  Sparkles,
  Swords,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCharacters } from '@/hooks/useCharacters';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { shellPanelClass } from '@/lib/panel-styles';
import { formatCharacterClass } from '@/lib/character-utils';
import type { Character } from '@/types/campaign';
import type { EncounterParticipant, LoadEncounterRequest } from '@/types/encounter';
import { useWorldExplorerContext } from '../world/useWorldExplorerContext';
import { useEncounterPrepContext } from './EncounterPrepContext';

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(212,42%,58%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

interface EncounterRightPanelProps {
  campaignId: string;
  onTabChange?: (tab: string) => void;
}

export function EncounterRightPanel({ campaignId, onTabChange }: EncounterRightPanelProps) {
  const {
    selectedEncounterId,
    setSelectedEncounterId,
    encounters,
    encounter,
    showLoadOptions,
    setShowLoadOptions,
    loadOptions,
    setLoadOptions,
    hasLoadedMap,
    openParticipantPicker,
    duplicateEncounter,
    deleteSelectedEncounter,
    openLoadOptions,
    handleLoadToSession,
    cycleStatus,
    createBlankEncounter,
    updateEncounterPatch,
    selectedKey,
    setSelectedKey,
    removeParticipant,
    isCreatePending,
    isDeletePending,
    isLoadPending,
  } = useEncounterPrepContext();

  const { data: characters } = useCharacters(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const { requestSessionNavigation } = useWorldExplorerContext();

  const playerCount = characters?.length ?? 0;

  const linkedSession = useMemo(
    () => (sessions ?? []).find((s) => s._id === encounter?.sessionId) ?? null,
    [sessions, encounter?.sessionId],
  );

  const linkedLocation = useMemo(
    () => (worldEntities ?? []).find((e) => e._id === encounter?.locationEntityId) ?? null,
    [worldEntities, encounter?.locationEntityId],
  );

  const enemyCount = (encounter?.participants ?? []).filter((p) => p.entityType === 'enemy').length;
  const npcCount = (encounter?.participants ?? []).filter((p) => p.entityType === 'npc').length;
  const companionCount = (encounter?.participants ?? []).filter((p) => p.entityType === 'companion').length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {renderSelector()}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-4">
          {encounter ? renderEncounterContent() : renderEmptyState()}
        </div>
      </div>
      {showLoadOptions && encounter && renderLoadModal()}
    </div>
  );

  function renderSelector() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,26%,26%,0.4)] px-3 py-3">
        <div className="flex items-center gap-2">
          <select
            value={selectedEncounterId ?? ''}
            onChange={(e) => setSelectedEncounterId(e.target.value || null)}
            className={inputClass}
          >
            <option value="">
              {encounters.length ? 'Select encounter…' : 'No encounters yet'}
            </option>
            {encounters.map((enc) => (
              <option key={enc._id} value={enc._id}>
                {enc.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={createBlankEncounter}
            disabled={isCreatePending}
            className="flex shrink-0 items-center gap-1 rounded-full border border-[hsla(212,42%,42%,0.42)] bg-[hsla(212,32%,18%,0.64)] px-3 py-2 text-[11px] text-[hsl(212,34%,74%)] transition hover:border-[hsla(212,42%,52%,0.5)] hover:text-[hsl(212,34%,84%)] disabled:opacity-50"
          >
            {isCreatePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            New
          </button>
        </div>
      </div>
    );
  }

  function renderEncounterContent() {
    if (!encounter) return null;
    return (
      <>
        {renderNameStatus()}
        {renderRoster()}
        {renderAddActions()}
        {renderManageActions()}
        {renderMeta()}
      </>
    );
  }

  function renderNameStatus() {
    if (!encounter) return null;

    const statusColors: Record<string, string> = {
      ready: 'border-[hsla(145,52%,42%,0.4)] bg-[hsla(145,52%,28%,0.16)] text-[hsl(145,62%,62%)]',
      used: 'border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,11%,0.98)] text-[hsl(30,12%,52%)]',
      draft: 'border-[hsla(212,24%,28%,0.34)] bg-[hsla(220,18%,12%,0.74)] text-[hsl(212,34%,74%)]',
    };
    const statusColor = statusColors[encounter.status] ?? statusColors.draft;

    return (
      <section className="space-y-2">
        <input
          key={encounter._id}
          defaultValue={encounter.name}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== encounter.name) updateEncounterPatch({ name: v });
          }}
          className={inputClass}
          placeholder="Encounter name"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cycleStatus}
            title="Click to cycle status"
            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] transition cursor-pointer ${statusColor}`}
          >
            {encounter.status}
          </button>
          <span className="text-[11px] text-[hsl(30,12%,52%)]">
            {encounters.length} encounter{encounters.length === 1 ? '' : 's'}
          </span>
        </div>
      </section>
    );
  }

  function renderRoster() {
    if (!encounter) return null;
    return (
      <section className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(38,36%,72%)]">Roster</p>
        <PrepRoster
          characters={characters ?? []}
          participants={encounter.participants ?? []}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onRemove={removeParticipant}
        />
      </section>
    );
  }

  function renderAddActions() {
    return (
      <section className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(38,36%,72%)]">Add to Roster</p>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => openParticipantPicker('enemy')}
            className="flex w-full items-center gap-2 rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,12%,0.74)] px-3 py-2.5 text-[12px] text-[hsl(35,24%,82%)] transition hover:border-[hsla(0,52%,52%,0.3)] hover:text-[hsl(35,24%,92%)]"
          >
            <Swords className="h-3.5 w-3.5 text-[hsl(2,52%,62%)]" />
            Add Enemy
          </button>
          <button
            type="button"
            onClick={() => openParticipantPicker('npc')}
            className="flex w-full items-center gap-2 rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,12%,0.74)] px-3 py-2.5 text-[12px] text-[hsl(35,24%,82%)] transition hover:border-[hsla(38,50%,48%,0.3)] hover:text-[hsl(35,24%,92%)]"
          >
            <Users className="h-3.5 w-3.5 text-[hsl(38,72%,62%)]" />
            Add NPC
          </button>
          <button
            type="button"
            onClick={() => openParticipantPicker('companion')}
            className="flex w-full items-center gap-2 rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,12%,0.74)] px-3 py-2.5 text-[12px] text-[hsl(35,24%,82%)] transition hover:border-[hsla(145,38%,38%,0.3)] hover:text-[hsl(35,24%,92%)]"
          >
            <Users className="h-3.5 w-3.5 text-[hsl(145,52%,52%)]" />
            Add Companion
          </button>
        </div>
      </section>
    );
  }

  function renderManageActions() {
    return (
      <section className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(38,36%,72%)]">Manage</p>
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={duplicateEncounter}
              disabled={isCreatePending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[hsla(32,26%,26%,0.45)] bg-[hsla(24,14%,12%,0.74)] px-3 py-2 text-[11px] text-[hsl(30,12%,64%)] transition hover:border-[hsla(32,36%,36%,0.5)] hover:text-[hsl(35,20%,78%)] disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={deleteSelectedEncounter}
              disabled={isDeletePending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[hsla(0,32%,28%,0.36)] bg-[hsla(0,16%,12%,0.74)] px-3 py-2 text-[11px] text-[hsl(2,42%,58%)] transition hover:border-[hsla(0,42%,38%,0.5)] hover:text-[hsl(2,52%,68%)] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
          <button
            type="button"
            onClick={openLoadOptions}
            disabled={isLoadPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsla(38,60%,52%,0.34)] bg-[hsla(38,70%,46%,0.08)] px-3 py-3 text-[12px] font-medium text-[hsl(38,72%,72%)] transition hover:border-[hsla(38,60%,52%,0.5)] hover:bg-[hsla(38,70%,46%,0.14)] hover:text-[hsl(38,82%,80%)] disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isLoadPending ? 'Loading…' : 'Load to Session'}
          </button>
        </div>
      </section>
    );
  }

  function renderMeta() {
    if (!encounter) return null;

    const xpPerPlayer =
      encounter.estimatedXP > 0 && playerCount > 0
        ? Math.round(encounter.estimatedXP / playerCount).toLocaleString()
        : null;

    const participantSummary = [
      enemyCount > 0 && `${enemyCount} enem${enemyCount === 1 ? 'y' : 'ies'}`,
      npcCount > 0 && `${npcCount} NPC${npcCount === 1 ? '' : 's'}`,
      companionCount > 0 && `${companionCount} companion${companionCount === 1 ? '' : 's'}`,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <section className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(38,36%,72%)]">Context</p>
        <div className="space-y-1 rounded-xl border border-[hsla(32,24%,30%,0.24)] bg-[hsla(24,16%,12%,0.74)] px-3 py-2">
          {renderMetaRow('Difficulty', capitalize(encounter.difficulty))}
          {encounter.estimatedXP > 0 && renderMetaRow(
            'Est. XP',
            xpPerPlayer
              ? `${encounter.estimatedXP.toLocaleString()} (~${xpPerPlayer}/player)`
              : encounter.estimatedXP.toLocaleString(),
          )}
          {participantSummary && renderMetaRow('Participants', `${participantSummary} + ${playerCount}p`)}
          {linkedSession && renderSessionLink()}
          {linkedLocation && renderMetaIconRow(MapPin, linkedLocation.name)}
        </div>
      </section>
    );
  }

  function renderMetaRow(label: string, value: string) {
    return (
      <div className="flex items-baseline justify-between gap-2 py-0.5">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[hsl(30,12%,50%)]">{label}</span>
        <span className="text-right text-[11px] text-[hsl(35,20%,78%)]">{value}</span>
      </div>
    );
  }

  function renderMetaIconRow(Icon: typeof MapPin, text: string) {
    return (
      <div className="flex items-center gap-1.5 py-0.5">
        <Icon className="h-3 w-3 shrink-0 text-[hsl(30,12%,50%)]" />
        <span className="truncate text-[11px] text-[hsl(35,20%,78%)]">{text}</span>
      </div>
    );
  }

  function renderSessionLink() {
    if (!linkedSession) return null;
    const sessionLabel = linkedSession.title ?? `Session ${linkedSession.sessionNumber}`;

    function handleClick() {
      requestSessionNavigation(linkedSession!._id);
      onTabChange?.('sessions');
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-1.5 py-0.5 text-left transition hover:opacity-80"
      >
        <ScrollText className="h-3 w-3 shrink-0 text-[hsl(30,12%,50%)]" />
        <span className="truncate text-[11px] text-[hsl(205,80%,72%)] underline decoration-[hsla(205,80%,72%,0.3)] underline-offset-2">
          {sessionLabel}
        </span>
      </button>
    );
  }

  function renderEmptyState() {
    return (
      <section className="rounded-xl border border-dashed border-[hsla(32,24%,28%,0.34)] px-4 py-5 text-center">
        <p className="text-[12px] text-[hsl(35,24%,88%)]">No encounter selected</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,12%,58%)]">
          Select an encounter above or create a new one to manage it here.
        </p>
      </section>
    );
  }

  function renderLoadModal() {
    if (!encounter) return null;
    return (
      <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/55 px-3 py-6">
        <div className={`${shellPanelClass} w-full overflow-hidden`}>
          {renderLoadModalHeader()}
          {renderLoadModalOptions()}
          {renderLoadModalFooter()}
        </div>
      </div>
    );
  }

  function renderLoadModalHeader() {
    if (!encounter) return null;
    return (
      <div className="border-b border-[hsla(32,24%,24%,0.42)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Load Encounter</p>
        <p className="mt-1 font-['Cinzel'] text-[13px] text-[hsl(38,36%,82%)]">{encounter.name}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
          Choose how this encounter arrives in the live session.
        </p>
      </div>
    );
  }

  function renderLoadModalOptions() {
    return (
      <div className="space-y-2.5 px-4 py-4 text-sm text-[hsl(38,26%,86%)]">
        <ToggleRow checked={loadOptions.addToInitiative ?? true} label="Add to initiative" onChange={(v) => setLoadOptions((p) => ({ ...p, addToInitiative: v }))} />
        <ToggleRow checked={loadOptions.clearExisting ?? true} label="Clear existing initiative first" onChange={(v) => setLoadOptions((p) => ({ ...p, clearExisting: v }))} />
        <ToggleRow checked={loadOptions.clearExistingMap ?? true} label="Clear existing map first" onChange={(v) => setLoadOptions((p) => ({ ...p, clearExistingMap: v }))} />
        <ToggleRow checked={hasLoadedMap ? loadOptions.spawnTokens ?? false : false} label={`Spawn tokens on map${hasLoadedMap ? '' : ' (map not active)'}`} disabled={!hasLoadedMap} onChange={(v) => setLoadOptions((p) => ({ ...p, spawnTokens: v }))} />
        <ToggleRow checked={loadOptions.autoRollInitiative ?? true} label="Auto-roll non-player initiative" disabled={!(loadOptions.addToInitiative ?? true)} onChange={(v) => setLoadOptions((p) => ({ ...p, autoRollInitiative: v }))} />
        <ToggleRow checked={loadOptions.startCombat ?? false} label="Start combat immediately" disabled={!(loadOptions.addToInitiative ?? true)} onChange={(v) => setLoadOptions((p) => ({ ...p, startCombat: v }))} />
      </div>
    );
  }

  function renderLoadModalFooter() {
    return (
      <div className="flex justify-end gap-2 border-t border-[hsla(32,24%,24%,0.42)] px-4 py-3">
        <button
          type="button"
          onClick={() => setShowLoadOptions(false)}
          disabled={isLoadPending}
          className="rounded-full border border-[hsla(32,26%,26%,0.45)] px-3 py-1.5 text-[11px] text-[hsl(30,12%,64%)] transition hover:border-[hsla(32,36%,36%,0.5)] hover:text-[hsl(35,20%,78%)] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleLoadToSession}
          disabled={isLoadPending}
          className="rounded-full border border-[hsla(38,60%,52%,0.34)] bg-[hsla(38,70%,46%,0.08)] px-3 py-1.5 text-[11px] text-[hsl(38,72%,72%)] transition hover:border-[hsla(38,60%,52%,0.5)] hover:text-[hsl(38,82%,80%)] disabled:opacity-50"
        >
          {isLoadPending ? 'Loading…' : 'Load Encounter'}
        </button>
      </div>
    );
  }
}

// ── Roster components ─────────────────────────────────────────

function PrepRoster({
  characters,
  participants,
  selectedKey,
  onSelect,
  onRemove,
}: {
  characters: Character[];
  participants: EncounterParticipant[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onRemove: (participantId: string) => void;
}) {
  const groups = [
    { label: 'Players', removable: false, rows: characters.map((c) => { const cls = formatCharacterClass(c); return { key: `player:${c._id}`, name: c.name, subtitle: cls ? `${cls}` : `Level ${c.level}`, hpCurrent: c.hp.current, hpMax: c.hp.max, ac: c.ac, conditions: c.conditions }; }) },
    { label: 'Companions', removable: true, rows: participants.filter((p) => p.entityType === 'companion').map(toParticipantRow) },
    { label: 'NPCs', removable: true, rows: participants.filter((p) => p.entityType === 'npc').map(toParticipantRow) },
    { label: 'Enemies', removable: true, rows: participants.filter((p) => p.entityType === 'enemy').map(toParticipantRow) },
  ];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,52%)]">{group.label}</p>
          <div className="mt-1.5 space-y-1.5">
            {group.rows.length ? group.rows.map((row) => (
              <div key={row.key} className="group/row relative">
                <button
                  type="button"
                  onClick={() => onSelect(row.key)}
                  className={`group w-full rounded-xl border px-3 py-2.5 text-left transition ${
                    selectedKey === row.key
                      ? 'border-[hsla(38,72%,60%,0.42)] bg-[hsla(38,36%,18%,0.32)]'
                      : 'border-[hsla(32,26%,26%,0.45)] bg-[linear-gradient(180deg,hsla(26,16%,15%,0.96),hsla(24,14%,11%,0.98))] hover:border-[hsla(38,50%,58%,0.4)] hover:bg-[linear-gradient(180deg,hsla(26,20%,16%,0.98),hsla(24,16%,12%,1))]'
                  }`}
                >
                  <RosterRow row={row} />
                </button>
                {group.removable && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(row.key.replace('participant:', '')); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 transition-opacity hover:bg-[hsla(2,42%,18%,0.54)] group-hover/row:opacity-100"
                    title="Remove from encounter"
                  >
                    <X className="h-3.5 w-3.5 text-[hsl(2,52%,62%)]" />
                  </button>
                )}
              </div>
            )) : (
              <p className="rounded-xl border border-[hsla(32,26%,26%,0.45)] px-3 py-2.5 text-[11px] text-[hsl(30,12%,52%)]">
                No {group.label.toLowerCase()} yet.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RosterRow({ row }: { row: { key: string; name: string; subtitle: string; hpCurrent?: number; hpMax?: number; ac?: number; cr?: string; conditions: string[] } }) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[12px] font-medium text-[hsl(35,24%,92%)]">{row.name}</p>
          <span className="shrink-0 text-[10px] text-[hsl(30,12%,58%)]">{formatHp(row.hpCurrent, row.hpMax)}</span>
        </div>
        <p className="text-[10px] text-[hsl(30,12%,58%)]">{row.subtitle}</p>
        <RosterFooter row={row} />
      </div>
      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,52%)] opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function RosterFooter({ row }: { row: { hpCurrent?: number; hpMax?: number; ac?: number; cr?: string; conditions: string[] } }) {
  const hpPct = row.hpMax && row.hpMax > 0 ? Math.min(1, Math.max(0, (row.hpCurrent ?? row.hpMax) / row.hpMax)) : null;
  const hpColor = hpPct == null ? 'bg-[hsl(30,12%,44%)]'
    : hpPct > 0.5 ? 'bg-[hsl(145,52%,42%)]'
    : hpPct > 0.25 ? 'bg-[hsl(38,72%,52%)]'
    : 'bg-[hsl(2,62%,52%)]';

  if (hpPct == null && !row.cr && row.ac == null && row.conditions.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1.5">
      {hpPct != null && (
        <div className="h-1 overflow-hidden rounded-full bg-[hsla(32,24%,20%,0.8)]">
          <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct * 100}%` }} />
        </div>
      )}
      {(row.cr != null || row.ac != null || row.conditions.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[hsl(30,12%,58%)]">
          {row.cr != null && <span className="font-[Cinzel] text-[hsl(38,70%,58%)]">CR {row.cr}</span>}
          {row.ac != null && <span>AC {row.ac}</span>}
          {row.conditions.slice(0, 2).map((c) => (
            <span key={c} className="rounded-full border border-[hsla(32,26%,26%,0.45)] px-1.5 py-0.5">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function toParticipantRow(p: EncounterParticipant) {
  return {
    key: `participant:${p.id}`,
    name: p.name,
    subtitle: p.sourceLabel ?? startCase(p.entityType),
    hpCurrent: p.hpCurrent,
    hpMax: p.hpMax,
    ac: p.ac,
    cr: p.cr,
    conditions: p.conditions,
  };
}

function formatHp(current?: number, max?: number) {
  if (current == null && max == null) return '—';
  if (max == null) return String(current);
  return `${current ?? max}/${max}`;
}

function startCase(value: string) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
    <label className={`flex items-center gap-2.5 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-[hsl(38,72%,52%)]"
      />
      <span className="text-[12px] text-[hsl(35,20%,78%)]">{label}</span>
    </label>
  );
}

// Re-export type needed by context consumers
export type { LoadEncounterRequest };
