import { useCharacters } from '@/hooks/useCharacters';
import { useInitiative } from '@/hooks/useLiveSession';

interface PartyStatusPanelProps {
  campaignId: string;
}

export function PartyStatusPanel({ campaignId }: PartyStatusPanelProps) {
  const { data: characters, isLoading } = useCharacters(campaignId);
  const { data: initiative } = useInitiative(campaignId);

  if (isLoading) {
    return (
      <div className="space-y-1.5 animate-pulse p-2">
        <div className="h-14 rounded bg-muted/60" />
        <div className="h-14 rounded bg-muted/60" />
        <div className="h-14 rounded bg-muted/60" />
      </div>
    );
  }

  const party = characters ?? [];
  if (party.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground italic font-['IM_Fell_English']">
          No characters in campaign.
        </p>
      </div>
    );
  }

  const isCombatActive = !!initiative?.isActive;
  const entries = initiative?.entries ?? [];

  // Build party rows with initiative matching
  const rows = party.map((character) => {
    const entry = entries.find(
      (e) => e.characterId === character._id || e.name === character.name,
    );
    const hp = entry?.currentHp ?? character.hp?.current ?? 0;
    const maxHp = entry?.maxHp ?? character.hp?.max ?? 1;
    const tempHp = entry?.tempHp ?? character.hp?.temp ?? 0;
    const conditions: string[] = entry?.conditions
      ? entry.conditions.map((c) => c.name)
      : character.conditions ?? [];
    const deathSaves = entry?.deathSaves ?? null;
    const isDowned = hp <= 0;
    const turnOrder = isCombatActive
      ? entries.findIndex(
          (e) => e.characterId === character._id || e.name === character.name,
        )
      : -1;

    return {
      id: character._id,
      name: character.name,
      className: character.class ?? '',
      level: character.level ?? 0,
      hp,
      maxHp,
      tempHp,
      conditions,
      deathSaves,
      isDowned,
      turnOrder,
      entry,
    };
  });

  // Sort: by initiative order during combat, alphabetical otherwise
  const sorted = [...rows].sort((a, b) => {
    if (isCombatActive) {
      // Characters in initiative first (by turn order), then non-initiative alphabetical
      if (a.turnOrder >= 0 && b.turnOrder >= 0) return a.turnOrder - b.turnOrder;
      if (a.turnOrder >= 0) return -1;
      if (b.turnOrder >= 0) return 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-1.5 p-2">
      <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase px-1">
        Party Status
      </h3>
      {sorted.map((row) => renderRow(row))}
    </div>
  );

  function renderRow(row: (typeof rows)[number]) {
    const hpPercent = row.maxHp > 0 ? Math.max(0, Math.min(100, (row.hp / row.maxHp) * 100)) : 0;
    const barColor = row.isDowned
      ? 'bg-neutral-500'
      : hpPercent <= 25
        ? 'bg-red-500'
        : hpPercent <= 50
          ? 'bg-yellow-500'
          : 'bg-green-500';
    const isCurrentTurn =
      isCombatActive &&
      initiative &&
      row.turnOrder === initiative.currentTurn;

    return (
      <div
        key={row.id}
        className={`rounded border p-2 transition-colors ${
          isCurrentTurn
            ? 'border-primary/50 bg-primary/10'
            : 'border-border/60 bg-background/40'
        }`}
      >
        {renderNameRow(row, isCurrentTurn)}
        {renderHpBar(row, hpPercent, barColor)}
        {row.isDowned && row.deathSaves && renderDeathSaves(row.deathSaves)}
        {row.conditions.length > 0 && renderConditions(row.conditions)}
      </div>
    );
  }

  function renderNameRow(
    row: (typeof rows)[number],
    isCurrentTurn: boolean | undefined,
  ) {
    return (
      <div className="flex items-center gap-1.5">
        {isCombatActive && row.turnOrder >= 0 && (
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
              isCurrentTurn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {row.turnOrder + 1}
          </span>
        )}
        <span className="truncate text-sm font-medium text-foreground">
          {row.name}
        </span>
        {(row.className || row.level > 0) && (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {row.className}
            {row.level > 0 ? ` ${row.level}` : ''}
          </span>
        )}
      </div>
    );
  }

  function renderHpBar(
    row: (typeof rows)[number],
    hpPercent: number,
    barColor: string,
  ) {
    return (
      <>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            HP {row.hp}/{row.maxHp}
            {row.tempHp > 0 && (
              <span className="text-blue-400"> +{row.tempHp}</span>
            )}
          </span>
          {row.isDowned && (
            <span className="font-medium text-red-400">Unconscious</span>
          )}
        </div>
      </>
    );
  }

  function renderDeathSaves(saves: { successes: number; failures: number }) {
    return (
      <div className="mt-1 flex items-center gap-2 text-[10px]">
        <span className="text-muted-foreground">Death Saves:</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={`s${i}`}
              className={`inline-block h-2 w-2 rounded-full ${
                i < saves.successes ? 'bg-green-500' : 'bg-muted'
              }`}
            />
          ))}
        </span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={`f${i}`}
              className={`inline-block h-2 w-2 rounded-full ${
                i < saves.failures ? 'bg-red-500' : 'bg-muted'
              }`}
            />
          ))}
        </span>
      </div>
    );
  }

  function renderConditions(conditions: string[]) {
    return (
      <div className="mt-1 flex flex-wrap gap-0.5">
        {conditions.map((c) => (
          <span
            key={c}
            className="rounded-full bg-blood/15 px-1.5 py-0.5 text-[9px] font-medium text-[hsl(0,55%,60%)] font-[Cinzel] uppercase tracking-wider"
          >
            {c}
          </span>
        ))}
      </div>
    );
  }
}
