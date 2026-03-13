import { type FormEvent, useState, useMemo, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useUpdateWorldEntity } from '@/hooks/useWorldEntities';
import { TYPE_LABELS, TYPE_ICONS, TYPE_ACCENTS } from './world-constants';
import type { WorldEntity } from '@/types/campaign';

interface LinkEntityModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  entity: WorldEntity;
  allEntities: WorldEntity[];
}

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

const RELATIONSHIP_SUGGESTIONS = [
  'allied with', 'enemy of', 'located in', 'member of',
  'created by', 'guards', 'serves', 'owns', 'mentor of', 'reports to',
];

export function LinkEntityModal({ open, onClose, campaignId, entity, allEntities }: LinkEntityModalProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const updateEntity = useUpdateWorldEntity();

  const alreadyLinked = new Set(entity.relatedEntities.map((r) => r.entityId));

  const filteredEntities = useMemo(() => {
    return allEntities.filter((e) => {
      if (e._id === entity._id) return false;
      if (alreadyLinked.has(e._id)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q);
    });
  }, [allEntities, entity._id, alreadyLinked, search]);

  if (!open) return null;

  function handleClose() {
    setSearch('');
    setSelectedId('');
    setRelationshipType('');
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !relationshipType.trim()) return;

    const updatedRelations = [
      ...entity.relatedEntities,
      { entityId: selectedId, relationshipType: relationshipType.trim() },
    ];

    try {
      await updateEntity.mutateAsync({
        campaignId,
        id: entity._id,
        data: { relatedEntities: updatedRelations },
      });
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to link entity');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        <div className="flex items-center justify-between">
          <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
            Link Entity
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities..."
              className="block w-full rounded-sm border border-input bg-input py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]"
            />
          </div>

          {/* Entity list */}
          <div className="max-h-48 overflow-y-auto rounded-sm border border-border bg-background/30">
            {filteredEntities.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No entities found</p>
            ) : (
              filteredEntities.map((e) => {
                const Icon = TYPE_ICONS[e.type];
                const accent = TYPE_ACCENTS[e.type];
                return (
                  <button
                    key={e._id}
                    type="button"
                    onClick={() => setSelectedId(e._id)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50 ${
                      selectedId === e._id ? 'bg-brass/10 border-l-2 border-l-brass' : ''
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${accent.text}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{e.name}</p>
                    </div>
                    <span className={`shrink-0 rounded-md ${accent.bg} px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${accent.text}`}>
                      {TYPE_LABELS[e.type]}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Relationship type */}
          <div className="relative">
            <label htmlFor="relationship-type" className={labelClass}>Relationship</label>
            <input
              id="relationship-type"
              type="text"
              required
              maxLength={100}
              value={relationshipType}
              onChange={(e) => {
                setRelationshipType(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="allied with, located in, created by..."
              className={inputClass}
              autoComplete="off"
            />
            {showSuggestions && (() => {
              const q = relationshipType.toLowerCase();
              const filtered = RELATIONSHIP_SUGGESTIONS.filter(
                (s) => !q || s.includes(q),
              );
              if (filtered.length === 0) return null;
              return (
                <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-sm border border-border bg-card shadow-lg max-h-40 overflow-y-auto">
                  {filtered.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setRelationshipType(s);
                        setShowSuggestions(false);
                        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedId || !relationshipType.trim() || updateEntity.isPending}>
              {updateEntity.isPending ? 'Linking...' : 'Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
