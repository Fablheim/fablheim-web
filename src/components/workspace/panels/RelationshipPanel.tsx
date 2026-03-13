import { useState } from 'react';
import {
  Heart,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  MessageSquarePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  useRelationships,
  useCreateRelationship,
  useUpdateRelationship,
  useAddRelationshipEvent,
  useDeleteRelationship,
} from '@/hooks/useRelationships';
import { useCharacters } from '@/hooks/useCharacters';
import type { PartyRelationship } from '@/types/relationship';

interface RelationshipPanelProps {
  campaignId: string;
}

const INPUT_CLS =
  'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
const LABEL_CLS = 'block text-xs font-medium text-muted-foreground mb-1';

function trustColor(trust: number): string {
  if (trust >= 50) return 'text-emerald-400';
  if (trust >= 20) return 'text-emerald-400/60';
  if (trust > -20) return 'text-muted-foreground';
  if (trust > -50) return 'text-amber-400';
  return 'text-red-400';
}

function trustBarWidth(trust: number): string {
  return `${Math.abs(trust)}%`;
}

export function RelationshipPanel({ campaignId }: RelationshipPanelProps) {
  const { data: relationships, isLoading, error } = useRelationships(campaignId);
  const { data: characters } = useCharacters(campaignId);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load relationships" />;

  const all = relationships ?? [];
  const chars = new Map((characters ?? []).map((c) => [c._id, c.name]));

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {renderHeader()}
      <div className="flex-1 space-y-3 p-4">
        {renderRelationshipList()}
        {showCreate && (
          <CreateRelationshipForm
            campaignId={campaignId}
            characters={characters ?? []}
            onClose={() => setShowCreate(false)}
          />
        )}
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between border-b border-[hsla(38,30%,25%,0.2)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary/70" />
          <h2 className="font-['IM_Fell_English'] text-base font-semibold text-foreground">
            Relationships
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Add Bond
        </Button>
      </div>
    );
  }

  function renderRelationshipList() {
    if (all.length === 0) {
      return (
        <p className="text-center text-xs italic text-muted-foreground/60">
          No relationships defined yet
        </p>
      );
    }

    return (
      <div className="space-y-1">
        {all.map((rel) => (
          <RelationshipCard
            key={rel._id}
            relationship={rel}
            charMap={chars}
            campaignId={campaignId}
          />
        ))}
      </div>
    );
  }
}

/* ── Relationship Card ─────────────────────────────────────── */

