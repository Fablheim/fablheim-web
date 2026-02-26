import { useState } from 'react';
import { Heart, Shield, Skull } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Character } from '@/types/campaign';

interface HPTrackerProps {
  character: Character;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onTempHP: (amount: number) => void;
  onDeathSave: (result: 'success' | 'failure') => void;
  editable?: boolean;
  showDeathSaves?: boolean;
}

export function HPTracker({
  character,
  onDamage,
  onHeal,
  onTempHP,
  onDeathSave,
  editable = true,
  showDeathSaves = true,
}: HPTrackerProps) {
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [tempHPInput, setTempHPInput] = useState('');

  const { hp, deathSaves } = character;
  const hpPercentage = hp.max > 0 ? (hp.current / hp.max) * 100 : 0;

  function handleDamage() {
    const amount = parseInt(damageInput);
    if (isNaN(amount) || amount <= 0) return;
    onDamage(amount);
    setDamageInput('');
  }

  function handleHeal() {
    const amount = parseInt(healInput);
    if (isNaN(amount) || amount <= 0) return;
    onHeal(amount);
    setHealInput('');
  }

  function handleTempHP() {
    const amount = parseInt(tempHPInput);
    if (isNaN(amount) || amount <= 0) return;
    onTempHP(amount);
    setTempHPInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent, action: () => void) {
    if (e.key === 'Enter') action();
  }

  const barColor =
    hpPercentage > 50
      ? 'bg-emerald-600'
      : hpPercentage > 25
        ? 'bg-amber-500'
        : 'bg-red-600';

  return (
    <div className="space-y-3">
      {/* HP Bar */}
      <div className="relative h-8 w-full overflow-hidden rounded-sm bg-muted/50 border border-border">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, hpPercentage)}%` }}
        />
        {hp.temp > 0 && (
          <div
            className="absolute inset-y-0 bg-cyan-500/40 border-r-2 border-cyan-400"
            style={{
              left: `${Math.min(100, hpPercentage)}%`,
              width: `${Math.min(100 - hpPercentage, (hp.temp / hp.max) * 100)}%`,
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5">
          <Heart className="h-4 w-4 text-parchment drop-shadow" />
          <span className="font-[Cinzel] text-sm font-bold text-parchment drop-shadow">
            {hp.current} / {hp.max}
          </span>
          {hp.temp > 0 && (
            <span className="font-[Cinzel] text-xs text-cyan-300 drop-shadow">
              (+{hp.temp})
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      {editable && (
        <div className="space-y-2">
          {/* Damage / Heal Row */}
          <div className="flex gap-2">
            <div className="flex flex-1 gap-1">
              <input
                type="number"
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleDamage)}
                placeholder="Dmg"
                min="1"
                className="w-16 rounded-sm border border-border bg-muted/50 px-2 py-1.5 text-center text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:outline-none"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDamage}
                disabled={!damageInput}
              >
                Damage
              </Button>
            </div>
            <div className="flex flex-1 gap-1">
              <input
                type="number"
                value={healInput}
                onChange={(e) => setHealInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleHeal)}
                placeholder="Heal"
                min="1"
                className="w-16 rounded-sm border border-border bg-muted/50 px-2 py-1.5 text-center text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleHeal}
                disabled={!healInput}
              >
                Heal
              </Button>
            </div>
          </div>

          {/* Temp HP Row */}
          <div className="flex gap-1">
            <input
              type="number"
              value={tempHPInput}
              onChange={(e) => setTempHPInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleTempHP)}
              placeholder="Temp HP"
              min="1"
              className="w-20 rounded-sm border border-border bg-muted/50 px-2 py-1.5 text-center text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleTempHP}
              disabled={!tempHPInput}
            >
              <Shield className="mr-1 h-3 w-3" />
              Temp HP
            </Button>
          </div>

          {/* Quick Adjust */}
          <div className="flex items-center justify-center gap-1">
            {[-5, -1, 1, 5].map((delta) => (
              <button
                key={delta}
                onClick={() => (delta < 0 ? onDamage(Math.abs(delta)) : onHeal(delta))}
                className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                  delta < 0
                    ? 'border-red-800/40 text-red-400 hover:bg-red-950/30'
                    : 'border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/30'
                }`}
              >
                {delta > 0 ? '+' : ''}{delta}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Death Saves */}
      {showDeathSaves && hp.current === 0 && deathSaves && (
        <div className="rounded-sm border border-red-900/50 bg-red-950/20 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Skull className="h-4 w-4 text-red-400" />
            <span className="font-[Cinzel] text-xs uppercase tracking-wider text-red-400">
              Death Saves
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-16">Successes</span>
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={`s-${i}`}
                    className={`inline-block h-3.5 w-3.5 rounded-full border ${
                      i < deathSaves.successes
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-16">Failures</span>
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={`f-${i}`}
                    className={`inline-block h-3.5 w-3.5 rounded-full border ${
                      i < deathSaves.failures
                        ? 'border-red-500 bg-red-500'
                        : 'border-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
            </div>
            {editable && deathSaves.successes < 3 && deathSaves.failures < 3 && (
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => onDeathSave('success')}>
                  Save
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDeathSave('failure')}>
                  Fail
                </Button>
              </div>
            )}
          </div>
          {deathSaves.successes >= 3 && (
            <p className="mt-2 text-xs font-medium text-emerald-400">Stabilized</p>
          )}
          {deathSaves.failures >= 3 && (
            <p className="mt-2 text-xs font-medium text-red-400">Dead</p>
          )}
        </div>
      )}
    </div>
  );
}
