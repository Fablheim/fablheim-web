import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Command,
  CornerDownLeft,
  Search,
} from 'lucide-react';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import type { WorldEntity } from '@/types/campaign';
import { ENTITY_TYPE_CONFIG } from './world-config';
import type { WorldNavigation } from './WorldCenterStage';
import { formatWorldEntityContext } from './world-ui';

interface WorldCommandPaletteProps {
  campaignId: string;
  nav: WorldNavigation;
}

export function WorldCommandPalette({
  campaignId,
  nav,
}: WorldCommandPaletteProps) {
  const { data: entities } = useWorldEntities(campaignId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (open) closePalette();
        else openPalette();
      }
      if (event.key === 'Escape') {
        closePalette();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closePalette, open, openPalette]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
      setSelectedIndex(0);
    }, 140);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  const results = useMemo(() => {
    const source = entities ?? [];
    if (!debouncedQuery) {
      return source.slice(0, 12);
    }

    return source
      .filter((entity) => matchesQuery(entity, debouncedQuery))
      .sort((a, b) => scoreEntity(b, debouncedQuery) - scoreEntity(a, debouncedQuery))
      .slice(0, 16);
  }, [debouncedQuery, entities]);

  const handleSelect = useCallback((entity: WorldEntity) => {
    nav.goToDetail(entity._id);
    closePalette();
  }, [closePalette, nav]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((value) => Math.max(value - 1, 0));
      }
      if (event.key === 'Enter') {
        const selected = results[selectedIndex];
        if (!selected) return;
        event.preventDefault();
        handleSelect(selected);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSelect, open, results, selectedIndex]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center px-4 pt-16">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={closePalette}
      />

      <div className="relative z-10 w-full max-w-[720px] overflow-hidden rounded-2xl border border-[hsla(32,26%,26%,0.6)] bg-[linear-gradient(180deg,hsla(25,16%,14%,0.98),hsla(24,14%,10%,1))] shadow-[0_20px_60px_hsla(0,0%,0%,0.45)]">
        <div className="flex items-center gap-3 border-b border-[hsla(32,24%,30%,0.35)] px-4 py-3">
          <Search className="h-4 w-4 text-[hsl(30,12%,58%)]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the campaign world..."
            className="flex-1 bg-transparent text-[14px] text-[hsl(35,24%,92%)] outline-none placeholder:text-[hsl(30,12%,48%)]"
          />
          <div className="flex items-center gap-1 rounded-md border border-[hsla(32,24%,30%,0.35)] px-2 py-1 text-[10px] text-[hsl(30,12%,58%)]">
            <Command className="h-3 w-3" />
            K
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-[13px] text-[hsl(35,24%,88%)]">No world entities match that search.</p>
              <p className="mt-1 text-[11px] text-[hsl(30,12%,58%)]">
                Try a place name, NPC, quest, faction, or tag.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((entity, index) => (
                <PaletteResult
                  key={entity._id}
                  entity={entity}
                  active={index === selectedIndex}
                  onClick={() => handleSelect(entity)}
                  onHover={() => setSelectedIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[hsla(32,24%,30%,0.35)] px-4 py-2 text-[10px] text-[hsl(30,12%,58%)]">
          <span>Fast world navigation with the existing stack</span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            Open entity
          </span>
        </div>
      </div>
    </div>
  );
}

function PaletteResult({
  entity,
  active,
  onClick,
  onHover,
}: {
  entity: WorldEntity;
  active: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  const config = ENTITY_TYPE_CONFIG[entity.type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active
          ? 'bg-[hsla(38,70%,46%,0.12)]'
          : 'hover:bg-[hsl(24,20%,15%)]'
      }`}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${config.color}15`, color: config.color }}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-[hsl(35,24%,92%)]">
          {entity.name}
        </p>
        <p className="truncate text-[11px] text-[hsl(30,12%,58%)]">
          {formatWorldEntityContext(entity)}
        </p>
      </div>
    </button>
  );
}

function matchesQuery(entity: WorldEntity, query: string) {
  return [
    entity.name,
    entity.description ?? '',
    entity.locationType ?? '',
    entity.questStatus ?? '',
    ...(entity.tags ?? []),
  ]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function scoreEntity(entity: WorldEntity, query: string) {
  const name = entity.name.toLowerCase();
  if (name === query) return 100;
  if (name.startsWith(query)) return 60;
  if (name.includes(query)) return 40;
  return 10;
}
