import { useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateCharacter } from '@/hooks/useCharacters';
import type { Character } from '@/types/campaign';

interface ExperiencesPanelProps {
  character: Character;
  canEdit: boolean;
}

export function ExperiencesPanel({ character, canEdit }: ExperiencesPanelProps) {
  const experiences: string[] = (character.mechanicData?.experiences as string[]) ?? [];
  const updateCharacter = useUpdateCharacter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const save = useCallback(
    (next: string[]) => {
      updateCharacter.mutate(
        {
          id: character._id,
          campaignId: character.campaignId,
          data: {
            mechanicData: { ...character.mechanicData, experiences: next },
          },
        },
        { onError: () => toast.error('Failed to update experiences') },
      );
    },
    [updateCharacter, character._id, character.campaignId, character.mechanicData],
  );

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (experiences.includes(trimmed)) {
      toast.warning('Experience already exists');
      return;
    }
    save([...experiences, trimmed]);
    setDraft('');
    setAdding(false);
  }

  function handleRemove(exp: string) {
    save(experiences.filter((e) => e !== exp));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Experiences
        </p>
        {canEdit && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Sailing the Sapphire Sea"
            className="flex-1 rounded border border-border bg-input px-2 py-1 text-sm text-foreground input-carved"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!draft.trim()}
            className="rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/30 disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setDraft(''); }}
            className="rounded p-1 text-muted-foreground hover:bg-muted/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {experiences.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No experiences yet. Experiences give +2 to relevant rolls.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {experiences.map((exp) => (
            <span
              key={exp}
              className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {exp}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleRemove(exp)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground">
        When a relevant experience applies to a roll, add +2 to the result.
      </p>
    </div>
  );
}
