import { useState, useMemo } from 'react';
import { Flag, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useArcs, useUpdateArc } from '@/hooks/useCampaigns';
import type { CampaignArc } from '@/types/campaign';

const sectionLabelClass = 'text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]';

interface ArcLinkerProps {
  campaignId: string;
  /** The type of link field on the arc's links object */
  linkField: 'trackerIds' | 'calendarEventIds';
  /** The ID of the entity being linked (tracker ID or calendar event ID) */
  entityId: string;
  /** Label shown above the section */
  label?: string;
}

/**
 * A reusable arc-linking widget. Scans all arcs to find which one(s) reference
 * `entityId` in `arc.links[linkField]`, and provides a dropdown to link/unlink.
 */
export function ArcLinker({ campaignId, linkField, entityId, label = 'Related Arc' }: ArcLinkerProps) {
  const { data: arcs } = useArcs(campaignId);
  const updateArc = useUpdateArc();
  const [isOpen, setIsOpen] = useState(false);

  const allArcs = useMemo(() => arcs ?? [], [arcs]);

  const linkedArcs = useMemo(
    () => allArcs.filter((arc) => (arc.links?.[linkField] ?? []).includes(entityId)),
    [allArcs, linkField, entityId],
  );

  const unlinkedArcs = useMemo(
    () => allArcs.filter((arc) => !(arc.links?.[linkField] ?? []).includes(entityId)),
    [allArcs, linkField, entityId],
  );

  function handleLink(arc: CampaignArc) {
    const currentIds = arc.links?.[linkField] ?? [];
    if (currentIds.includes(entityId)) return;

    updateArc.mutate(
      {
        campaignId,
        arcId: arc._id,
        data: {
          links: {
            ...arc.links,
            [linkField]: [...currentIds, entityId],
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(`Linked to ${arc.name}`);
          setIsOpen(false);
        },
        onError: () => toast.error('Failed to link arc'),
      },
    );
  }

  function handleUnlink(arc: CampaignArc) {
    const currentIds = arc.links?.[linkField] ?? [];
    updateArc.mutate(
      {
        campaignId,
        arcId: arc._id,
        data: {
          links: {
            ...arc.links,
            [linkField]: currentIds.filter((id) => id !== entityId),
          },
        },
      },
      {
        onSuccess: () => toast.success(`Unlinked from ${arc.name}`),
        onError: () => toast.error('Failed to unlink arc'),
      },
    );
  }

  return (
    <div>
      <p className={sectionLabelClass}>{label}</p>
      <div className="mt-3 space-y-2">
        {linkedArcs.length > 0 ? renderLinkedBadges() : renderEmptyState()}
        {renderDropdown()}
      </div>
    </div>
  );

  function renderLinkedBadges() {
    return (
      <div className="flex flex-wrap gap-2">
        {linkedArcs.map((arc) => (
          <span
            key={arc._id}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(42,54%,46%,0.38)] bg-[hsla(40,54%,18%,0.2)] px-3 py-1.5 text-xs text-[hsl(42,78%,80%)]"
          >
            <Flag className="h-3 w-3" />
            {arc.name}
            <button
              type="button"
              onClick={() => handleUnlink(arc)}
              disabled={updateArc.isPending}
              className="ml-0.5 rounded-full p-0.5 text-[hsl(30,12%,58%)] transition hover:text-[hsl(8,70%,76%)] disabled:opacity-40"
              title="Remove arc link"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    );
  }

  function renderEmptyState() {
    if (allArcs.length === 0) {
      return <p className="text-sm text-[hsl(30,12%,60%)]">No arcs exist yet.</p>;
    }
    return <p className="text-sm text-[hsl(30,12%,60%)]">No arc linked.</p>;
  }

  function renderDropdown() {
    if (unlinkedArcs.length === 0) return null;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[hsla(32,24%,26%,0.62)] bg-[hsla(24,18%,10%,0.6)] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[hsl(30,12%,62%)] transition hover:text-[hsl(38,24%,88%)]"
        >
          <Flag className="h-3.5 w-3.5" />
          Link Arc
          <ChevronDown className={`h-3 w-3 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-64 overflow-y-auto rounded-2xl border border-[hsla(32,24%,24%,0.62)] bg-[hsl(22,18%,10%)] shadow-lg">
            {unlinkedArcs.map((arc) => (
              <button
                key={arc._id}
                type="button"
                onClick={() => handleLink(arc)}
                disabled={updateArc.isPending}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[hsl(38,24%,82%)] transition hover:bg-[hsla(42,54%,46%,0.12)] disabled:opacity-40"
              >
                <Flag className="h-3.5 w-3.5 shrink-0 text-[hsl(42,54%,56%)]" />
                <span className="truncate">{arc.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
}
