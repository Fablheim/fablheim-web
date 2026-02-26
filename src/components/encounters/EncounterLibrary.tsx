import { useState } from 'react';
import { Plus, Loader2, Trash2, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useEncounters, useCreateEncounter, useDeleteEncounter } from '@/hooks/useEncounters';
import type { Encounter, EncounterDifficulty } from '@/types/encounter';

interface EncounterLibraryProps {
  campaignId: string;
  onSelect: (encounter: Encounter) => void;
}

const DIFFICULTY_STYLES: Record<EncounterDifficulty, string> = {
  easy: 'bg-forest/20 text-[hsl(150,50%,55%)]',
  medium: 'bg-brass/20 text-brass',
  hard: 'bg-primary/20 text-primary',
  deadly: 'bg-blood/20 text-blood',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  ready: 'bg-forest/20 text-[hsl(150,50%,55%)]',
  used: 'bg-accent text-muted-foreground',
};

export function EncounterLibrary({ campaignId, onSelect }: EncounterLibraryProps) {
  const { data: encounters, isLoading } = useEncounters(campaignId);
  const createEncounter = useCreateEncounter(campaignId);
  const deleteEncounter = useDeleteEncounter(campaignId);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');

  function handleCreate() {
    if (!newName.trim()) return;
    createEncounter.mutate(
      { name: newName.trim() },
      {
        onSuccess: (enc) => {
          setNewName('');
          setShowNewForm(false);
          onSelect(enc);
          toast.success('Encounter created');
        },
        onError: () => toast.error('Failed to create encounter'),
      },
    );
  }

  function handleDelete(e: React.MouseEvent, encounterId: string) {
    e.stopPropagation();
    if (!confirm('Delete this encounter?')) return;
    deleteEncounter.mutate(encounterId, {
      onSuccess: () => toast.success('Encounter deleted'),
      onError: () => toast.error('Failed to delete encounter'),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderHeader()}
      {renderNewForm()}
      {renderEncounterGrid()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['IM_Fell_English'] text-xl text-foreground">Encounter Library</h2>
          <p className="text-sm text-muted-foreground font-['IM_Fell_English'] italic">
            {encounters?.length ?? 0} encounter{encounters?.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!showNewForm && (
          <Button size="sm" onClick={() => setShowNewForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Encounter
          </Button>
        )}
      </div>
    );
  }

  function renderNewForm() {
    if (!showNewForm) return null;
    return (
      <div className="flex items-center gap-2 rounded-md border border-gold/20 bg-card/40 p-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Encounter name..."
          className="flex-1 rounded-sm border border-input bg-input px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground input-carved"
          autoFocus
        />
        <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || createEncounter.isPending}>
          {createEncounter.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create'}
        </Button>
        <button
          type="button"
          onClick={() => { setShowNewForm(false); setNewName(''); }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  function renderEncounterGrid() {
    if (!encounters || encounters.length === 0) {
      return (
        <div className="rounded-lg border-2 border-dashed border-gold/20 bg-card/20 p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Swords className="h-6 w-6 text-primary/60" />
          </div>
          <h3 className="font-['IM_Fell_English'] text-lg text-foreground">No encounters yet</h3>
          <p className="mt-1 text-sm text-muted-foreground font-['IM_Fell_English'] italic">
            Create your first encounter to start prepping for game day
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {encounters.map((enc) => (
          <button
            key={enc._id}
            type="button"
            onClick={() => onSelect(enc)}
            className="group relative rounded-lg border border-iron/30 bg-card/40 p-4 text-left transition-all hover:border-gold/40 hover:shadow-glow-sm texture-leather"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-['IM_Fell_English'] text-sm font-semibold text-foreground line-clamp-1">
                {enc.name}
              </h3>
              <button
                type="button"
                onClick={(e) => handleDelete(e, enc._id)}
                className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-blood hover:bg-blood/10 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {enc.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{enc.description}</p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${DIFFICULTY_STYLES[enc.difficulty]}`}>
                {enc.difficulty}
              </span>
              <span className={`rounded-md px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${STATUS_STYLES[enc.status]}`}>
                {enc.status}
              </span>
              {enc.npcs.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {enc.npcs.reduce((sum, n) => sum + n.count, 0)} creatures
                </span>
              )}
              {enc.tokens.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {enc.tokens.length} tokens
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }
}
