import { useCallback } from 'react';
import { Shield, Heart, Eye, Sparkle, Flame } from 'lucide-react';
import { useCharacters, useUpdateCharacter } from '@/hooks/useCharacters';
import { useInitiative } from '@/hooks/useLiveSession';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';
import type { Character } from '@/types/campaign';
import type { InitiativeEntry } from '@/types/live-session';

const EXHAUSTION_EFFECTS = [
  '',
  'Disadvantage on ability checks',
  'Speed halved',
  'Disadvantage on attacks & saves',
  'HP max halved',
  'Speed reduced to 0',
  'Death',
];

interface PartyOverviewProps {
  campaignId: string;
}

function StatBadge({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-1 rounded-sm border border-iron/30 bg-accent/40 px-1.5 py-0.5">
      <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-[Cinzel] text-xs font-bold text-foreground">{value}</span>
    </div>
  );
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  let barColor = 'bg-green-500';
  if (pct < 25) barColor = 'bg-red-500';
  else if (pct < 50) barColor = 'bg-yellow-500';

  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between font-[Cinzel] text-[9px] tracking-wider text-muted-foreground mb-0.5">
        <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5" /> HP</span>
        <span>{current}/{max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ExhaustionPips({ level, onChange }: { level: number; onChange: (n: number) => void }) {
  return (
    <div className="mt-1.5 flex items-center gap-1" title={level > 0 ? `Exhaustion ${level}: ${EXHAUSTION_EFFECTS[level]}` : 'No exhaustion'}>
      <Flame className={`h-3 w-3 ${level > 0 ? 'text-orange-400' : 'text-muted-foreground/40'}`} />
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(level === i ? i - 1 : i)}
            className={`h-2.5 w-2.5 rounded-full border transition-colors ${
              i <= level
                ? i >= 5 ? 'border-red-500 bg-red-500/60' : 'border-orange-400 bg-orange-400/50'
                : 'border-border bg-muted/30 hover:border-orange-400/50'
            }`}
            title={`Level ${i}: ${EXHAUSTION_EFFECTS[i]}`}
          />
        ))}
      </div>
      {level > 0 && (
        <span className="text-[9px] text-orange-400 font-[Cinzel]">{level}</span>
      )}
    </div>
  );
}

function PartyMemberCard({
  character,
  initiativeEntry,
  onToggleInspiration,
  onExhaustionChange,
  showExhaustion,
  showPassiveScores,
}: {
  character: Character;
  initiativeEntry?: InitiativeEntry;
  onToggleInspiration: () => void;
  onExhaustionChange: (level: number) => void;
  showExhaustion: boolean;
  showPassiveScores: boolean;
}) {
  const hasInspiration = !!character.mechanicData?.hasInspiration;
  // Prefer initiative entry values during combat, fall back to character data
  const hp = initiativeEntry?.currentHp ?? character.hp?.current;
  const maxHp = initiativeEntry?.maxHp ?? character.hp?.max;
  const ac = initiativeEntry?.ac ?? character.ac;
  // Normalize conditions: initiative uses ConditionEntry[], character uses string[]
  const conditionNames: string[] = initiativeEntry?.conditions
    ? initiativeEntry.conditions.map((c) => c.name)
    : character.conditions ?? [];

  return (
    <div className="rounded-md border border-iron/30 bg-accent/20 texture-parchment p-3 hover:border-gold/30 hover:shadow-glow-sm transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-[Cinzel] text-sm font-medium text-foreground truncate">{character.name}</p>
          <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic truncate">
            {[character.race, character.class, character.level ? `Lvl ${character.level}` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleInspiration}
            title={hasInspiration ? 'Remove Inspiration' : 'Grant Inspiration'}
            className={`rounded p-0.5 transition-colors ${hasInspiration ? 'text-yellow-400 hover:text-yellow-300' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
          >
            <Sparkle className={`h-3.5 w-3.5 ${hasInspiration ? 'fill-yellow-400' : ''}`} />
          </button>
          {ac != null && (
            <StatBadge label="" value={`${ac}`} />
          )}
          {ac != null && (
            <Shield className="h-3 w-3 text-muted-foreground -ml-1 mr-0.5" />
          )}
        </div>
      </div>

      {hp != null && maxHp != null && <HpBar current={hp} max={maxHp} />}

      {/* Passive scores — iterate dynamically (gated on passive-scores-dnd5e module) */}
      {showPassiveScores && character.passiveScores && Object.keys(character.passiveScores).length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {Object.entries(character.passiveScores).map(([key, val], idx) => (
            <div key={key} className="flex items-center gap-0.5" title={key}>
              {idx === 0 ? (
                <Eye className="h-3 w-3 text-muted-foreground" />
              ) : (
                <span className="font-[Cinzel] text-[10px] text-muted-foreground uppercase">{key.slice(0, 3)}</span>
              )}
              <span className="font-[Cinzel] text-[10px] text-foreground">{val as number}</span>
            </div>
          ))}
        </div>
      )}

      {conditionNames.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {conditionNames.map((c) => (
            <span key={c} className="rounded-full bg-arcane/20 px-1.5 py-0.5 text-[10px] text-arcane">
              {c}
            </span>
          ))}
        </div>
      )}

      {showExhaustion && (
        <ExhaustionPips level={character.exhaustionLevel ?? 0} onChange={onExhaustionChange} />
      )}
    </div>
  );
}

export function PartyOverview({ campaignId }: PartyOverviewProps) {
  const { data: characters, isLoading: charsLoading } = useCharacters(campaignId);
  const { data: initiative } = useInitiative(campaignId);
  const updateCharacter = useUpdateCharacter();
  const showExhaustion = useCampaignModuleEnabled(campaignId, 'exhaustion-dnd5e');
  const showPassiveScores = useCampaignModuleEnabled(campaignId, 'passive-scores-dnd5e');

  const pcEntries = initiative?.entries.filter((e) => e.type === 'pc') ?? [];

  const setExhaustion = useCallback(
    (char: Character, level: number) => {
      updateCharacter.mutate({
        id: char._id,
        campaignId,
        data: { exhaustionLevel: level },
      });
    },
    [updateCharacter, campaignId],
  );

  const toggleInspiration = useCallback(
    (char: Character) => {
      const current = !!char.mechanicData?.hasInspiration;
      updateCharacter.mutate({
        id: char._id,
        campaignId,
        data: {
          mechanicData: { ...char.mechanicData, hasInspiration: !current },
        },
      });
    },
    [updateCharacter, campaignId],
  );

  if (charsLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase">
          Party
        </h3>
        <div className="animate-pulse space-y-2">
          <div className="h-16 rounded-md bg-muted" />
          <div className="h-16 rounded-md bg-muted" />
        </div>
      </div>
    );
  }

  const partyCharacters = characters ?? [];

  return (
    <div className="space-y-2">
      <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase">
        Party ({partyCharacters.length})
      </h3>
      {partyCharacters.length === 0 ? (
        <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic">
          No characters in this campaign.
        </p>
      ) : (
        <div className="space-y-2">
          {partyCharacters.map((char) => {
            const entry = pcEntries.find(
              (e) => e.characterId === char._id || e.name === char.name,
            );
            return (
              <PartyMemberCard
                key={char._id}
                character={char}
                initiativeEntry={entry}
                onToggleInspiration={() => toggleInspiration(char)}
                onExhaustionChange={(level) => setExhaustion(char, level)}
                showExhaustion={showExhaustion}
                showPassiveScores={showPassiveScores}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
