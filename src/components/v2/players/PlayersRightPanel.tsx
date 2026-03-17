import { usePlayersContext } from './PlayersContext';
import { formatCharacterClass } from '@/lib/character-utils';
import type { Character } from '@/types/campaign';

function getHealthRatio(character: Character) {
  if (!character.hp.max) return 1;
  return character.hp.current / character.hp.max;
}

function buildHpLabel(character: Character) {
  const temp = character.hp.temp ? ` +${character.hp.temp}` : '';
  return `${character.hp.current}/${character.hp.max}${temp}`;
}

function buildSubtitle(character: Character) {
  const classStr = formatCharacterClass(character);
  const parts = [character.race, classStr].filter(Boolean);
  const identity = parts.join(' · ');
  return identity ? `${identity} · Lv ${character.level}` : `Level ${character.level}`;
}

function buildStateLabel(character: Character) {
  if (character.hp.current <= 0) return 'Down';
  if (character.exhaustionLevel >= 3) return 'Spent';
  if (getHealthRatio(character) <= 0.25) return 'Critical';
  if (getHealthRatio(character) <= 0.5) return 'Wounded';
  if (character.conditions.length > 0) return 'Pressed';
  return 'Steady';
}

function buildStateTone(character: Character) {
  if (character.hp.current <= 0) return 'text-[hsl(0,80%,74%)]';
  if (getHealthRatio(character) <= 0.25 || character.exhaustionLevel >= 3) {
    return 'text-[hsl(12,86%,72%)]';
  }
  if (getHealthRatio(character) <= 0.5 || character.conditions.length > 0) {
    return 'text-[hsl(38,82%,63%)]';
  }
  return 'text-[hsl(150,62%,70%)]';
}

function getHpFillClass(character: Character) {
  const ratio = getHealthRatio(character);
  if (ratio <= 0.25) return 'bg-[hsl(0,72%,52%)]';
  if (ratio <= 0.5) return 'bg-[hsl(20,80%,58%)]';
  return 'bg-[hsl(150,56%,48%)]';
}

export function PlayersRightPanel() {
  const { party, resolvedSelectedCharacterId, setSelectedCharacterId } = usePlayersContext();

  const partySize = party.length;
  const woundedCount = party.filter((c) => getHealthRatio(c) <= 0.5).length;
  const summaryLine = woundedCount > 0
    ? `${woundedCount} wounded of ${partySize}`
    : `${partySize} adventurer${partySize === 1 ? '' : 's'} ready`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {renderHeader()}
      {renderList()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          {renderHeaderPills()}
        </div>
        <p className="mt-1.5 text-[10px] text-[hsl(30,12%,52%)]">{summaryLine}</p>
      </div>
    );
  }

  function renderHeaderPills() {
    const steadyCount = party.filter((c) => getHealthRatio(c) > 0.5 && c.hp.current > 0).length;
    const downCount = party.filter((c) => c.hp.current <= 0).length;
    return (
      <div className="flex gap-2">
        {renderCountPill(String(steadyCount), 'Steady', 'text-[hsl(150,62%,70%)]')}
        {renderCountPill(String(woundedCount), 'Wounded', 'text-[hsl(38,82%,63%)]')}
        {renderCountPill(String(downCount), 'Down', 'text-[hsl(0,80%,74%)]')}
      </div>
    );
  }

  function renderCountPill(value: string, label: string, tone: string) {
    return (
      <div className="rounded-full border border-[hsla(32,24%,24%,0.38)] bg-[hsla(24,18%,9%,0.54)] px-2 py-1 text-center">
        <p className={`text-[11px] font-medium ${tone}`}>{value}</p>
        <p className="text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">{label}</p>
      </div>
    );
  }

  function renderList() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {party.length === 0 ? renderEmpty() : renderCharacters()}
      </div>
    );
  }

  function renderEmpty() {
    return (
      <p className="px-3 py-4 text-xs text-[hsl(30,12%,58%)]">
        No characters in the party yet.
      </p>
    );
  }

  function renderCharacters() {
    return (
      <div className="space-y-1.5">
        {party.map((character) => renderCharacterButton(character))}
      </div>
    );
  }

  function renderCharacterButton(character: Character) {
    const isSelected = resolvedSelectedCharacterId === character._id;
    const ratio = getHealthRatio(character);
    const percent = Math.max(0, Math.min(100, ratio * 100));
    return (
      <button
        key={character._id}
        type="button"
        onClick={() => setSelectedCharacterId(character._id)}
        className={`block w-full rounded-[12px] border px-2.5 py-2 text-left transition ${
          isSelected
            ? 'border-[hsla(42,72%,52%,0.36)] bg-[hsla(42,72%,42%,0.14)]'
            : 'border-[hsla(32,26%,26%,0.35)] bg-[hsla(26,16%,12%,0.6)] hover:border-[hsla(38,50%,58%,0.3)]'
        }`}
      >
        {renderCharacterTop(character)}
        {renderCharacterHpBar(character, percent)}
        {renderCharacterFooter(character)}
      </button>
    );
  }

  function renderCharacterTop(character: Character) {
    return (
      <div className="flex items-start gap-2">
        {renderAvatar(character)}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <p className="truncate text-xs text-[hsl(35,24%,90%)]">{character.name}</p>
            <span className={`shrink-0 text-[9px] font-medium ${buildStateTone(character)}`}>
              {buildStateLabel(character)}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[hsl(30,12%,52%)]">{buildSubtitle(character)}</p>
        </div>
      </div>
    );
  }

  function renderAvatar(character: Character) {
    if (character.portrait?.url) {
      return (
        <img
          src={character.portrait.url}
          alt={`${character.name} portrait`}
          className="h-9 w-9 shrink-0 rounded-lg border border-[hsla(32,24%,30%,0.3)] object-cover"
        />
      );
    }
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[hsla(32,24%,30%,0.3)] bg-[hsla(38,70%,46%,0.08)] text-[hsl(38,82%,63%)]">
        <span className="text-[13px]" style={{ fontFamily: "'Cinzel', serif" }}>
          {character.name.slice(0, 1).toUpperCase()}
        </span>
      </div>
    );
  }

  function renderCharacterHpBar(character: Character, percent: number) {
    return (
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsla(24,14%,16%,0.9)]">
        <div
          className={`h-full rounded-full transition-all ${getHpFillClass(character)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  }

  function renderCharacterFooter(character: Character) {
    return (
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-[hsl(30,12%,48%)]">
        <span>HP {buildHpLabel(character)}</span>
        <span>AC {character.ac}</span>
      </div>
    );
  }
}
