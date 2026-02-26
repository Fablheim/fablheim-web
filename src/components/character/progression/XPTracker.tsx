import { useState, useEffect, useRef } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LevelBadge } from './LevelBadge';
import { XPAwardForm } from './XPAwardForm';
import { useProgression, useAwardXP, useSetLevel } from '@/hooks/useProgression';

interface XPTrackerProps {
  characterId: string;
  isDM: boolean;
}

export function XPTracker({ characterId, isDM }: XPTrackerProps) {
  const { data: progression, isLoading } = useProgression(characterId);
  const awardXP = useAwardXP();
  const setLevel = useSetLevel();

  const [showAwardForm, setShowAwardForm] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [levelUpGlow, setLevelUpGlow] = useState(false);
  const prevLevelRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!progression) return;
    if (prevLevelRef.current != null && progression.level > prevLevelRef.current) {
      setLevelUpGlow(true);
      const timer = setTimeout(() => setLevelUpGlow(false), 2000);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = progression.level;
  }, [progression?.level]);

  function handleAwardXP(amount: number, reason?: string) {
    awardXP.mutate(
      { characterId, payload: { amount, reason } },
      { onSuccess: () => setShowAwardForm(false) },
    );
  }

  function handleSetLevel(level: number) {
    setLevel.mutate({ characterId, level });
    setShowLevelSelect(false);
  }

  if (isLoading || !progression) {
    return (
      <div className="rounded-sm border border-[hsla(38,50%,30%,0.15)] bg-[hsl(24,18%,9%)] p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-20 rounded bg-muted/30" />
          <div className="h-4 w-full rounded bg-muted/30" />
        </div>
      </div>
    );
  }

  const xpDisplay = progression.xp.toLocaleString();
  const xpNextDisplay = progression.xpForNextLevel.toLocaleString();
  const progressPercent = Math.round(progression.xpProgress * 100);

  return (
    <div
      className={`rounded-sm border border-[hsla(38,50%,30%,0.15)] bg-[hsl(24,18%,9%)] p-4 transition-shadow duration-500 ${
        levelUpGlow ? 'shadow-[0_0_30px_hsla(45,100%,50%,0.3)]' : ''
      }`}
    >
      {renderHeader(progression, levelUpGlow)}
      {renderProgressBar(progression, progressPercent)}
      {renderXPText(xpDisplay, xpNextDisplay, progression.isMaxLevel)}
      {renderDMControls(isDM, showAwardForm, showLevelSelect, awardXP, handleAwardXP, handleSetLevel, setShowAwardForm, setShowLevelSelect, progression.level)}
    </div>
  );
}

function renderHeader(
  progression: { level: number; proficiencyBonus: number },
  levelUpGlow: boolean,
) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className={`flex items-center gap-2 transition-all duration-500 ${levelUpGlow ? 'scale-110' : ''}`}>
        <span className="font-[Cinzel] text-2xl font-bold text-amber-200 drop-shadow-[0_0_8px_hsla(45,100%,50%,0.3)]">
          Level {progression.level}
        </span>
        {levelUpGlow && <Star className="h-5 w-5 text-amber-400 animate-pulse" />}
      </div>
      <LevelBadge level={progression.level} proficiencyBonus={progression.proficiencyBonus} size="sm" />
    </div>
  );
}

function renderProgressBar(
  progression: { xpProgress: number; isMaxLevel: boolean },
  progressPercent: number,
) {
  return (
    <div className="mb-2">
      <div className="relative h-5 w-full overflow-hidden rounded-sm bg-muted/30 border border-[hsla(38,50%,30%,0.1)]">
        <div
          className="absolute inset-y-0 left-0 rounded-sm bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-500"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs font-medium text-parchment drop-shadow">
            {progression.isMaxLevel ? 'MAX LEVEL' : `${progressPercent}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

function renderXPText(xpDisplay: string, xpNextDisplay: string, isMaxLevel: boolean) {
  return (
    <div className="mb-3 text-center">
      <span className="font-mono text-sm text-muted-foreground">
        {isMaxLevel
          ? `${xpDisplay} XP (Max Level)`
          : `${xpDisplay} / ${xpNextDisplay} XP`}
      </span>
    </div>
  );
}

function renderDMControls(
  isDM: boolean,
  showAwardForm: boolean,
  showLevelSelect: boolean,
  awardXP: { isPending: boolean },
  handleAwardXP: (amount: number, reason?: string) => void,
  handleSetLevel: (level: number) => void,
  setShowAwardForm: (v: boolean) => void,
  setShowLevelSelect: (v: boolean) => void,
  currentLevel: number,
) {
  if (!isDM) return null;

  return (
    <div className="space-y-2 border-t border-[hsla(38,50%,30%,0.1)] pt-3">
      {showAwardForm ? (
        <XPAwardForm
          onSubmit={handleAwardXP}
          onCancel={() => setShowAwardForm(false)}
          isLoading={awardXP.isPending}
        />
      ) : (
        renderDMButtons(setShowAwardForm, showLevelSelect, setShowLevelSelect, handleSetLevel, currentLevel)
      )}
    </div>
  );
}

function renderDMButtons(
  setShowAwardForm: (v: boolean) => void,
  showLevelSelect: boolean,
  setShowLevelSelect: (v: boolean) => void,
  handleSetLevel: (level: number) => void,
  currentLevel: number,
) {
  return (
    <div className="flex gap-2">
      <Button variant="primary" size="sm" onClick={() => setShowAwardForm(true)}>
        Award XP
      </Button>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLevelSelect(!showLevelSelect)}
        >
          Set Level
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
        {showLevelSelect && renderLevelDropdown(handleSetLevel, setShowLevelSelect, currentLevel)}
      </div>
    </div>
  );
}

function renderLevelDropdown(
  handleSetLevel: (level: number) => void,
  setShowLevelSelect: (v: boolean) => void,
  currentLevel: number,
) {
  return (
    <div className="absolute top-full left-0 z-10 mt-1 max-h-48 w-20 overflow-y-auto rounded-sm border border-border bg-[hsl(24,18%,9%)] shadow-lg">
      {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => (
        <button
          key={level}
          onClick={() => {
            handleSetLevel(level);
            setShowLevelSelect(false);
          }}
          className={`block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/50 ${
            level === currentLevel
              ? 'font-bold text-amber-300'
              : 'text-foreground'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
