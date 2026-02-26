import { useState } from 'react';
import { Shield, Zap, Footprints, Swords, Dice5 } from 'lucide-react';
import type { Character, CharacterAttack, AttackRollResult } from '@/types/campaign';
import type { CombatConfig } from '@/types/system';

interface CombatStatsProps {
  character: Character;
  onRollAttack?: (attackId: string) => Promise<AttackRollResult>;
  editable?: boolean;
  combatConfig?: CombatConfig;
}

function formatModifier(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

export function CombatStats({ character, onRollAttack, editable = false, combatConfig }: CombatStatsProps) {
  const { ac, speed, initiativeBonus, attacks, conditions } = character;

  const showAC = combatConfig ? !!combatConfig.ac : true;
  const showInitiative = combatConfig ? combatConfig.initiative : true;
  const showSpeed = combatConfig ? combatConfig.speed : true;
  const showAttacks = combatConfig ? combatConfig.attacks : true;
  const acLabel = combatConfig?.ac && typeof combatConfig.ac === 'object' ? combatConfig.ac.label : 'AC';

  const statBlocks = [
    showAC && { icon: <Shield className="h-4 w-4" />, label: acLabel, value: String(ac) },
    showInitiative && { icon: <Zap className="h-4 w-4" />, label: 'Initiative', value: formatModifier(initiativeBonus) },
    showSpeed && { icon: <Footprints className="h-4 w-4" />, label: 'Speed', value: `${speed} ft` },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div className="space-y-4">
      {/* AC / Initiative / Speed Row */}
      {statBlocks.length > 0 && (
        <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${statBlocks.length}, minmax(0, 1fr))` }}>
          {statBlocks.map((sb) => (
            <StatBlock key={sb.label} icon={sb.icon} label={sb.label} value={sb.value} />
          ))}
        </div>
      )}

      {/* Conditions */}
      {conditions.length > 0 && (
        <div>
          <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Conditions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {conditions.map((condition) => (
              <span
                key={condition}
                className="rounded-sm border border-amber-800/40 bg-amber-950/30 px-2 py-0.5 text-xs text-amber-300"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Attacks */}
      {showAttacks && attacks.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
              Attacks
            </p>
          </div>
          <div className="space-y-1.5">
            {attacks.map((attack) => (
              <AttackRow
                key={attack.id}
                attack={attack}
                onRoll={editable && onRollAttack ? () => onRollAttack(attack.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-md bg-card p-3 texture-leather">
      <div className="mb-1 text-muted-foreground">{icon}</div>
      <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}

function AttackRow({
  attack,
  onRoll,
}: {
  attack: CharacterAttack;
  onRoll?: () => Promise<AttackRollResult>;
}) {
  const [result, setResult] = useState<AttackRollResult | null>(null);
  const [rolling, setRolling] = useState(false);

  async function handleRoll() {
    if (!onRoll || rolling) return;
    setRolling(true);
    setResult(null);
    try {
      const res = await onRoll();
      setResult(res);
    } finally {
      setRolling(false);
    }
  }

  return (
    <div className="rounded-sm border border-border bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 flex-1">
          {onRoll && (
            <button
              type="button"
              onClick={handleRoll}
              disabled={rolling}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-brass/40 bg-brass/10 text-brass hover:bg-brass/20 disabled:opacity-50 transition-colors"
              title={`Roll ${attack.name}`}
            >
              <Dice5 className={`h-4 w-4 ${rolling ? 'animate-spin' : ''}`} />
            </button>
          )}
          <span className="text-sm font-medium text-foreground">{attack.name}</span>
          {attack.range && (
            <span className="text-xs text-muted-foreground">{attack.range}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            {formatModifier(attack.attackBonus)} to hit
          </span>
          <span className="text-muted-foreground">
            {attack.damageDice}
            {attack.damageBonus !== 0 && formatModifier(attack.damageBonus)}{' '}
            {attack.damageType}
          </span>
        </div>
      </div>

      {/* Roll Result */}
      {result && (
        <div className="border-t border-border/50 bg-card/50 px-3 py-2">
          <AttackRollDisplay result={result} />
        </div>
      )}
    </div>
  );
}

function AttackRollDisplay({ result }: { result: AttackRollResult }) {
  const critClass = result.isCritical
    ? 'text-emerald-400'
    : result.isCriticalFail
      ? 'text-red-400'
      : 'text-foreground';

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Attack:</span>
        <span className={`font-bold ${critClass}`}>
          [{result.attackRoll}] = {result.attackTotal}
        </span>
        {result.isCritical && (
          <span className="rounded-sm bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
            Crit!
          </span>
        )}
        {result.isCriticalFail && (
          <span className="rounded-sm bg-red-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
            Miss!
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Damage:</span>
        <span className="font-bold text-foreground">
          [{result.damageRolls.join(', ')}] = {result.damageTotal} {result.damageType}
        </span>
      </div>
    </div>
  );
}