function RelationshipCard({
  relationship,
  charMap,
  campaignId,
}: {
  relationship: PartyRelationship;
  charMap: Map<string, string>;
  campaignId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const deleteRelationship = useDeleteRelationship();

  const nameA = charMap.get(relationship.characterAId) ?? 'Unknown';
  const nameB = charMap.get(relationship.characterBId) ?? 'Unknown';
  const color = trustColor(relationship.trust);

  return (
    <div className="rounded border border-border/40 bg-[hsl(24,15%,11%)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground/50 hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">
              {nameA} &amp; {nameB}
            </span>
            {relationship.label && (
              <span className="rounded bg-[hsl(24,15%,14%)] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {relationship.label}
              </span>
            )}
          </div>
          {renderTrustBar()}
        </div>

        <span className={`text-xs font-medium tabular-nums ${color}`}>
          {relationship.trust > 0 ? '+' : ''}
          {relationship.trust}
        </span>

        <button
          type="button"
          className="shrink-0 text-muted-foreground/40 transition-colors hover:text-blood"
          disabled={deleteRelationship.isPending}
          onClick={() =>
            deleteRelationship.mutate(
              { campaignId, relationshipId: relationship._id },
              {
                onSuccess: () => toast.success('Relationship removed'),
                onError: () => toast.error('Failed to delete'),
              },
            )
          }
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {expanded && <ExpandedRelationship relationship={relationship} campaignId={campaignId} />}
    </div>
  );

  function renderTrustBar() {
    const isPositive = relationship.trust >= 0;
    return (
      <div className="mt-0.5 flex h-1 w-full overflow-hidden rounded-full bg-[hsl(24,15%,14%)]">
        {!isPositive && <div className="flex-1" />}
        <div
          className={`h-full rounded-full transition-all ${
            isPositive ? 'bg-emerald-500/60' : 'bg-red-400/60'
          }`}
          style={{ width: trustBarWidth(relationship.trust) }}
        />
        {isPositive && <div className="flex-1" />}
      </div>
    );
  }
}

/* ── Expanded Details ──────────────────────────────────────── */

function ExpandedRelationship({
  relationship,
  campaignId,
}: {
  relationship: PartyRelationship;
  campaignId: string;
}) {
  const [showEventForm, setShowEventForm] = useState(false);

  return (
    <div className="space-y-2 border-t border-border/20 px-3 py-2">
      {renderNotesSection()}
      {renderEditSection()}
      {renderEventsSection()}
      {showEventForm && (
        <AddEventForm
          campaignId={campaignId}
          relationshipId={relationship._id}
          onClose={() => setShowEventForm(false)}
        />
      )}
    </div>
  );

  function renderNotesSection() {
    if (!relationship.notes) return null;
    return (
      <div className="text-[10px]">
        <span className="text-muted-foreground/50">Notes: </span>
        <span className="text-muted-foreground">{relationship.notes}</span>
      </div>
    );
  }

  function renderEditSection() {
    return (
      <InlineEditFields
        relationship={relationship}
        campaignId={campaignId}
      />
    );
  }

  function renderEventsSection() {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground/60">Events</span>
          <button
            type="button"
            onClick={() => setShowEventForm(true)}
            className="flex items-center gap-0.5 text-[10px] text-primary/60 hover:text-primary"
          >
            <MessageSquarePlus className="h-3 w-3" />
            Add
          </button>
        </div>
        {relationship.events.length === 0 ? (
          <p className="text-[10px] italic text-muted-foreground/40">No events recorded</p>
        ) : (
          <div className="space-y-1">
            {[...relationship.events].reverse().map((evt) => (
              <div
                key={evt.id}
                className="rounded bg-[hsl(24,15%,9%)] px-2 py-1 text-[10px]"
              >
                <span className="text-muted-foreground">{evt.description}</span>
                {evt.trustDelta !== 0 && (
                  <span
                    className={`ml-1.5 font-medium ${
                      evt.trustDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {evt.trustDelta > 0 ? '+' : ''}
                    {evt.trustDelta}
                  </span>
                )}
                {evt.sessionNumber != null && (
                  <span className="ml-1.5 text-muted-foreground/40">S{evt.sessionNumber}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

/* ── Inline Edit Fields ────────────────────────────────────── */

function InlineEditFields({
  relationship,
  campaignId,
}: {
  relationship: PartyRelationship;
  campaignId: string;
}) {
  const [trust, setTrust] = useState(relationship.trust);
  const [label, setLabel] = useState(relationship.label);
  const [notes, setNotes] = useState(relationship.notes);
  const updateRelationship = useUpdateRelationship();

  const dirty =
    trust !== relationship.trust ||
    label !== relationship.label ||
    notes !== relationship.notes;

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL_CLS}>Trust ({trust})</label>
          <input
            type="range"
            min={-100}
            max={100}
            value={trust}
            onChange={(e) => setTrust(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Label</label>
          <input
            className={INPUT_CLS}
            placeholder="e.g. Rivalry, Friendship"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className={LABEL_CLS}>Notes</label>
        <textarea
          className={`${INPUT_CLS} resize-none`}
          rows={2}
          placeholder="Relationship notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {dirty && (
        <Button
          size="sm"
          variant="outline"
          disabled={updateRelationship.isPending}
          onClick={() =>
            updateRelationship.mutate(
              {
                campaignId,
                relationshipId: relationship._id,
                data: { trust, label: label || undefined, notes: notes || undefined },
              },
              {
                onSuccess: () => toast.success('Updated'),
                onError: () => toast.error('Failed to update'),
              },
            )
          }
        >
          Save Changes
        </Button>
      )}
    </div>
  );
}

/* ── Add Event Form ────────────────────────────────────────── */

function AddEventForm({
  campaignId,
  relationshipId,
  onClose,
}: {
  campaignId: string;
  relationshipId: string;
  onClose: () => void;
}) {
  const [description, setDescription] = useState('');
  const [trustDelta, setTrustDelta] = useState(0);
  const [sessionNumber, setSessionNumber] = useState('');
  const addEvent = useAddRelationshipEvent();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    addEvent.mutate(
      {
        campaignId,
        relationshipId,
        data: {
          description: description.trim(),
          trustDelta: trustDelta || undefined,
          sessionNumber: sessionNumber ? Number(sessionNumber) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Event added');
          onClose();
        },
        onError: () => toast.error('Failed to add event'),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded border border-border/40 bg-[hsl(24,15%,9%)] p-2"
    >
      <p className="text-[10px] font-medium text-muted-foreground">New Event</p>
      <input
        className={INPUT_CLS}
        placeholder="What happened?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL_CLS}>Trust Change</label>
          <input
            type="number"
            className={INPUT_CLS}
            min={-100}
            max={100}
            value={trustDelta}
            onChange={(e) => setTrustDelta(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Session #</label>
          <input
            type="number"
            className={INPUT_CLS}
            placeholder="Optional"
            value={sessionNumber}
            onChange={(e) => setSessionNumber(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={addEvent.isPending || !description.trim()}
        >
          {addEvent.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ── Create Relationship Form ──────────────────────────────── */

function CreateRelationshipForm({
  campaignId,
  characters,
  onClose,
}: {
  campaignId: string;
  characters: Array<{ _id: string; name: string }>;
  onClose: () => void;
}) {
  const [charA, setCharA] = useState(characters[0]?._id ?? '');
  const [charB, setCharB] = useState(characters[1]?._id ?? '');
  const [label, setLabel] = useState('');
  const createRelationship = useCreateRelationship();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!charA || !charB || charA === charB) return;

    createRelationship.mutate(
      {
        campaignId,
        data: {
          characterAId: charA,
          characterBId: charB,
          label: label.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Relationship created');
          onClose();
        },
        onError: () => toast.error('Failed to create relationship'),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded border border-border/40 bg-[hsl(24,15%,11%)] p-3"
    >
      <p className="text-xs font-medium text-muted-foreground">New Relationship</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL_CLS}>Character A</label>
          <select
            className={INPUT_CLS}
            value={charA}
            onChange={(e) => setCharA(e.target.value)}
          >
            {characters.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Character B</label>
          <select
            className={INPUT_CLS}
            value={charB}
            onChange={(e) => setCharB(e.target.value)}
          >
            {characters.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {charA === charB && charA && (
        <p className="text-[10px] text-red-400">Characters must be different</p>
      )}
      <input
        className={INPUT_CLS}
        placeholder="Label (e.g. Rivalry, Friendship)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={createRelationship.isPending || !charA || !charB || charA === charB}
        >
          {createRelationship.isPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : null}
          Create
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
