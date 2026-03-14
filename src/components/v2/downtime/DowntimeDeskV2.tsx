import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Coffee,
  Loader2,
  Plus,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAllies } from '@/hooks/useAllies';
import { useAdvanceDate, useCampaign } from '@/hooks/useCampaigns';
import {
  useAdvanceDowntime,
  useCreateDowntime,
  useDeleteDowntime,
  useDowntimeActivities,
  useUpdateDowntime,
} from '@/hooks/useDowntime';
import { useCharacters } from '@/hooks/useCharacters';
import { useRandomTables, useRollTable } from '@/hooks/useRandomTables';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { Ally, Campaign, Character, Session, WorldEntity } from '@/types/campaign';
import type {
  ActivityStatus,
  ActivityType,
  DowntimeActivity,
  DowntimeLinks,
  DowntimeParticipantType,
} from '@/types/downtime';

interface DowntimeDeskV2Props {
  campaignId: string;
}

interface DowntimeEditor {
  participantId: string;
  participantType: DowntimeParticipantType;
  participantName: string;
  name: string;
  type: ActivityType;
  status: ActivityStatus;
  description: string;
  durationDays: string;
  progressDays: string;
  locationId: string;
  notes: string;
  materials: string;
  outcome: string;
  complicationTableId: string;
  links: DowntimeLinks;
}

type WorkspaceMode = 'detail' | 'create';

const shellClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.64)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(22,24%,9%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';
const panelClass =
  'rounded-[22px] border border-[hsla(32,24%,24%,0.46)] bg-[linear-gradient(180deg,hsla(26,22%,11%,0.95)_0%,hsla(20,20%,9%,0.96)_100%)]';
const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(42,72%,52%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const STATUS_META: Record<ActivityStatus, { label: string; tone: string }> = {
  planned: { label: 'Planned', tone: 'text-[hsl(212,24%,72%)]' },
  active: { label: 'Active', tone: 'text-[hsl(42,78%,78%)]' },
  completed: { label: 'Completed', tone: 'text-[hsl(146,44%,72%)]' },
  cancelled: { label: 'Cancelled', tone: 'text-[hsl(8,58%,72%)]' },
};

const TYPE_META: Record<ActivityType, string> = {
  crafting: 'Crafting',
  training: 'Training',
  carousing: 'Carousing',
  research: 'Research',
  working: 'Work',
  recuperating: 'Recovery',
  travel: 'Travel',
  faction_work: 'Faction Work',
  business: 'Business',
  other: 'Custom',
};

export function DowntimeDeskV2({ campaignId }: DowntimeDeskV2Props) {
  const { data: campaign } = useCampaign(campaignId);
  const { data: activities, isLoading, error } = useDowntimeActivities(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const { data: allies } = useAllies(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: allEntities } = useWorldEntities(campaignId);
  const { data: randomTables } = useRandomTables(campaignId);

  const createDowntime = useCreateDowntime();
  const updateDowntime = useUpdateDowntime();
  const deleteDowntime = useDeleteDowntime();
  const advanceDowntime = useAdvanceDowntime();
  const advanceDate = useAdvanceDate();
  const rollTable = useRollTable();

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('detail');
  const [editor, setEditor] = useState<DowntimeEditor>(() => emptyEditor());
  const [advanceDays, setAdvanceDays] = useState('7');

  const data = useMemo(() => activities ?? [], [activities]);
  const selectedActivity = useMemo(
    () => data.find((activity) => activity._id === selectedActivityId) ?? null,
    [data, selectedActivityId],
  );

  useEffect(() => {
    if (workspaceMode !== 'detail') return;
    if (selectedActivityId && data.some((item) => item._id === selectedActivityId)) return;
    setSelectedActivityId(data[0]?._id ?? null);
  }, [data, selectedActivityId, workspaceMode]);

  useEffect(() => {
    if (!selectedActivity) return;
    setEditor(activityToEditor(selectedActivity));
  }, [selectedActivity]);

  const entities = allEntities ?? [];
  const locations = entities.filter((entity) => entity.type === 'location' || entity.type === 'location_detail');
  const npcs = entities.filter((entity) => entity.type === 'npc' || entity.type === 'npc_minor');
  const factions = entities.filter((entity) => entity.type === 'faction');
  const quests = entities.filter((entity) => entity.type === 'quest');
  const complicationTables = (randomTables ?? []).filter((table) => table.sourceType !== 'srd' || table.category.toLowerCase().includes('travel') || table.category.toLowerCase().includes('research') || table.category.toLowerCase().includes('downtime'));

  const participants = useMemo(() => buildParticipants(characters ?? [], allies ?? [], npcs), [characters, allies, npcs]);
  const groupedActivities = useMemo(() => groupActivitiesByParticipant(data), [data]);
  const currentDateLabel = formatCalendarDate(campaign);
  const activeCount = data.filter((activity) => activity.status === 'active').length;
  const daysAvailable = campaign?.calendar ? summarizeAvailableDays(campaign, data) : null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(30,14%,62%)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[hsl(8,58%,72%)]">
        Failed to load downtime activities.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">Downtime</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">Between Adventure Ledger</h2>
            <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">
              {currentDateLabel} · {activeCount > 0 ? `${activeCount} activities underway` : 'No active downtime yet'}
              {daysAvailable ? ` · ${daysAvailable}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HeaderPill label="Current Date" value={currentDateLabel} icon={CalendarDays} />
            <HeaderPill label="Downtime" value={activeCount > 0 ? 'Active' : 'Inactive'} icon={Coffee} />
            <HeaderPill label="Activities" value={`${data.length}`} icon={Clock3} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleStartDowntime} className={actionButtonClass()}>
            <Coffee className="h-4 w-4" />
            Start Downtime
          </button>
          <button type="button" onClick={startCreate} className={actionButtonClass(true)}>
            <Plus className="h-4 w-4" />
            Add Activity
          </button>
          <div className="flex items-center gap-2 rounded-full border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.56)] px-3 py-2">
            <Clock3 className="h-4 w-4 text-[hsl(30,12%,56%)]" />
            <input value={advanceDays} onChange={(event) => setAdvanceDays(event.target.value)} className="w-10 bg-transparent text-sm text-[hsl(38,24%,88%)] outline-none" />
            <button type="button" onClick={handleAdvanceTime} className="text-[11px] uppercase tracking-[0.18em] text-[hsl(42,78%,78%)]">
              Advance Time
            </button>
          </div>
          <button type="button" onClick={handleEndDowntime} className={actionButtonClass()}>
            <ScrollText className="h-4 w-4" />
            End Downtime
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className={`${shellClass} min-h-0 overflow-hidden`}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Downtime Timeline</p>
              <h3 className="mt-2 font-[Cinzel] text-lg text-[hsl(38,34%,88%)]">Participant Ledger</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {groupedActivities.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[hsla(32,24%,24%,0.52)] px-4 py-6 text-sm text-[hsl(30,12%,58%)]">
                  No downtime activities are logged yet. Start a downtime block and assign the first long-form activity.
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedActivities.map((group) => (
                    <div key={group.key} className="rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] p-3">
                      <p className="font-[Cinzel] text-sm text-[hsl(38,32%,86%)]">{group.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{group.participantType}</p>
                      <div className="mt-3 space-y-2">
                        {group.activities.map((activity) => {
                          const progress = computeProgress(activity);
                          return (
                            <button
                              key={activity._id}
                              type="button"
                              onClick={() => {
                                setWorkspaceMode('detail');
                                setSelectedActivityId(activity._id);
                              }}
                              className={`block w-full rounded-[16px] border px-3 py-3 text-left transition ${
                                selectedActivityId === activity._id && workspaceMode === 'detail'
                                  ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
                                  : 'border-[hsla(32,24%,24%,0.32)] bg-[hsla(24,18%,10%,0.58)] hover:border-[hsla(42,72%,52%,0.22)]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm text-[hsl(38,24%,88%)]">{activity.name}</p>
                                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[hsl(30,12%,58%)]">
                                    {TYPE_META[activity.type]}{activity.locationId ? ` · ${findEntityName(locations, activity.locationId) ?? 'Linked location'}` : ''}
                                  </p>
                                </div>
                                <span className={`text-[10px] uppercase tracking-[0.18em] ${STATUS_META[activity.status].tone}`}>
                                  {STATUS_META[activity.status].label}
                                </span>
                              </div>

                              <div className="mt-3">
                                <div className="flex items-center justify-between text-[11px] text-[hsl(30,12%,58%)]">
                                  <span>{progress.label}</span>
                                  <span>{progress.value}%</span>
                                </div>
                                <div className="mt-1 h-2 rounded-full bg-[hsla(32,24%,14%,0.82)]">
                                  <div className="h-2 rounded-full bg-[linear-gradient(90deg,hsla(42,72%,58%,0.88)_0%,hsla(35,72%,48%,0.78)_100%)]" style={{ width: `${progress.value}%` }} />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className={`${shellClass} min-h-0 overflow-hidden`}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Activity Detail</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-['IM_Fell_English'] text-[30px] leading-none text-[hsl(38,42%,90%)]">
                    {workspaceMode === 'create' ? 'Plan New Downtime' : selectedActivity?.name ?? 'Choose an Activity'}
                  </h3>
                  <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">
                    {workspaceMode === 'create'
                      ? 'Assign a participant, define the duration, and connect the work to the wider campaign.'
                      : selectedActivity
                        ? `${selectedActivity.participantName ?? 'Participant'} · ${TYPE_META[selectedActivity.type]}`
                        : 'Select an activity from the downtime timeline or start a new one.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {workspaceMode === 'create' ? (
                <DowntimeEditorPanel
                  editor={editor}
                  participants={participants}
                  sessions={sessions ?? []}
                  locations={locations}
                  npcs={npcs}
                  factions={factions}
                  quests={quests}
                  complicationTables={complicationTables}
                  pending={createDowntime.isPending}
                  onCancel={() => {
                    setWorkspaceMode('detail');
                    setEditor(emptyEditor());
                  }}
                  onChange={setEditor}
                  onSave={handleCreate}
                />
              ) : selectedActivity ? (
                <DowntimeDetailPanel
                  activity={selectedActivity}
                  editor={editor}
                  campaign={campaign ?? null}
                  sessions={sessions ?? []}
                  locations={locations}
                  npcs={npcs}
                  factions={factions}
                  quests={quests}
                  complicationTables={complicationTables}
                  pending={updateDowntime.isPending || deleteDowntime.isPending}
                  onChange={setEditor}
                  onSave={handleUpdate}
                  onDelete={handleDelete}
                  onRollComplication={handleRollComplication}
                />
              ) : (
                <div className={`${panelClass} flex min-h-[360px] items-center justify-center px-6 text-center`}>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">No Activity Selected</p>
                    <h4 className="mt-3 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,42%,90%)]">Shape the quiet days between sessions</h4>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[hsl(30,14%,58%)]">
                      Track research, crafting, training, faction work, or travel, then move time forward and let the world react.
                    </p>
                    <button type="button" onClick={startCreate} className={`${actionButtonClass(true)} mt-6`}>
                      <Plus className="h-4 w-4" />
                      Add Activity
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  function startCreate() {
    setWorkspaceMode('create');
    setSelectedActivityId(null);
    setEditor(emptyEditor(campaign));
  }

  async function handleCreate() {
    try {
      const payload = editorToPayload(editor, campaign);
      const created = await createDowntime.mutateAsync({ campaignId, data: payload });
      setWorkspaceMode('detail');
      setSelectedActivityId(created._id);
      toast.success('Downtime activity added');
    } catch {
      toast.error('Failed to create downtime activity');
    }
  }

  async function handleUpdate() {
    if (!selectedActivity) return;
    try {
      await updateDowntime.mutateAsync({
        campaignId,
        activityId: selectedActivity._id,
        data: editorToUpdatePayload(editor, campaign),
      });
      toast.success('Downtime activity updated');
    } catch {
      toast.error('Failed to update downtime activity');
    }
  }

  async function handleDelete() {
    if (!selectedActivity) return;
    try {
      await deleteDowntime.mutateAsync({ campaignId, activityId: selectedActivity._id });
      setSelectedActivityId(null);
      toast.success('Downtime activity removed');
    } catch {
      toast.error('Failed to remove downtime activity');
    }
  }

  async function handleAdvanceTime() {
    const days = Math.max(1, Number.parseInt(advanceDays, 10) || 1);
    try {
      await advanceDowntime.mutateAsync({ campaignId, data: { days } });
      if (campaign?.calendar) {
        await advanceDate.mutateAsync({ campaignId, days });
      }
      toast.success(`Advanced downtime by ${days} day${days === 1 ? '' : 's'}`);
    } catch {
      toast.error('Failed to advance downtime');
    }
  }

  async function handleStartDowntime() {
    const targets = data.filter((activity) => activity.status === 'planned');
    if (targets.length === 0) {
      toast.message('No planned downtime activities to start');
      return;
    }
    try {
      await Promise.all(
        targets.map((activity) =>
          updateDowntime.mutateAsync({
            campaignId,
            activityId: activity._id,
            data: {
              status: 'active',
              startDate: activity.startDate ?? campaign?.calendar?.currentDate ?? null,
            },
          }),
        ),
      );
      toast.success('Downtime block is now active');
    } catch {
      toast.error('Failed to start downtime');
    }
  }

  async function handleEndDowntime() {
    const targets = data.filter((activity) => activity.status === 'active');
    if (targets.length === 0) {
      toast.message('No active downtime activities to end');
      return;
    }
    try {
      await Promise.all(
        targets.map((activity) =>
          updateDowntime.mutateAsync({
            campaignId,
            activityId: activity._id,
            data: {
              status: activity.progressDays >= activity.durationDays ? 'completed' : 'planned',
            },
          }),
        ),
      );
      toast.success('Downtime block closed');
    } catch {
      toast.error('Failed to end downtime');
    }
  }

  async function handleRollComplication(activity: DowntimeActivity) {
    const tableId = activity.complicationTableId || activity.links?.randomTableId;
    if (!tableId) {
      toast.message('No complication table is linked to this activity yet');
      return;
    }
    try {
      const result = await rollTable.mutateAsync({ campaignId, tableId });
      await updateDowntime.mutateAsync({
        campaignId,
        activityId: activity._id,
        data: {
          outcome: [activity.outcome, `Complication roll: ${result.result}`].filter(Boolean).join('\n'),
        },
      });
      toast.success(result.result, { description: `${activity.name} complication` });
    } catch {
      toast.error('Failed to roll a complication');
    }
  }
}

function DowntimeEditorPanel({
  editor,
  participants,
  sessions,
  locations,
  npcs,
  factions,
  quests,
  complicationTables,
  pending,
  onCancel,
  onChange,
  onSave,
}: {
  editor: DowntimeEditor;
  participants: ParticipantOption[];
  sessions: Session[];
  locations: WorldEntity[];
  npcs: WorldEntity[];
  factions: WorldEntity[];
  quests: WorldEntity[];
  complicationTables: Array<{ _id: string; name: string; category: string }>;
  pending: boolean;
  onCancel: () => void;
  onChange: (value: DowntimeEditor) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className={`${panelClass} p-5`}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Field label="Participant">
              <select
                value={editor.participantId ? `${editor.participantType}:${editor.participantId}` : ''}
                onChange={(event) => {
                  const [participantType, participantId] = event.target.value.split(':');
                  const participant = participants.find((item) => item.id === participantId && item.type === participantType);
                  onChange({
                    ...editor,
                    participantId,
                    participantType: participantType as DowntimeParticipantType,
                    participantName: participant?.name ?? '',
                  });
                }}
                className={fieldClass}
              >
                <option value="">Choose a participant</option>
                {participants.map((participant) => (
                  <option key={`${participant.type}:${participant.id}`} value={`${participant.type}:${participant.id}`}>
                    {participant.name} · {participant.type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Activity Name">
              <input value={editor.name} onChange={(event) => onChange({ ...editor, name: event.target.value })} className={fieldClass} placeholder="Research the sealed codex" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Activity Type">
                <select value={editor.type} onChange={(event) => onChange({ ...editor, type: event.target.value as ActivityType })} className={fieldClass}>
                  {Object.entries(TYPE_META).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select value={editor.status} onChange={(event) => onChange({ ...editor, status: event.target.value as ActivityStatus })} className={fieldClass}>
                  {Object.entries(STATUS_META).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea value={editor.description} onChange={(event) => onChange({ ...editor, description: event.target.value })} className={`${fieldClass} min-h-[110px] resize-y`} />
            </Field>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Duration Days">
                <input value={editor.durationDays} onChange={(event) => onChange({ ...editor, durationDays: event.target.value })} className={fieldClass} />
              </Field>
              <Field label="Progress Days">
                <input value={editor.progressDays} onChange={(event) => onChange({ ...editor, progressDays: event.target.value })} className={fieldClass} />
              </Field>
            </div>
            <Field label="Location">
              <select value={editor.locationId} onChange={(event) => onChange({ ...editor, locationId: event.target.value, links: { ...editor.links, locationId: event.target.value || undefined } })} className={fieldClass}>
                <option value="">None</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>{location.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Complication Table">
              <select value={editor.complicationTableId} onChange={(event) => onChange({ ...editor, complicationTableId: event.target.value })} className={fieldClass}>
                <option value="">None</option>
                {complicationTables.map((table) => (
                  <option key={table._id} value={table._id}>{table.name} · {table.category}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <textarea value={editor.notes} onChange={(event) => onChange({ ...editor, notes: event.target.value })} className={`${fieldClass} min-h-[110px] resize-y`} />
            </Field>
          </div>
        </div>
      </div>

      <EntityLinksPanel editor={editor} sessions={sessions} npcs={npcs} factions={factions} quests={quests} onChange={onChange} />

      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className={actionButtonClass()}>Cancel</button>
          <button type="button" onClick={onSave} disabled={pending} className={actionButtonClass(true)}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save Activity
          </button>
        </div>
      </div>
    </div>
  );
}

function DowntimeDetailPanel({
  activity,
  editor,
  campaign,
  sessions,
  locations,
  npcs,
  factions,
  quests,
  complicationTables,
  pending,
  onChange,
  onSave,
  onDelete,
  onRollComplication,
}: {
  activity: DowntimeActivity;
  editor: DowntimeEditor;
  campaign: Campaign | null;
  sessions: Session[];
  locations: WorldEntity[];
  npcs: WorldEntity[];
  factions: WorldEntity[];
  quests: WorldEntity[];
  complicationTables: Array<{ _id: string; name: string; category: string }>;
  pending: boolean;
  onChange: (value: DowntimeEditor) => void;
  onSave: () => void;
  onDelete: () => void;
  onRollComplication: (activity: DowntimeActivity) => void;
}) {
  const progress = computeProgress(activity);
  const startDate = activity.startDate ? formatDateFromParts(campaign, activity.startDate) : 'Not set';
  const completionDate = calculateExpectedCompletion(campaign, activity.startDate, activity.durationDays);

  return (
    <div className="space-y-4">
      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${STATUS_META[activity.status].tone}`}>
                {STATUS_META[activity.status].label}
              </span>
              <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(42,78%,78%)]">
                {TYPE_META[activity.type]}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-[hsl(30,14%,60%)]">
              {activity.participantName ?? 'Participant'}{activity.locationId ? ` · ${findEntityName(locations, activity.locationId) ?? 'Linked location'}` : ''}
            </p>
          </div>
          <div className="rounded-[20px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.62)] p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Progress</p>
            <p className="mt-2 font-[Cinzel] text-lg text-[hsl(38,24%,88%)]">{progress.label}</p>
            <div className="mt-3 h-2 w-48 rounded-full bg-[hsla(32,24%,14%,0.82)]">
              <div className="h-2 rounded-full bg-[linear-gradient(90deg,hsla(42,72%,58%,0.88)_0%,hsla(35,72%,48%,0.78)_100%)]" style={{ width: `${progress.value}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className={`${panelClass} p-5`}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Start Date"><div className={fieldClass}>{startDate}</div></Field>
              <Field label="Expected Completion"><div className={fieldClass}>{completionDate}</div></Field>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Duration Days">
                <input value={editor.durationDays} onChange={(event) => onChange({ ...editor, durationDays: event.target.value })} className={fieldClass} />
              </Field>
              <Field label="Progress Days">
                <input value={editor.progressDays} onChange={(event) => onChange({ ...editor, progressDays: event.target.value })} className={fieldClass} />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Status">
                <select value={editor.status} onChange={(event) => onChange({ ...editor, status: event.target.value as ActivityStatus })} className={fieldClass}>
                  {Object.entries(STATUS_META).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <select value={editor.locationId} onChange={(event) => onChange({ ...editor, locationId: event.target.value, links: { ...editor.links, locationId: event.target.value || undefined } })} className={fieldClass}>
                  <option value="">None</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>{location.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Description">
                <textarea value={editor.description} onChange={(event) => onChange({ ...editor, description: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
              </Field>
              <Field label="Notes">
                <textarea value={editor.notes} onChange={(event) => onChange({ ...editor, notes: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
              </Field>
              <Field label="Outcome">
                <textarea value={editor.outcome} onChange={(event) => onChange({ ...editor, outcome: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
              </Field>
            </div>
          </div>

          <EntityLinksPanel editor={editor} sessions={sessions} npcs={npcs} factions={factions} quests={quests} onChange={onChange} />
        </div>

        <div className="space-y-4">
          <div className={`${panelClass} p-4`}>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Complications</p>
            <Field label="Random Table">
              <select value={editor.complicationTableId} onChange={(event) => onChange({ ...editor, complicationTableId: event.target.value })} className={fieldClass}>
                <option value="">None</option>
                {complicationTables.map((table) => (
                  <option key={table._id} value={table._id}>{table.name} · {table.category}</option>
                ))}
              </select>
            </Field>
            <button type="button" onClick={() => onRollComplication(activity)} className={`${actionButtonClass(true)} mt-3`}>
              <Sparkles className="h-4 w-4" />
              Roll Complication
            </button>
          </div>

          <div className={`${panelClass} p-4`}>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Actions</p>
            <div className="mt-3 space-y-2">
              <button type="button" onClick={onSave} disabled={pending} className={`${actionButtonClass(true)} w-full justify-center`}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
                Save Changes
              </button>
              <button type="button" onClick={onDelete} disabled={pending} className={`${actionButtonClass()} w-full justify-center`}>
                Remove Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EntityLinksPanel({
  editor,
  sessions,
  npcs,
  factions,
  quests,
  onChange,
}: {
  editor: DowntimeEditor;
  sessions: Session[];
  npcs: WorldEntity[];
  factions: WorldEntity[];
  quests: WorldEntity[];
  onChange: (value: DowntimeEditor) => void;
}) {
  return (
    <div className={`${panelClass} p-5`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Campaign Links</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Session">
          <select value={editor.links.sessionId ?? ''} onChange={(event) => onChange({ ...editor, links: { ...editor.links, sessionId: event.target.value || undefined } })} className={fieldClass}>
            <option value="">None</option>
            {sessions.map((session) => (
              <option key={session._id} value={session._id}>{session.name}</option>
            ))}
          </select>
        </Field>
        <Field label="NPC">
          <select value={editor.links.npcId ?? ''} onChange={(event) => onChange({ ...editor, links: { ...editor.links, npcId: event.target.value || undefined } })} className={fieldClass}>
            <option value="">None</option>
            {npcs.map((npc) => (
              <option key={npc._id} value={npc._id}>{npc.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Faction">
          <select value={editor.links.factionId ?? ''} onChange={(event) => onChange({ ...editor, links: { ...editor.links, factionId: event.target.value || undefined } })} className={fieldClass}>
            <option value="">None</option>
            {factions.map((faction) => (
              <option key={faction._id} value={faction._id}>{faction.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Quest">
          <select value={editor.links.questId ?? ''} onChange={(event) => onChange({ ...editor, links: { ...editor.links, questId: event.target.value || undefined } })} className={fieldClass}>
            <option value="">None</option>
            {quests.map((quest) => (
              <option key={quest._id} value={quest._id}>{quest.name}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function HeaderPill({ label, value, icon: Icon }: { label: string; value: string; icon: typeof CalendarDays }) {
  return (
    <div className="rounded-full border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.62)] px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[hsl(42,72%,68%)]" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{label}</p>
          <p className="text-sm text-[hsl(38,24%,88%)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">{label}</span>
      {children}
    </label>
  );
}

function actionButtonClass(emphasis = false) {
  return `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
    emphasis
      ? 'border-[hsla(42,72%,52%,0.38)] bg-[linear-gradient(180deg,hsla(42,72%,56%,0.18)_0%,hsla(42,72%,38%,0.16)_100%)] text-[hsl(42,78%,80%)] hover:border-[hsla(42,72%,60%,0.46)]'
      : 'border-[hsla(32,24%,24%,0.46)] bg-[hsla(24,18%,10%,0.6)] text-[hsl(30,12%,62%)] hover:text-[hsl(38,24%,88%)]'
  }`;
}

interface ParticipantOption {
  id: string;
  type: DowntimeParticipantType;
  name: string;
}

function buildParticipants(characters: Character[], allies: Ally[], npcs: WorldEntity[]): ParticipantOption[] {
  return [
    ...characters.map((character) => ({ id: character._id, type: 'character' as const, name: character.name })),
    ...allies.map((ally) => ({ id: ally._id, type: 'companion' as const, name: ally.name })),
    ...npcs.map((npc) => ({ id: npc._id, type: 'npc' as const, name: npc.name })),
  ].sort((left, right) => left.name.localeCompare(right.name));
}

function groupActivitiesByParticipant(activities: DowntimeActivity[]) {
  const groups = new Map<string, { key: string; name: string; participantType: string; activities: DowntimeActivity[] }>();
  for (const activity of activities) {
    const key = `${activity.participantType}:${activity.participantId}`;
    const group = groups.get(key) ?? {
      key,
      name: activity.participantName ?? 'Unknown',
      participantType: activity.participantType,
      activities: [],
    };
    group.activities.push(activity);
    groups.set(key, group);
  }
  return [...groups.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function computeProgress(activity: DowntimeActivity) {
  const total = Math.max(1, activity.durationDays || 1);
  const current = Math.min(total, activity.progressDays || 0);
  return {
    value: Math.round((current / total) * 100),
    label: `${current} / ${total} days`,
  };
}

function findEntityName(entities: WorldEntity[], id?: string) {
  if (!id) return null;
  return entities.find((entity) => entity._id === id)?.name ?? null;
}

function formatCalendarDate(campaign?: Campaign | null) {
  const date = campaign?.calendar?.currentDate;
  if (!campaign?.calendar || !date) return 'Calendar not initialized';
  const month = campaign.calendar.months[date.month]?.name ?? `Month ${date.month + 1}`;
  return `${month} ${date.day}, Year ${date.year}`;
}

function formatDateFromParts(campaign: Campaign | null, date: { year: number; month: number; day: number }) {
  if (!campaign?.calendar) return `Day ${date.day}, Month ${date.month + 1}, Year ${date.year}`;
  const month = campaign.calendar.months[date.month]?.name ?? `Month ${date.month + 1}`;
  return `${month} ${date.day}, Year ${date.year}`;
}

function summarizeAvailableDays(campaign: Campaign, activities: DowntimeActivity[]) {
  const longest = activities
    .filter((activity) => activity.status === 'planned' || activity.status === 'active')
    .reduce((max, activity) => Math.max(max, Math.max(0, activity.durationDays - activity.progressDays)), 0);
  return longest > 0 ? `${longest} days to clear the current ledger` : 'No days committed';
}

function emptyEditor(): DowntimeEditor {
  return {
    participantId: '',
    participantType: 'character',
    participantName: '',
    name: '',
    type: 'research',
    status: 'planned',
    description: '',
    durationDays: '7',
    progressDays: '0',
    locationId: '',
    notes: '',
    materials: '',
    outcome: '',
    complicationTableId: '',
    links: {},
  };
}

function activityToEditor(activity: DowntimeActivity): DowntimeEditor {
  return {
    participantId: activity.participantId,
    participantType: activity.participantType,
    participantName: activity.participantName ?? '',
    name: activity.name,
    type: activity.type,
    status: activity.status,
    description: activity.description,
    durationDays: `${activity.durationDays}`,
    progressDays: `${activity.progressDays}`,
    locationId: activity.locationId ?? '',
    notes: activity.notes ?? '',
    materials: activity.materials ?? '',
    outcome: activity.outcome ?? '',
    complicationTableId: activity.complicationTableId ?? '',
    links: activity.links ?? {},
  };
}

function editorToPayload(editor: DowntimeEditor, campaign?: Campaign | null) {
  return {
    participantId: editor.participantId,
    participantType: editor.participantType,
    participantName: editor.participantName,
    name: editor.name.trim(),
    type: editor.type,
    status: editor.status,
    description: editor.description.trim(),
    startDate: campaign?.calendar?.currentDate ?? null,
    durationDays: Math.max(1, Number.parseInt(editor.durationDays, 10) || 1),
    progressDays: Math.max(0, Number.parseInt(editor.progressDays, 10) || 0),
    locationId: editor.locationId || undefined,
    notes: editor.notes.trim(),
    materials: editor.materials.trim(),
    outcome: editor.outcome.trim(),
    complicationTableId: editor.complicationTableId || undefined,
    links: cleanLinks({
      ...editor.links,
      locationId: editor.locationId || editor.links.locationId,
    }),
  };
}

function editorToUpdatePayload(editor: DowntimeEditor, campaign?: Campaign | null) {
  return {
    name: editor.name.trim(),
    type: editor.type,
    status: editor.status,
    description: editor.description.trim(),
    startDate: campaign?.calendar?.currentDate ?? null,
    durationDays: Math.max(1, Number.parseInt(editor.durationDays, 10) || 1),
    progressDays: Math.max(0, Number.parseInt(editor.progressDays, 10) || 0),
    locationId: editor.locationId || undefined,
    notes: editor.notes.trim(),
    materials: editor.materials.trim(),
    outcome: editor.outcome.trim(),
    complicationTableId: editor.complicationTableId || undefined,
    links: cleanLinks({
      ...editor.links,
      locationId: editor.locationId || editor.links.locationId,
    }),
  };
}

function calculateExpectedCompletion(
  campaign: Campaign | null,
  startDate: DowntimeActivity['startDate'],
  durationDays: number,
) {
  if (!campaign?.calendar || !startDate) return 'Not set';
  const months = campaign.calendar.months;
  let year = startDate.year;
  let month = startDate.month;
  let day = startDate.day;
  let remaining = Math.max(0, durationDays - 1);

  while (remaining > 0) {
    day += 1;
    const monthLength = months[month]?.days ?? 30;
    if (day > monthLength) {
      day = 1;
      month += 1;
      if (month >= months.length) {
        month = 0;
        year += 1;
      }
    }
    remaining -= 1;
  }

  return formatDateFromParts(campaign, { year, month, day });
}

function cleanLinks(links: DowntimeLinks): DowntimeLinks | undefined {
  const next = Object.fromEntries(Object.entries(links).filter(([, value]) => value));
  return Object.keys(next).length ? (next as DowntimeLinks) : undefined;
}
