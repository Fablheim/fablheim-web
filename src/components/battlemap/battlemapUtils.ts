import type { MapToken } from '@/types/live-session';

export const TILE_SIZE = 28;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 3;
export const ZOOM_STEP = 0.15;
export const DRAG_THRESHOLD = 4;
export const CLAMP_MARGIN = 100;
export const DEFAULT_GRID_COLOR = '#8B6B3E';
export const DEFAULT_GRID_OPACITY = 0.35;
export const DEFAULT_GRID_CELL_SIZE = 28;
export const DEFAULT_GRID_THICKNESS = 1;

const MAP_PREFS_STORAGE_KEY = 'fablheim:map-prefs';
const GRID_APPEARANCE_STORAGE_KEY = 'fablheim:map-grid-appearance';

export interface GridAppearance {
  color: string;
  opacity: number;
  cellSize: number;
  thickness: number;
}

export function getInitialMapPref(
  campaignId: string,
  key: 'showGrid' | 'showLabels',
  fallback: boolean,
): boolean {
  try {
    const raw = localStorage.getItem(MAP_PREFS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<
      string,
      Partial<Record<'showGrid' | 'showLabels', boolean>>
    >;
    return parsed[campaignId]?.[key] ?? fallback;
  } catch {
    return fallback;
  }
}

export function setMapPref(
  campaignId: string,
  key: 'showGrid' | 'showLabels',
  value: boolean,
): void {
  try {
    const raw = localStorage.getItem(MAP_PREFS_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Record<
          string,
          Partial<Record<'showGrid' | 'showLabels', boolean>>
        >)
      : {};
    parsed[campaignId] = { ...(parsed[campaignId] ?? {}), [key]: value };
    localStorage.setItem(MAP_PREFS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore localStorage failures to keep map interactions uninterrupted.
  }
}

export function getGridAppearance(campaignId: string): GridAppearance {
  try {
    const raw = localStorage.getItem(GRID_APPEARANCE_STORAGE_KEY);
    if (!raw) {
      return {
        color: DEFAULT_GRID_COLOR,
        opacity: DEFAULT_GRID_OPACITY,
        cellSize: DEFAULT_GRID_CELL_SIZE,
        thickness: DEFAULT_GRID_THICKNESS,
      };
    }
    const parsed = JSON.parse(raw) as Record<
      string,
      Partial<GridAppearance> | undefined
    >;
    const value = parsed[campaignId];
    const color =
      typeof value?.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.color)
        ? value.color
        : DEFAULT_GRID_COLOR;
    const opacity = clampNumber(value?.opacity, 0.05, 1, DEFAULT_GRID_OPACITY);
    const cellSize = clampNumber(
      value?.cellSize,
      10,
      200,
      DEFAULT_GRID_CELL_SIZE,
    );
    const thickness = clampNumber(
      value?.thickness,
      0.5,
      8,
      DEFAULT_GRID_THICKNESS,
    );
    return { color, opacity, cellSize, thickness };
  } catch {
    return {
      color: DEFAULT_GRID_COLOR,
      opacity: DEFAULT_GRID_OPACITY,
      cellSize: DEFAULT_GRID_CELL_SIZE,
      thickness: DEFAULT_GRID_THICKNESS,
    };
  }
}

export function setGridAppearance(
  campaignId: string,
  appearance: GridAppearance,
): void {
  try {
    const raw = localStorage.getItem(GRID_APPEARANCE_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, Partial<GridAppearance> | undefined>)
      : {};
    parsed[campaignId] = {
      color: appearance.color,
      opacity: clampNumber(appearance.opacity, 0.05, 1, DEFAULT_GRID_OPACITY),
      cellSize: clampNumber(
        appearance.cellSize,
        10,
        200,
        DEFAULT_GRID_CELL_SIZE,
      ),
      thickness: clampNumber(
        appearance.thickness,
        0.5,
        8,
        DEFAULT_GRID_THICKNESS,
      ),
    };
    localStorage.setItem(GRID_APPEARANCE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore localStorage failures to keep map interactions uninterrupted.
  }
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

export function getCoveredCells(
  token: Pick<MapToken, 'x' | 'y' | 'size'>,
): string[] {
  const size = token.size || 1;
  const cells: string[] = [];
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      cells.push(`${token.x + dx},${token.y + dy}`);
    }
  }
  return cells;
}

export function buildTokenCoverage(tokens: MapToken[]): {
  tokenByOrigin: Map<string, MapToken>;
  coveredCells: Map<string, MapToken>;
} {
  const tokenByOrigin = new Map<string, MapToken>();
  const coveredCells = new Map<string, MapToken>();

  for (const token of tokens) {
    tokenByOrigin.set(`${token.x},${token.y}`, token);
    for (const cell of getCoveredCells(token)) {
      coveredCells.set(cell, token);
    }
  }

  return { tokenByOrigin, coveredCells };
}

export function isAreaFree(
  x: number,
  y: number,
  size: number,
  tokens: MapToken[],
  excludeTokenId?: string,
): boolean {
  const occupied = new Set<string>();
  for (const token of tokens) {
    if (excludeTokenId && token.id === excludeTokenId) continue;
    for (const cell of getCoveredCells(token)) {
      occupied.add(cell);
    }
  }
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      if (occupied.has(`${x + dx},${y + dy}`)) return false;
    }
  }
  return true;
}

export function isPositionInBounds(
  x: number,
  y: number,
  size: number,
  gridWidth: number,
  gridHeight: number,
): boolean {
  return x >= 0 && y >= 0 && x + size <= gridWidth && y + size <= gridHeight;
}

export function clampTranslateToViewport(
  tx: number,
  ty: number,
  scale: number,
  viewportWidth: number,
  viewportHeight: number,
  mapWidthPx: number,
  mapHeightPx: number,
  overscroll = 0,
): { x: number; y: number } {
  const scaledMapWidthPx = mapWidthPx * scale;
  const scaledMapHeightPx = mapHeightPx * scale;

  return {
    x: Math.max(
      CLAMP_MARGIN - scaledMapWidthPx - overscroll,
      Math.min(viewportWidth - CLAMP_MARGIN + overscroll, tx),
    ),
    y: Math.max(
      CLAMP_MARGIN - scaledMapHeightPx - overscroll,
      Math.min(viewportHeight - CLAMP_MARGIN + overscroll, ty),
    ),
  };
}

export function roundToPixel(valuePx: number, scale: number): number {
  return Math.round(valuePx * scale) / scale;
}
