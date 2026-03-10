import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import defaultForestMap from '@/assets/battle-map.webp';
import defaultStoneDungeonMap from '@/assets/battle-map-stone-dungeon.webp';
import defaultOpenGrasslandMap from '@/assets/battle-map-open-grassland.webp';
import type { BattleMap } from '@/types/live-session';

type MapSettings = Partial<
  Pick<
    BattleMap,
    | 'name'
    | 'backgroundImageUrl'
    | 'gridWidth'
    | 'gridHeight'
    | 'gridSquareSizeFt'
    | 'gridOpacity'
    | 'snapToGrid'
    | 'gridOffsetX'
    | 'gridOffsetY'
  >
>;

const DEFAULT_MAPS = [
  { key: 'none', label: 'None', url: '' },
  { key: 'forest', label: 'Default: Forest Clearing', url: defaultForestMap },
  { key: 'stone', label: 'Default: Stone Dungeon', url: defaultStoneDungeonMap },
  { key: 'grass', label: 'Default: Open Grassland', url: defaultOpenGrasslandMap },
] as const;

interface MapSettingsPanelProps {
  map: BattleMap;
  showGrid: boolean;
  onShowGridChange: (next: boolean) => void;
  gridColor: string;
  gridLineOpacity: number;
  gridCellSize: number;
  gridLineThickness: number;
  onGridColorChange: (next: string) => void;
  onGridLineOpacityChange: (next: number) => void;
  onGridCellSizeChange: (next: number) => void;
  onGridLineThicknessChange: (next: number) => void;
  onResetGridAppearance: () => void;
  onApply: (settings: MapSettings) => void;
  onClose: () => void;
  isPending: boolean;
}

