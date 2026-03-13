import { useState } from 'react';
import { BarChart3, Plus, X } from 'lucide-react';

interface FateCoreSkillsPanelProps {
  skills: Record<string, number>; // e.g. { Fight: 4, Shoot: 3, Athletics: 3, ... }
  onUpdate?: (skill: string, rating: number) => void;
  editable?: boolean;
  pyramidWarnings?: string[];
}

const RATING_LABELS: Record<number, string> = {
  5: 'Superb',
  4: 'Great',
  3: 'Good',
  2: 'Fair',
  1: 'Average',
};

const TIERS = [5, 4, 3, 2, 1] as const;

export function FateCoreSkillsPanel({
  skills,
  onUpdate,
  editable = false,
  pyramidWarnings,
}: FateCoreSkillsPanelProps) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRating, setNewSkillRating] = useState(1);

  // Group skills by rating
  const skillsByRating: Record<number, string[]> = {};
  for (const tier of TIERS) {
    skillsByRating[tier] = [];
  }
  for (const [name, rating] of Object.entries(skills)) {
    if (rating >= 1 && rating <= 5) {
      skillsByRating[rating].push(name);
    }
  }

  function handleRemove(skill: string) {
    onUpdate?.(skill, 0);
  }

  function handleAddToTier(tier: number) {
    const name = prompt(`Add skill at +${tier} (${RATING_LABELS[tier]}):`);
    if (name?.trim()) {
      onUpdate?.(name.trim(), tier);
    }
  }

  function handleAddNew() {
    if (!newSkillName.trim()) return;
    onUpdate?.(newSkillName.trim(), newSkillRating);
    setNewSkillName('');
  }

  // Check if any tier has skills to display
  const hasAnySkills = TIERS.some((t) => skillsByRating[t].length > 0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Fate Skills
        </p>
      </div>

      <div className="space-y-1.5">
        {TIERS.map((tier) => {
          const tierSkills = skillsByRating[tier];
          if (!editable && tierSkills.length === 0) return null;

          return (
            <div
              key={tier}
              className="flex items-center gap-3 rounded-sm border border-border bg-muted/30 px-3 py-1.5"
            >
              {/* Rating label */}
              <div className="flex w-24 shrink-0 items-baseline gap-1.5">
                <span className="font-[Cinzel] text-xs font-bold text-foreground">
                  +{tier}
                </span>
                <span className="font-[Cinzel] text-[10px] text-muted-foreground">
                  {RATING_LABELS[tier]}
                </span>
              </div>

              {/* Skill tags */}
              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                {tierSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-2 py-0.5 text-xs text-foreground"
                  >
                    {skill}
                    {editable && (
                      <button
                        type="button"
                        onClick={() => handleRemove(skill)}
                        className="ml-0.5 text-muted-foreground hover:text-red-400 transition-colors"
                        title={`Remove ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}

                {editable && (
                  <button
                    type="button"
                    onClick={() => handleAddToTier(tier)}
                    className="inline-flex items-center gap-0.5 rounded-sm border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                    title={`Add skill at +${tier}`}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                )}

                {!editable && tierSkills.length === 0 && (
                  <span className="text-xs italic text-muted-foreground/50">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hasAnySkills && !editable && (
        <p className="mt-2 text-xs italic text-muted-foreground">No skills assigned.</p>
      )}

      {/* Add new skill input */}
      {editable && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
            placeholder="New skill…"
            className="h-7 flex-1 rounded-sm border border-border bg-card px-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-brass/40"
          />
          <select
            value={newSkillRating}
            onChange={(e) => setNewSkillRating(Number(e.target.value))}
            className="h-7 rounded-sm border border-border bg-card px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brass/40"
          >
            {TIERS.map((tier) => (
              <option key={tier} value={tier}>
                +{tier} {RATING_LABELS[tier]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddNew}
            disabled={!newSkillName.trim()}
            className="flex h-7 items-center gap-1 rounded-sm border border-brass/40 bg-brass/10 px-2 text-xs text-brass hover:bg-brass/20 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
      )}

      {/* Pyramid warnings */}
      {pyramidWarnings && pyramidWarnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {pyramidWarnings.map((warning, i) => (
            <p key={i} className="text-xs text-amber-400">
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
