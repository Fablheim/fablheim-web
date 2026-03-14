import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookMarked,
  ChevronRight,
  Loader2,
  Plus,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useArcs, useAddArc, useAddArcDevelopment, useUpdateArc } from '@/hooks/useCampaigns';
import { useDowntimeActivities } from '@/hooks/useDowntime';
import { useEncounters } from '@/hooks/useEncounters';
import { useHandouts } from '@/hooks/useHandouts';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { CampaignArc, ArcPressure, ArcStatus, ArcType, Handout, Session, WorldEntity } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import type { DowntimeActivity } from '@/types/downtime';

interface StoryArcsDeskV2Props {
  campaignId: string;
}

interface ArcEditorState {
  name: string;
  description: string;
  status: ArcStatus;
  type: ArcType;
  pressure: ArcPressure;
  stakes: string;
  currentState: string;
  recentChange: string;
  nextDevelopment: string;
  links: {
    entityIds: string[];
    sessionIds: string[];
    encounterIds: string[];
    handoutIds: string[];
    downtimeIds: string[];
  };
}

const shellClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.64)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(22,24%,9%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';
const panelClass =
  'rounded-[22px] border border-[hsla(32,24%,24%,0.46)] bg-[linear-gradient(180deg,hsla(26,22%,11%,0.95)_0%,hsla(20,20%,9%,0.96)_100%)]';
const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(42,72%,52%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

const ARC_STATUS_LABELS: Record<ArcStatus, string> = {
  upcoming: 'Dormant',
  active: 'Active',
  completed: 'Resolved',
  advancing: 'Advancing',
  dormant: 'Dormant',
  threatened: 'Threatened',
  resolved: 'Resolved',
};

const ARC_TYPE_LABELS: Record<ArcType, string> = {
  main_plot: 'Main Plot',
  faction_conflict: 'Faction Conflict',
  mystery: 'Mystery',
  villain_scheme: 'Villain Scheme',
  character_arc: 'Character Arc',
  world_event: 'World Event',
  prophecy: 'Prophecy',
  custom: 'Custom',
};

const ARC_PRESSURE_LABELS: Record<ArcPressure, string> = {
  quiet: 'Quiet',
  active: 'Active',
  escalating: 'Escalating',
};

export function StoryArcsDeskV2({ campaignId }: StoryArcsDeskV2Props) {
  const { data: arcs, isLoading, error } = useArcs(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: entities } = useWorldEntities(campaignId);
  const { data: encounters } = useEncounters(campaignId);
  const { data: handouts } = useHandouts(campaignId);
  const { data: downtime } = useDowntimeActivities(campaignId);

  const addArc = useAddArc();
  const updateArc = useUpdateArc();
  const addArcDevelopment = useAddArcDevelopment();

  const allArcs = useMemo(() => arcs ?? [], [arcs]);
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editor, setEditor] = useState<ArcEditorState>(() => emptyEditor());
  const [developmentTitle, setDevelopmentTitle] = useState('');
  const [developmentDescription, setDevelopmentDescription] = useState('');
  const [developmentSessionId, setDevelopmentSessionId] = useState('');
  const [developmentEntityIds, setDevelopmentEntityIds] = useState<string[]>([]);

  const selectedArc = useMemo(
    () => allArcs.find((arc) => arc._id === selectedArcId) ?? null,
    [allArcs, selectedArcId],
  );

  useEffect(() => {
    if (isCreating) return;
    if (selectedArcId && allArcs.some((arc) => arc._id === selectedArcId)) return;
    setSelectedArcId(allArcs[0]?._id ?? null);
  }, [allArcs, selectedArcId, isCreating]);

  useEffect(() => {
    if (!selectedArc) return;
    setEditor(arcToEditor(selectedArc));
  }, [selectedArc]);

  const groupedArcs = useMemo(() => {
    const groups = new Map<string, CampaignArc[]>();
    for (const arc of allArcs) {
      const label = ARC_STATUS_LABELS[arc.status] ?? arc.status;
      const current = groups.get(label) ?? [];
      current.push(arc);
      groups.set(label, current);
    }
    return [...groups.entries()].map(([status, items]) => ({
      status,
      items: items.sort((left, right) => left.sortOrder - right.sortOrder),
    }));
  }, [allArcs]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-[hsl(30,14%,62%)]"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (error) {
    return <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[hsl(8,58%,72%)]">Failed to load story arcs.</div>;
  }

  const activeCount = allArcs.filter((arc) => ['active', 'advancing', 'threatened'].includes(arc.status)).length;
  const dormantCount = allArcs.filter((arc) => ['upcoming', 'dormant'].includes(arc.status)).length;
  const resolvedCount = allArcs.filter((arc) => ['completed', 'resolved'].includes(arc.status)).length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(18,48%,20%,0.14),transparent_34%),linear-gradient(180deg,hsl(222,18%,8%)_0%,hsl(20,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">Story Arcs</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">Narrative Thread Board</h2>
            <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">Track the major mysteries, factions, threats, and character threads that keep the world moving.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SummaryPill label="Active" value={`${activeCount}`} />
            <SummaryPill label="Dormant" value={`${dormantCount}`} />
            <SummaryPill label="Resolved" value={`${resolvedCount}`} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={startCreate} className={actionButtonClass(true)}>
            <Plus className="h-4 w-4" />
            Create Arc
          </button>
          {selectedArc && (
            <>
              <button type="button" onClick={() => quickStatus('advancing')} className={actionButtonClass()}>
                <Sparkles className="h-4 w-4" />
                Advance Arc
              </button>
              <button type="button" onClick={() => quickStatus('resolved')} className={actionButtonClass()}>
                <BookMarked className="h-4 w-4" />
                Resolve Arc
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${shellClass} min-h-0 overflow-hidden`}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Arc Library</p>
              <h3 className="mt-2 font-[Cinzel] text-lg text-[hsl(38,34%,88%)]">Thread Navigator</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {groupedArcs.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[hsla(32,24%,24%,0.52)] px-4 py-6 text-sm text-[hsl(30,12%,58%)]">
                  No story arcs yet. Start the first major thread and give the campaign a long-form spine.
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedArcs.map((group) => (
                    <div key={group.status} className="rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] p-3">
                      <p className="font-[Cinzel] text-sm text-[hsl(38,32%,86%)]">{group.status}</p>
                      <div className="mt-3 space-y-2">
                        {group.items.map((arc) => (
                          <button
                            key={arc._id}
                            type="button"
                            onClick={() => {
                              setIsCreating(false);
                              setSelectedArcId(arc._id);
                            }}
                            className={`block w-full rounded-[16px] border px-3 py-3 text-left transition ${
                              selectedArcId === arc._id && !isCreating
                                ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
                                : 'border-[hsla(32,24%,24%,0.32)] bg-[hsla(24,18%,10%,0.58)] hover:border-[hsla(42,72%,52%,0.22)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm text-[hsl(38,24%,88%)]">{arc.name}</p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[hsl(30,12%,58%)]">
                                  {ARC_TYPE_LABELS[arc.type ?? 'custom']} · {ARC_PRESSURE_LABELS[arc.pressure ?? 'quiet']}
                                </p>
                              </div>
                              <span className="rounded-full border border-[hsla(32,24%,24%,0.38)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[hsl(212,24%,66%)]">
                                {countLinks(arc)}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-[11px] text-[hsl(30,12%,58%)]">
                              {arc.pressure === 'escalating' && <AlertTriangle className="h-3.5 w-3.5 text-[hsl(8,58%,72%)]" />}
                              <span>{arc.currentState || arc.recentChange || arc.description || 'Thread waiting for its next turn.'}</span>
                            </div>
                          </button>
                        ))}
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
              <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Arc Workspace</p>
              <h3 className="mt-2 font-['IM_Fell_English'] text-[30px] leading-none text-[hsl(38,42%,90%)]">
                {isCreating ? 'Create a New Arc' : selectedArc?.name ?? 'Choose a Thread'}
              </h3>
              <p className="mt-2 text-sm text-[hsl(30,14%,58%)]">
                {isCreating ? 'Set the narrative stakes, choose the thread type, and connect it to the campaign world.' : selectedArc?.description || 'Select an arc from the library to inspect the campaign thread in detail.'}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {isCreating ? (
                <ArcEditor
                  editor={editor}
                  sessions={sessions ?? []}
                  entities={entities ?? []}
                  encounters={encounters ?? []}
                  handouts={handouts ?? []}
                  downtime={downtime ?? []}
                  pending={addArc.isPending}
                  onChange={setEditor}
                  onCancel={() => setIsCreating(false)}
                  onSave={handleCreate}
                />
              ) : selectedArc ? (
                <ArcWorkspace
                  arc={selectedArc}
                  editor={editor}
                  sessions={sessions ?? []}
                  entities={entities ?? []}
                  encounters={encounters ?? []}
                  handouts={handouts ?? []}
                  downtime={downtime ?? []}
                  pending={updateArc.isPending || addArcDevelopment.isPending}
                  developmentTitle={developmentTitle}
                  developmentDescription={developmentDescription}
                  developmentSessionId={developmentSessionId}
                  developmentEntityIds={developmentEntityIds}
                  onEditorChange={setEditor}
                  onSave={handleSave}
                  onDevelopmentTitleChange={setDevelopmentTitle}
                  onDevelopmentDescriptionChange={setDevelopmentDescription}
                  onDevelopmentSessionChange={setDevelopmentSessionId}
                  onDevelopmentEntityIdsChange={setDevelopmentEntityIds}
                  onAddDevelopment={handleAddDevelopment}
                />
              ) : (
                <div className={`${panelClass} flex min-h-[360px] items-center justify-center px-6 text-center`}>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(212,24%,66%)]">No Arc Selected</p>
                    <h4 className="mt-3 font-['IM_Fell_English'] text-[32px] leading-none text-[hsl(38,42%,90%)]">Map the bigger story</h4>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[hsl(30,14%,58%)]">
                      Keep faction schemes, prophecies, mysteries, and personal debts visible so the campaign’s long-form motion never disappears between sessions.
                    </p>
                    <button type="button" onClick={startCreate} className={`${actionButtonClass(true)} mt-6`}>
                      <Plus className="h-4 w-4" />
                      Create Arc
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
    setIsCreating(true);
    setSelectedArcId(null);
    setEditor(emptyEditor());
  }

  async function handleCreate() {
    try {
      const arc = await addArc.mutateAsync({
        campaignId,
        data: editorToPayload(editor),
      });
      const createdArc = (arc.arcs ?? []).slice().sort((a, b) => b.sortOrder - a.sortOrder)[0];
      setIsCreating(false);
      setSelectedArcId(createdArc?._id ?? null);
      toast.success('Story arc created');
    } catch {
      toast.error('Failed to create story arc');
    }
  }

  async function handleSave() {
    if (!selectedArc) return;
    try {
      await updateArc.mutateAsync({
        campaignId,
        arcId: selectedArc._id,
        data: editorToPayload(editor),
      });
      toast.success('Story arc updated');
    } catch {
      toast.error('Failed to update story arc');
    }
  }

  async function handleAddDevelopment() {
    if (!selectedArc || !developmentTitle.trim()) return;
    try {
      await addArcDevelopment.mutateAsync({
        campaignId,
        arcId: selectedArc._id,
        data: {
          title: developmentTitle.trim(),
          description: developmentDescription.trim() || undefined,
          sessionId: developmentSessionId || undefined,
          linkedEntityIds: developmentEntityIds,
        },
      });
      setDevelopmentTitle('');
      setDevelopmentDescription('');
      setDevelopmentSessionId('');
      setDevelopmentEntityIds([]);
      toast.success('Arc development recorded');
    } catch {
      toast.error('Failed to add arc development');
    }
  }

  async function quickStatus(status: ArcStatus) {
    if (!selectedArc) return;
    try {
      await updateArc.mutateAsync({
        campaignId,
        arcId: selectedArc._id,
        data: { status },
      });
      toast.success(`Arc marked ${ARC_STATUS_LABELS[status].toLowerCase()}`);
    } catch {
      toast.error('Failed to update arc status');
    }
  }
}

function ArcEditor({
  editor,
  sessions,
  entities,
  encounters,
  handouts,
  downtime,
  pending,
  onChange,
  onCancel,
  onSave,
}: {
  editor: ArcEditorState;
  sessions: Session[];
  entities: WorldEntity[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];
  pending: boolean;
  onChange: (value: ArcEditorState) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const locations = entities.filter((entity) => entity.type === 'location' || entity.type === 'location_detail');
  const npcs = entities.filter((entity) => entity.type === 'npc' || entity.type === 'npc_minor');
  const factions = entities.filter((entity) => entity.type === 'faction');
  const quests = entities.filter((entity) => entity.type === 'quest');

  return (
    <div className="space-y-4">
      <div className={`${panelClass} p-5`}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Field label="Arc Title">
              <input value={editor.name} onChange={(event) => onChange({ ...editor, name: event.target.value })} className={fieldClass} />
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Status">
                <select value={editor.status} onChange={(event) => onChange({ ...editor, status: event.target.value as ArcStatus })} className={fieldClass}>
                  {Object.entries(ARC_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <select value={editor.type} onChange={(event) => onChange({ ...editor, type: event.target.value as ArcType })} className={fieldClass}>
                  {Object.entries(ARC_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pressure">
                <select value={editor.pressure} onChange={(event) => onChange({ ...editor, pressure: event.target.value as ArcPressure })} className={fieldClass}>
                  {Object.entries(ARC_PRESSURE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Premise">
              <textarea value={editor.description} onChange={(event) => onChange({ ...editor, description: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
            </Field>
            <Field label="Stakes">
              <textarea value={editor.stakes} onChange={(event) => onChange({ ...editor, stakes: event.target.value })} className={`${fieldClass} min-h-[100px] resize-y`} />
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Current State">
              <textarea value={editor.currentState} onChange={(event) => onChange({ ...editor, currentState: event.target.value })} className={`${fieldClass} min-h-[100px] resize-y`} />
            </Field>
            <Field label="Recent Change">
              <textarea value={editor.recentChange} onChange={(event) => onChange({ ...editor, recentChange: event.target.value })} className={`${fieldClass} min-h-[100px] resize-y`} />
            </Field>
            <Field label="Next Likely Development">
              <textarea value={editor.nextDevelopment} onChange={(event) => onChange({ ...editor, nextDevelopment: event.target.value })} className={`${fieldClass} min-h-[100px] resize-y`} />
            </Field>
          </div>
        </div>
      </div>

      <ArcLinksEditor
        editor={editor}
        sessions={sessions}
        npcs={npcs}
        factions={factions}
        locations={locations}
        quests={quests}
        encounters={encounters}
        handouts={handouts}
        downtime={downtime}
        onChange={onChange}
      />

      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className={actionButtonClass()}>Cancel</button>
          <button type="button" onClick={onSave} disabled={pending} className={actionButtonClass(true)}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save Arc
          </button>
        </div>
      </div>
    </div>
  );
}

function ArcWorkspace({
  arc,
  editor,
  sessions,
  entities,
  encounters,
  handouts,
  downtime,
  pending,
  developmentTitle,
  developmentDescription,
  developmentSessionId,
  developmentEntityIds,
  onEditorChange,
  onSave,
  onDevelopmentTitleChange,
  onDevelopmentDescriptionChange,
  onDevelopmentSessionChange,
  onDevelopmentEntityIdsChange,
  onAddDevelopment,
}: {
  arc: CampaignArc;
  editor: ArcEditorState;
  sessions: Session[];
  entities: WorldEntity[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];
  pending: boolean;
  developmentTitle: string;
  developmentDescription: string;
  developmentSessionId: string;
  developmentEntityIds: string[];
  onEditorChange: (value: ArcEditorState) => void;
  onSave: () => void;
  onDevelopmentTitleChange: (value: string) => void;
  onDevelopmentDescriptionChange: (value: string) => void;
  onDevelopmentSessionChange: (value: string) => void;
  onDevelopmentEntityIdsChange: (value: string[]) => void;
  onAddDevelopment: () => void;
}) {
  const relatedEntities = entities.filter((entity) => (arc.links?.entityIds ?? []).includes(entity._id));
  const relatedSessions = sessions.filter((session) => (arc.links?.sessionIds ?? []).includes(session._id));
  const relatedEncounters = encounters.filter((encounter) => (arc.links?.encounterIds ?? []).includes(encounter._id));
  const relatedHandouts = handouts.filter((handout) => (arc.links?.handoutIds ?? []).includes(handout._id));
  const relatedDowntime = downtime.filter((item) => (arc.links?.downtimeIds ?? []).includes(item._id));

  return (
    <div className="space-y-4">
      <div className={`${panelClass} p-5`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(42,78%,78%)]">
            {ARC_TYPE_LABELS[arc.type ?? 'custom']}
          </span>
          <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(212,24%,66%)]">
            {ARC_STATUS_LABELS[arc.status]}
          </span>
          <span className="rounded-full border border-[hsla(32,24%,24%,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(30,12%,58%)]">
            Pressure: {ARC_PRESSURE_LABELS[arc.pressure ?? 'quiet']}
          </span>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <Field label="Premise">
              <textarea value={editor.description} onChange={(event) => onEditorChange({ ...editor, description: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Current State">
                <textarea value={editor.currentState} onChange={(event) => onEditorChange({ ...editor, currentState: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
              </Field>
              <Field label="Recent Change">
                <textarea value={editor.recentChange} onChange={(event) => onEditorChange({ ...editor, recentChange: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Stakes">
                <textarea value={editor.stakes} onChange={(event) => onEditorChange({ ...editor, stakes: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
              </Field>
              <Field label="Next Likely Development">
                <textarea value={editor.nextDevelopment} onChange={(event) => onEditorChange({ ...editor, nextDevelopment: event.target.value })} className={`${fieldClass} min-h-[120px] resize-y`} />
              </Field>
            </div>
          </div>

          <div className={`${panelClass} p-4`}>
            <Field label="Status">
              <select value={editor.status} onChange={(event) => onEditorChange({ ...editor, status: event.target.value as ArcStatus })} className={fieldClass}>
                {Object.entries(ARC_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <div className="mt-4">
              <Field label="Pressure">
                <select value={editor.pressure} onChange={(event) => onEditorChange({ ...editor, pressure: event.target.value as ArcPressure })} className={fieldClass}>
                  {Object.entries(ARC_PRESSURE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button type="button" onClick={onSave} disabled={pending} className={`${actionButtonClass(true)} mt-4 w-full justify-center`}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
              Save Arc
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={`${panelClass} p-5`}>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Recent Developments</p>
          <div className="mt-4 space-y-3">
            {(arc.developments ?? []).length === 0 ? (
              <p className="text-sm leading-7 text-[hsl(30,14%,58%)]">No developments logged yet. Record what changed in-session to keep the arc’s chronology visible.</p>
            ) : (
              [...(arc.developments ?? [])].slice().reverse().map((development) => (
                <div key={development._id} className="rounded-[18px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,10%,0.56)] p-4">
                  <p className="font-[Cinzel] text-sm text-[hsl(38,32%,86%)]">{development.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,62%)]">{development.description || 'No extra note recorded for this development.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] text-[hsl(212,24%,66%)]">
                    {development.sessionId && <span>{findSessionLabel(sessions, development.sessionId)}</span>}
                    {development.createdAt && <span>{new Date(development.createdAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 rounded-[18px] border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.58)] p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Add Development</p>
            <div className="mt-3 space-y-3">
              <input value={developmentTitle} onChange={(event) => onDevelopmentTitleChange(event.target.value)} className={fieldClass} placeholder="Captain Merrow was exposed as an informant" />
              <textarea value={developmentDescription} onChange={(event) => onDevelopmentDescriptionChange(event.target.value)} className={`${fieldClass} min-h-[100px] resize-y`} placeholder="What changed in the world or at the table?" />
              <select value={developmentSessionId} onChange={(event) => onDevelopmentSessionChange(event.target.value)} className={fieldClass}>
                <option value="">No linked session</option>
                {sessions.map((session) => (
                  <option key={session._id} value={session._id}>{findSessionLabel(sessions, session._id)}</option>
                ))}
              </select>
              <select multiple value={developmentEntityIds} onChange={(event) => onDevelopmentEntityIdsChange(Array.from(event.target.selectedOptions).map((option) => option.value))} className={`${fieldClass} min-h-[120px]`}>
                {entities.map((entity) => (
                  <option key={entity._id} value={entity._id}>{entity.name}</option>
                ))}
              </select>
              <button type="button" onClick={onAddDevelopment} disabled={pending || !developmentTitle.trim()} className={actionButtonClass(true)}>
                <Plus className="h-4 w-4" />
                Record Development
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ArcLinksEditor
            editor={editor}
            sessions={sessions}
            npcs={entities.filter((entity) => entity.type === 'npc' || entity.type === 'npc_minor')}
            factions={entities.filter((entity) => entity.type === 'faction')}
            locations={entities.filter((entity) => entity.type === 'location' || entity.type === 'location_detail')}
            quests={entities.filter((entity) => entity.type === 'quest')}
            encounters={encounters}
            handouts={handouts}
            downtime={downtime}
            onChange={onEditorChange}
          />
          <LinkedRecordsPanel
            entities={relatedEntities}
            sessions={relatedSessions}
            encounters={relatedEncounters}
            handouts={relatedHandouts}
            downtime={relatedDowntime}
          />
        </div>
      </div>
    </div>
  );
}

function ArcLinksEditor({
  editor,
  sessions,
  npcs,
  factions,
  locations,
  quests,
  encounters,
  handouts,
  downtime,
  onChange,
}: {
  editor: ArcEditorState;
  sessions: Session[];
  npcs: WorldEntity[];
  factions: WorldEntity[];
  locations: WorldEntity[];
  quests: WorldEntity[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];
  onChange: (value: ArcEditorState) => void;
}) {
  const entityOptions = [...npcs, ...factions, ...locations, ...quests];
  return (
    <div className={`${panelClass} p-5`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(212,24%,66%)]">Campaign Connections</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="NPCs / Factions / Locations / Quests">
          <select multiple value={editor.links.entityIds} onChange={(event) => onChange({ ...editor, links: { ...editor.links, entityIds: Array.from(event.target.selectedOptions).map((option) => option.value) } })} className={`${fieldClass} min-h-[140px]`}>
            {entityOptions.map((entity) => (
              <option key={entity._id} value={entity._id}>{entity.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Sessions">
          <select multiple value={editor.links.sessionIds} onChange={(event) => onChange({ ...editor, links: { ...editor.links, sessionIds: Array.from(event.target.selectedOptions).map((option) => option.value) } })} className={`${fieldClass} min-h-[140px]`}>
            {sessions.map((session) => (
              <option key={session._id} value={session._id}>{findSessionLabel(sessions, session._id)}</option>
            ))}
          </select>
        </Field>
        <Field label="Encounters / Handouts / Downtime">
          <div className="grid gap-3">
            <select multiple value={editor.links.encounterIds} onChange={(event) => onChange({ ...editor, links: { ...editor.links, encounterIds: Array.from(event.target.selectedOptions).map((option) => option.value) } })} className={`${fieldClass} min-h-[96px]`}>
              {encounters.map((encounter) => (
                <option key={encounter._id} value={encounter._id}>{encounter.name}</option>
              ))}
            </select>
            <select multiple value={editor.links.handoutIds} onChange={(event) => onChange({ ...editor, links: { ...editor.links, handoutIds: Array.from(event.target.selectedOptions).map((option) => option.value) } })} className={`${fieldClass} min-h-[96px]`}>
              {handouts.map((handout) => (
                <option key={handout._id} value={handout._id}>{handout.title}</option>
              ))}
            </select>
            <select multiple value={editor.links.downtimeIds} onChange={(event) => onChange({ ...editor, links: { ...editor.links, downtimeIds: Array.from(event.target.selectedOptions).map((option) => option.value) } })} className={`${fieldClass} min-h-[96px]`}>
              {downtime.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>
        </Field>
      </div>
    </div>
  );
}

function LinkedRecordsPanel({
  entities,
  sessions,
  encounters,
  handouts,
  downtime,
}: {
  entities: WorldEntity[];
  sessions: Session[];
  encounters: Encounter[];
  handouts: Handout[];
  downtime: DowntimeActivity[];
}) {
  return (
    <div className={`${panelClass} p-4`}>
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(212,24%,66%)]">Linked Records</p>
      <div className="mt-3 space-y-3">
        <LinkGroup title="Entities" items={entities.map((entity) => entity.name)} />
        <LinkGroup title="Sessions" items={sessions.map((session) => findSessionLabel(sessions, session._id))} />
        <LinkGroup title="Encounters" items={encounters.map((encounter) => encounter.name)} />
        <LinkGroup title="Handouts" items={handouts.map((handout) => handout.title)} />
        <LinkGroup title="Downtime" items={downtime.map((item) => item.name)} />
      </div>
    </div>
  );
}

function LinkGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-[16px] border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,10%,0.56)] p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{title}</p>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-[hsl(38,24%,88%)]">
            <ChevronRight className="h-3.5 w-3.5 text-[hsl(30,12%,58%)]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[hsla(32,24%,24%,0.42)] bg-[hsla(24,18%,10%,0.62)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(212,24%,66%)]">{label}</p>
      <p className="text-sm text-[hsl(38,24%,88%)]">{value}</p>
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

function emptyEditor(): ArcEditorState {
  return {
    name: '',
    description: '',
    status: 'dormant',
    type: 'mystery',
    pressure: 'quiet',
    stakes: '',
    currentState: '',
    recentChange: '',
    nextDevelopment: '',
    links: {
      entityIds: [],
      sessionIds: [],
      encounterIds: [],
      handoutIds: [],
      downtimeIds: [],
    },
  };
}

function arcToEditor(arc: CampaignArc): ArcEditorState {
  return {
    name: arc.name,
    description: arc.description ?? '',
    status: arc.status,
    type: arc.type ?? 'custom',
    pressure: arc.pressure ?? 'quiet',
    stakes: arc.stakes ?? '',
    currentState: arc.currentState ?? '',
    recentChange: arc.recentChange ?? '',
    nextDevelopment: arc.nextDevelopment ?? '',
    links: {
      entityIds: arc.links?.entityIds ?? [],
      sessionIds: arc.links?.sessionIds ?? [],
      encounterIds: arc.links?.encounterIds ?? [],
      handoutIds: arc.links?.handoutIds ?? [],
      downtimeIds: arc.links?.downtimeIds ?? [],
    },
  };
}

function editorToPayload(editor: ArcEditorState) {
  return {
    name: editor.name.trim(),
    description: editor.description.trim(),
    status: editor.status,
    type: editor.type,
    pressure: editor.pressure,
    stakes: editor.stakes.trim(),
    currentState: editor.currentState.trim(),
    recentChange: editor.recentChange.trim(),
    nextDevelopment: editor.nextDevelopment.trim(),
    links: {
      entityIds: editor.links.entityIds,
      sessionIds: editor.links.sessionIds,
      encounterIds: editor.links.encounterIds,
      handoutIds: editor.links.handoutIds,
      downtimeIds: editor.links.downtimeIds,
      calendarEventIds: [],
    },
  };
}

function countLinks(arc: CampaignArc) {
  const links = arc.links;
  if (!links) return 0;
  return (links.entityIds?.length ?? 0)
    + (links.sessionIds?.length ?? 0)
    + (links.encounterIds?.length ?? 0)
    + (links.handoutIds?.length ?? 0)
    + (links.downtimeIds?.length ?? 0);
}

function findSessionLabel(sessions: Session[], sessionId: string) {
  const session = sessions.find((item) => item._id === sessionId);
  if (!session) return 'Linked session';
  return `Session ${session.sessionNumber}${session.title ? ` — ${session.title}` : ''}`;
}