export function MapSettingsPanel({
  map,
  showGrid,
  onShowGridChange,
  gridColor,
  gridLineOpacity,
  gridCellSize,
  gridLineThickness,
  onGridColorChange,
  onGridLineOpacityChange,
  onGridCellSizeChange,
  onGridLineThicknessChange,
  onResetGridAppearance,
  onApply,
  onClose,
  isPending,
}: MapSettingsPanelProps) {
  const [name, setName] = useState(map.name);
  const [gridWidth, setGridWidth] = useState(map.gridWidth);
  const [gridHeight, setGridHeight] = useState(map.gridHeight);
  const [gridSquareSizeFt, setGridSquareSizeFt] = useState(map.gridSquareSizeFt);
  const [snapToGrid, setSnapToGrid] = useState(map.snapToGrid ?? true);
  const [gridOffsetX, setGridOffsetX] = useState(map.gridOffsetX ?? 0);
  const [gridOffsetY, setGridOffsetY] = useState(map.gridOffsetY ?? 0);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(map.backgroundImageUrl || '');

  // Sync when map data changes externally (e.g. from another client)
  useEffect(() => {
    setName(map.name);
    setGridWidth(map.gridWidth);
    setGridHeight(map.gridHeight);
    setGridSquareSizeFt(map.gridSquareSizeFt);
    setSnapToGrid(map.snapToGrid ?? true);
    setGridOffsetX(map.gridOffsetX ?? 0);
    setGridOffsetY(map.gridOffsetY ?? 0);
    setBackgroundImageUrl(map.backgroundImageUrl || '');
  }, [map]);

  const widthError = getRangeError(gridWidth, 5, 100, 'Width');
  const heightError = getRangeError(gridHeight, 5, 100, 'Height');
  const squareSizeError = getRangeError(gridSquareSizeFt, 1, 30, 'Square size');
  const offsetXError = getRangeError(gridOffsetX, -2000, 2000, 'Grid offset X');
  const offsetYError = getRangeError(gridOffsetY, -2000, 2000, 'Grid offset Y');
  const hasOutOfBoundsTokens = map.tokens.some((token) => {
    const size = token.size || 1;
    return token.x < 0 || token.y < 0 || token.x + size > gridWidth || token.y + size > gridHeight;
  });
  const hasValidationError = !!(
    widthError ||
    heightError ||
    squareSizeError ||
    offsetXError ||
    offsetYError ||
    hasOutOfBoundsTokens
  );

  function handleApply() {
    if (hasValidationError) return;
    onApply({
      name: name.trim() || 'Battle Map',
      gridWidth,
      gridHeight,
      gridSquareSizeFt,
      snapToGrid,
      gridOffsetX,
      gridOffsetY,
      backgroundImageUrl: backgroundImageUrl.trim() || undefined,
    });
  }

  return renderPanel();

  function renderPanel() {
    return (
      <div className="shrink-0 border-b border-[hsla(38,40%,30%,0.15)] bg-card/50 px-3 py-2">
        {renderHeader()}
        {renderFields()}
        {renderActions()}
      </div>
    );
  }

  function renderHeader() {
    return (
      <div className="flex items-center justify-between mb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            Map Settings
          </span>
          {map.sourceEncounterName && (
            <span className="truncate rounded-full border border-border/60 bg-accent/40 px-2 py-0.5 text-[9px] text-muted-foreground">
              Loaded from: {map.sourceEncounterName}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  function renderFields() {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-4">
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground"
          />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Width</label>
          <input
            type="number"
            min={5}
            max={100}
            value={gridWidth}
            onChange={(e) => setGridWidth(Number(e.target.value))}
            className="w-full rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground"
          />
          {widthError && <p className="mt-0.5 text-[9px] text-destructive">{widthError}</p>}
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Height</label>
          <input
            type="number"
            min={5}
            max={100}
            value={gridHeight}
            onChange={(e) => setGridHeight(Number(e.target.value))}
            className="w-full rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground"
          />
          {heightError && <p className="mt-0.5 text-[9px] text-destructive">{heightError}</p>}
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Sq Size (ft)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={gridSquareSizeFt}
            onChange={(e) => setGridSquareSizeFt(Number(e.target.value))}
            className="w-full rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground"
          />
          {squareSizeError && <p className="mt-0.5 text-[9px] text-destructive">{squareSizeError}</p>}
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Grid Overlay</label>
          <button
            type="button"
            onClick={() => onShowGridChange(!showGrid)}
            className={`mt-0.5 w-full rounded border px-1.5 py-1 text-[10px] ${
              showGrid
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-iron bg-accent/40 text-muted-foreground'
            }`}
          >
            {showGrid ? 'On' : 'Off'}
          </button>
          <p className="mt-0.5 text-[9px] text-muted-foreground">
            Turn this off if your background image already has a baked-in grid.
          </p>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Grid Color</label>
          <div className="mt-0.5 flex items-center gap-2">
            <input
              type="color"
              value={gridColor}
              onChange={(e) => onGridColorChange(e.target.value)}
              className="h-7 w-10 rounded border border-iron bg-accent/40 p-0.5"
            />
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">
                Opacity ({gridLineOpacity.toFixed(2)})
              </label>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={gridLineOpacity}
                onChange={(e) => onGridLineOpacityChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              type="button"
              onClick={onResetGridAppearance}
              className="rounded border border-iron px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/60"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">
            Grid Cell Size (px)
          </label>
          <div className="mt-0.5 flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={200}
              step={1}
              value={gridCellSize}
              onChange={(e) => onGridCellSizeChange(Number(e.target.value))}
              className="w-20 rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground"
            />
            <input
              type="range"
              min={10}
              max={200}
              step={1}
              value={gridCellSize}
              onChange={(e) => onGridCellSizeChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">
            Grid Line Thickness ({gridLineThickness.toFixed(1)})
          </label>
          <input
            type="range"
            min={0.5}
            max={8}
            step={0.1}
            value={gridLineThickness}
            onChange={(e) => onGridLineThicknessChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Snap</label>
          <button
            type="button"
            onClick={() => setSnapToGrid((prev) => !prev)}
            className={`w-full rounded border px-1.5 py-1 text-[10px] ${
              snapToGrid
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-iron bg-accent/40 text-muted-foreground'
            }`}
          >
            {snapToGrid ? 'On' : 'Off'}
          </button>
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Grid X</label>
          <div className="flex gap-1">
            <button type="button" onClick={() => setGridOffsetX((v) => v - 1)} className="rounded border border-iron px-1 text-[10px]">-</button>
            <input
              type="number"
              value={gridOffsetX}
              onChange={(e) => setGridOffsetX(Number(e.target.value))}
              className="w-full rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground"
            />
            <button type="button" onClick={() => setGridOffsetX((v) => v + 1)} className="rounded border border-iron px-1 text-[10px]">+</button>
          </div>
          {offsetXError && <p className="mt-0.5 text-[9px] text-destructive">{offsetXError}</p>}
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Grid Y</label>
          <div className="flex gap-1">
            <button type="button" onClick={() => setGridOffsetY((v) => v - 1)} className="rounded border border-iron px-1 text-[10px]">-</button>
            <input
              type="number"
              value={gridOffsetY}
              onChange={(e) => setGridOffsetY(Number(e.target.value))}
              className="w-full rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground"
            />
            <button type="button" onClick={() => setGridOffsetY((v) => v + 1)} className="rounded border border-iron px-1 text-[10px]">+</button>
          </div>
          {offsetYError && <p className="mt-0.5 text-[9px] text-destructive">{offsetYError}</p>}
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="text-[9px] text-muted-foreground uppercase font-[Cinzel]">Background Image URL</label>
          <div className="mb-1 mt-0.5 flex flex-wrap gap-1">
            {DEFAULT_MAPS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setBackgroundImageUrl(option.url)}
                className="rounded border border-iron px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                {option.label}
              </button>
            ))}
          </div>
          <input
            value={backgroundImageUrl}
            onChange={(e) => setBackgroundImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground placeholder:text-muted-foreground"
          />
        </div>
        {hasOutOfBoundsTokens && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-[10px] text-destructive">
              Tokens out of bounds — move them or increase size.
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button size="sm" onClick={handleApply} disabled={isPending || hasValidationError}>
          {isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
          {isPending ? 'Saving...' : 'Apply'}
        </Button>
      </div>
    );
  }
}

function getRangeError(value: number, min: number, max: number, label: string): string | null {
  if (!Number.isFinite(value)) return `${label} must be a number`;
  if (value < min || value > max) return `${label} must be ${min}-${max}`;
  return null;
}
