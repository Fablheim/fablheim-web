import { useState, useRef, useCallback, useEffect, useMemo, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react';
import {
  Plus,
  Trash2,
  Move,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Type,
  Eye,
  EyeOff,
  ImageOff,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddEncounterToken,
  useUpdateEncounterToken,
  useRemoveEncounterToken,
  useUpdateEncounter,
} from '@/hooks/useEncounters';
import defaultForestMap from '@/assets/battle-map.png';
import defaultStoneDungeonMap from '@/assets/battle-map-stone-dungeon.png';
import defaultOpenGrasslandMap from '@/assets/battle-map-open-grassland.png';
import {
  TILE_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  ZOOM_STEP,
  DRAG_THRESHOLD,
  buildTokenCoverage,
  clampTranslateToViewport,
  DEFAULT_GRID_CELL_SIZE,
  DEFAULT_GRID_COLOR,
  DEFAULT_GRID_OPACITY,
  DEFAULT_GRID_THICKNESS,
  getGridAppearance,
  getInitialMapPref,
  isAreaFree,
  isPositionInBounds,
  roundToPixel,
  setGridAppearance,
  setMapPref,
} from '@/components/battlemap/battlemapUtils';
import type { Encounter } from '@/types/encounter';
import type { MapToken } from '@/types/live-session';

/*
Verification checklist:
- Grid/labels persistence scope: campaign-scoped localStorage prefs via battlemapUtils (fablheim:map-prefs).
- Grid color/opacity persistence scope: campaign-scoped localStorage via battlemapUtils (fablheim:map-grid-appearance).
- F shortcut input-focus guard: shortcut ignored while focus is in input/textarea/select.
- MapTab behavior confirmed unchanged after utility extraction/parity sync.
*/

interface EncounterMapEditorProps {
  campaignId: string;
  encounter: Encounter;
}

const TOKEN_TYPE_LABELS: Record<MapToken['type'], string> = {
  pc: 'PC',
  npc: 'NPC',
  monster: 'MON',
  other: 'OTH',
};

const DEFAULT_MAPS = [
  { key: 'none', label: 'None', url: '' },
  { key: 'forest', label: 'Default: Forest Clearing', url: defaultForestMap },
  { key: 'stone', label: 'Default: Stone Dungeon', url: defaultStoneDungeonMap },
  { key: 'grass', label: 'Default: Open Grassland', url: defaultOpenGrasslandMap },
] as const;

export function EncounterMapEditor({ campaignId, encounter }: EncounterMapEditorProps) {
  const addToken = useAddEncounterToken(campaignId, encounter._id);
  const updateToken = useUpdateEncounterToken(campaignId, encounter._id);
  const removeToken = useRemoveEncounterToken(campaignId, encounter._id);
  const updateEncounter = useUpdateEncounter(campaignId, encounter._id);

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [placingToken, setPlacingToken] = useState(false);
  const [movingTokenId, setMovingTokenId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(() => getInitialMapPref(campaignId, 'showGrid', true));
  const [showLabels, setShowLabels] = useState(() => getInitialMapPref(campaignId, 'showLabels', true));
  const [gridColor, setGridColor] = useState(() => getGridAppearance(campaignId).color);
  const [gridLineOpacity, setGridLineOpacity] = useState(() => getGridAppearance(campaignId).opacity);
  const [gridCellSize, setGridCellSize] = useState(() => getGridAppearance(campaignId).cellSize);
  const [gridLineThickness, setGridLineThickness] = useState(() => getGridAppearance(campaignId).thickness);

  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenType, setNewTokenType] = useState<MapToken['type']>('monster');

  const [gridWidth, setGridWidth] = useState(encounter.gridWidth.toString());
  const [gridHeight, setGridHeight] = useState(encounter.gridHeight.toString());
  const [gridSquareSizeFt, setGridSquareSizeFt] = useState(encounter.gridSquareSizeFt.toString());
  const [bgUrl, setBgUrl] = useState(encounter.backgroundImageUrl ?? '');

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgRetryKey, setImgRetryKey] = useState(0);

  const [draggingToken, setDraggingToken] = useState<{
    tokenId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number } | null>(null);
  const dragStartScreenRef = useRef<{ x: number; y: number } | null>(null);
  const dragExceededRef = useRef(false);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  const { tokenByOrigin, coveredCells } = useMemo(() => {
    return buildTokenCoverage(encounter.tokens);
  }, [encounter.tokens]);

  const clampTranslate = useCallback(
    (tx: number, ty: number, s: number, overscroll = 0) => {
      const vp = viewportRef.current;
      if (!vp) return { x: tx, y: ty };
      const mapWidthPx = encounter.gridWidth * TILE_SIZE;
      const mapHeightPx = encounter.gridHeight * TILE_SIZE;
      return clampTranslateToViewport(
        tx,
        ty,
        s,
        vp.clientWidth,
        vp.clientHeight,
        mapWidthPx,
        mapHeightPx,
        overscroll,
      );
    },
    [encounter.gridHeight, encounter.gridWidth],
  );

  useEffect(() => {
    setGridWidth(encounter.gridWidth.toString());
    setGridHeight(encounter.gridHeight.toString());
    setGridSquareSizeFt(encounter.gridSquareSizeFt.toString());
    setBgUrl(encounter.backgroundImageUrl ?? '');
  }, [encounter._id, encounter.updatedAt, encounter.gridWidth, encounter.gridHeight, encounter.gridSquareSizeFt, encounter.backgroundImageUrl]);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [encounter.backgroundImageUrl]);

  useEffect(() => {
    setShowGrid(getInitialMapPref(campaignId, 'showGrid', true));
    setShowLabels(getInitialMapPref(campaignId, 'showLabels', true));
    const appearance = getGridAppearance(campaignId);
    setGridColor(appearance.color);
    setGridLineOpacity(appearance.opacity);
    setGridCellSize(appearance.cellSize);
    setGridLineThickness(appearance.thickness);
  }, [campaignId]);

  useEffect(() => {
    setMapPref(campaignId, 'showGrid', showGrid);
  }, [campaignId, showGrid]);

  useEffect(() => {
    setMapPref(campaignId, 'showLabels', showLabels);
  }, [campaignId, showLabels]);

  useEffect(() => {
    setGridAppearance(campaignId, {
      color: gridColor,
      opacity: gridLineOpacity,
      cellSize: gridCellSize,
      thickness: gridLineThickness,
    });
  }, [campaignId, gridCellSize, gridColor, gridLineOpacity, gridLineThickness]);

  const fitToView = useCallback(() => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    const mapW = encounter.gridWidth * TILE_SIZE;
    const mapH = encounter.gridHeight * TILE_SIZE;
    const s = Math.min(vw / mapW, vh / mapH, 1);
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
    const nextTranslate = {
      x: (vw - mapW * clampedScale) / 2,
      y: (vh - mapH * clampedScale) / 2,
    };
    scaleRef.current = clampedScale;
    translateRef.current = nextTranslate;
    setScale(clampedScale);
    setTranslate(nextTranslate);
  }, [encounter.gridHeight, encounter.gridWidth]);

  // Grid spacing is an overlay concern only and must not drive camera transform.
  useEffect(() => {
    fitToView();
  }, [encounter._id, encounter.gridWidth, encounter.gridHeight, fitToView]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  useEffect(() => {
    function onResize() {
      setTranslate((prev) => clampTranslate(prev.x, prev.y, scaleRef.current));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampTranslate]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        fitToView();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitToView]);

  const applyZoomAt = useCallback(
    (cx: number, cy: number, targetScale: number) => {
      const currentScale = scaleRef.current;
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale));
      if (clampedScale === currentScale) return;

      const ratio = clampedScale / currentScale;
      const currentTranslate = translateRef.current;
      const nextTranslate = clampTranslate(
        cx - ratio * (cx - currentTranslate.x),
        cy - ratio * (cy - currentTranslate.y),
        clampedScale,
      );

      scaleRef.current = clampedScale;
      translateRef.current = nextTranslate;
      setScale(clampedScale);
      setTranslate(nextTranslate);
    },
    [clampTranslate],
  );

  const mapWidthPx = encounter.gridWidth * TILE_SIZE;
  const mapHeightPx = encounter.gridHeight * TILE_SIZE;
  const gridCols = Math.max(1, Math.floor(mapWidthPx / gridCellSize));
  const gridRows = Math.max(1, Math.floor(mapHeightPx / gridCellSize));

  function updateTokenWithValidation(tokenId: string, updates: Partial<MapToken>) {
    const current = encounter.tokens.find((t) => t.id === tokenId);
    if (!current) return;

    const nextX = updates.x ?? current.x;
    const nextY = updates.y ?? current.y;
    const nextSize = updates.size ?? current.size ?? 1;

    if (!isPositionInBounds(nextX, nextY, nextSize, gridCols, gridRows)) {
      toast.error('Out of bounds');
      return;
    }
    if (!isAreaFree(nextX, nextY, nextSize, encounter.tokens, tokenId)) {
      toast.error('Cell occupied');
      return;
    }

    updateToken.mutate(
      { tokenId, body: updates },
      {
        onError: () => toast.error('Failed to update token'),
      },
    );
  }

  function handleCellClick(x: number, y: number) {
    if (movingTokenId) {
      const movingToken = encounter.tokens.find((t) => t.id === movingTokenId);
      const movingSize = movingToken?.size || 1;
      if (!isPositionInBounds(x, y, movingSize, gridCols, gridRows)) {
        toast.error('Out of bounds');
        setMovingTokenId(null);
        return;
      }
      if (!isAreaFree(x, y, movingSize, encounter.tokens, movingTokenId)) {
        toast.error('Cell occupied');
        setMovingTokenId(null);
        return;
      }

      updateToken.mutate(
        { tokenId: movingTokenId, body: { x, y } },
        {
          onSuccess: () => setMovingTokenId(null),
          onError: () => toast.error('Failed to move token'),
        },
      );
      return;
    }

    if (placingToken && newTokenName.trim()) {
      if (!isAreaFree(x, y, 1, encounter.tokens)) {
        toast.error('Cell occupied');
        return;
      }
      addToken.mutate(
        { name: newTokenName.trim(), type: newTokenType, x, y },
        {
          onSuccess: () => {
            setPlacingToken(false);
            setNewTokenName('');
            setShowAddForm(false);
            toast.success('Token placed');
          },
          onError: () => toast.error('Failed to place token'),
        },
      );
      return;
    }

    const token = coveredCells.get(`${x},${y}`);
    if (token) setSelectedTokenId(token.id);
    else setSelectedTokenId(null);
  }

  function handleTokenPointerDown(e: ReactPointerEvent, token: MapToken) {
    if (e.button !== 0) return;
    if (placingToken || movingTokenId) return;

    e.stopPropagation();
    e.preventDefault();

    const viewport = viewportRef.current;
    if (!viewport) return;

    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    dragExceededRef.current = false;

    const rect = viewport.getBoundingClientRect();
    const mapX = (e.clientX - rect.left - translateRef.current.x) / scaleRef.current;
    const mapY = (e.clientY - rect.top - translateRef.current.y) / scaleRef.current;

    setDraggingToken({
      tokenId: token.id,
      offsetX: mapX - token.x * gridCellSize,
      offsetY: mapY - token.y * gridCellSize,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleRemoveToken(tokenId: string) {
    removeToken.mutate(tokenId, {
      onError: () => toast.error('Failed to remove token'),
    });
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  }

  function handleSaveSettings() {
    const w = parseInt(gridWidth, 10);
    const h = parseInt(gridHeight, 10);
    const sq = parseInt(gridSquareSizeFt, 10);
    if (!w || !h || !sq) return;

    const hasOutOfBoundsTokens = encounter.tokens.some((token) => {
      const size = token.size || 1;
      return token.x < 0 || token.y < 0 || token.x + size > w || token.y + size > h;
    });
    if (hasOutOfBoundsTokens) {
      toast.error('Tokens out of bounds — move them or increase size.');
      return;
    }

    updateEncounter.mutate(
      {
        gridWidth: w,
        gridHeight: h,
        gridSquareSizeFt: sq,
        backgroundImageUrl: bgUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowSettings(false);
          toast.success('Map settings saved');
        },
        onError: () => toast.error('Failed to save settings'),
      },
    );
  }

  function handleWheel(e: WheelEvent) {
    if (!e.shiftKey) return;
    e.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const direction = e.deltaY < 0 ? 1 : -1;

    applyZoomAt(cursorX, cursorY, scaleRef.current + direction * ZOOM_STEP);
  }

  function handlePointerDown(e: ReactPointerEvent) {
    if (e.button === 1 || (e.button === 0 && !placingToken && !movingTokenId)) {
      const target = e.target as HTMLElement;
      if (target === viewportRef.current || target.dataset.pannable === 'true') {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY };
        translateStart.current = { ...translate };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    }
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (draggingToken) {
      if (!dragExceededRef.current && dragStartScreenRef.current) {
        const dx = e.clientX - dragStartScreenRef.current.x;
        const dy = e.clientY - dragStartScreenRef.current.y;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragExceededRef.current = true;
      }

      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const mapX = (e.clientX - rect.left - translateRef.current.x) / scaleRef.current;
      const mapY = (e.clientY - rect.top - translateRef.current.y) / scaleRef.current;
      const gridX = Math.round((mapX - draggingToken.offsetX) / gridCellSize);
      const gridY = Math.round((mapY - draggingToken.offsetY) / gridCellSize);
      setDragGhost({ x: gridX, y: gridY });
      return;
    }

    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTranslate(clampTranslate(translateStart.current.x + dx, translateStart.current.y + dy, scaleRef.current, 40));
  }

  function handlePointerUp() {
    if (draggingToken) {
      if (dragExceededRef.current && dragGhost) {
        const token = encounter.tokens.find((t) => t.id === draggingToken.tokenId);
      const s = token?.size || 1;
      const nextX = dragGhost.x;
      const nextY = dragGhost.y;

      if (!isPositionInBounds(nextX, nextY, s, gridCols, gridRows)) {
        toast.error('Out of bounds');
      } else if (!isAreaFree(nextX, nextY, s, encounter.tokens, draggingToken.tokenId)) {
        toast.error('Cell occupied');
        } else {
          updateToken.mutate(
            { tokenId: draggingToken.tokenId, body: { x: nextX, y: nextY } },
            { onError: () => toast.error('Failed to move token') },
          );
        }
      } else {
        setSelectedTokenId(draggingToken.tokenId);
      }
      setDraggingToken(null);
      setDragGhost(null);
      dragStartScreenRef.current = null;
      dragExceededRef.current = false;
      return;
    }

    if (isPanning) {
      setTranslate((prev) => clampTranslate(prev.x, prev.y, scaleRef.current));
    }
    setIsPanning(false);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

      if (lastPinchDist.current != null && lastPinchCenter.current != null) {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        const cx = center.x - rect.left;
        const cy = center.y - rect.top;
        const pinchRatio = dist / lastPinchDist.current;
        applyZoomAt(cx, cy, scaleRef.current * pinchRatio);
      }

      lastPinchDist.current = dist;
      lastPinchCenter.current = center;
    }
  }

  function handleTouchEnd() {
    lastPinchDist.current = null;
    lastPinchCenter.current = null;
  }

  function zoomIn() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cx = viewport.clientWidth / 2;
    const cy = viewport.clientHeight / 2;
    applyZoomAt(cx, cy, scaleRef.current + ZOOM_STEP);
  }

  function zoomOut() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cx = viewport.clientWidth / 2;
    const cy = viewport.clientHeight / 2;
    applyZoomAt(cx, cy, scaleRef.current - ZOOM_STEP);
  }

  return (
    <div className="flex h-full flex-col">
      {renderToolbar()}
      {showSettings && renderSettingsPanel()}
      {renderViewport()}
    </div>
  );

  function renderToolbar() {
    return (
      <div className="shrink-0 flex items-center gap-2 border-b border-[hsla(38,40%,30%,0.15)] px-3 py-2">
        <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          {encounter.name}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {encounter.gridWidth}x{encounter.gridHeight} ({encounter.gridSquareSizeFt}ft)
        </span>

        <div className="flex-1" />

        <span className="hidden text-[9px] text-muted-foreground/60 sm:inline">
          Shift+Wheel zoom · Drag to move · F fit
        </span>

        {movingTokenId && (
          <span className="text-[10px] text-primary animate-pulse font-[Cinzel] uppercase">
            Click cell to place
          </span>
        )}
        {placingToken && (
          <span className="text-[10px] text-primary animate-pulse font-[Cinzel] uppercase">
            Click cell to place token
          </span>
        )}

        {renderTokenActions()}
        {renderViewControls()}
      </div>
    );
  }

  function renderTokenActions() {
    const selectedToken = selectedTokenId
      ? encounter.tokens.find((t) => t.id === selectedTokenId)
      : undefined;

    return (
      <>
        {!placingToken && !movingTokenId && (
          <>
            {showAddForm ? renderAddForm() : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1 rounded-md border border-brass/40 bg-brass/10 px-2 py-1 text-[10px] text-brass hover:bg-brass/20 transition-colors font-[Cinzel] uppercase tracking-wider"
              >
                <Plus className="h-3 w-3" /> Add Token
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`rounded p-1 transition-colors ${showSettings ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'}`}
              title="Map Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {selectedToken && (
          <>
            <button
              type="button"
              onClick={() => setMovingTokenId(selectedToken.id)}
              className="flex items-center gap-1 rounded-md border border-iron bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/80 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              <Move className="h-3 w-3" /> Move
            </button>
            <button
              type="button"
              onClick={() => updateTokenWithValidation(selectedToken.id, { isHidden: !selectedToken.isHidden })}
              className="flex items-center gap-1 rounded-md border border-iron bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/80 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              {selectedToken.isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {selectedToken.isHidden ? 'Show' : 'Hide'}
            </button>
            <div className="flex items-center gap-1 rounded-md border border-iron bg-accent/60 px-1 py-1">
              {[1, 2, 3, 4].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateTokenWithValidation(selectedToken.id, { size })}
                  className={`h-5 w-5 rounded text-[9px] font-bold ${
                    (selectedToken.size || 1) === size
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveToken(selectedToken.id)}
              className="flex items-center gap-1 rounded-md border border-blood/40 bg-blood/10 px-2 py-1 text-[10px] text-[hsl(0,55%,55%)] hover:bg-blood/20 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </>
        )}
      </>
    );
  }

  function renderAddForm() {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={newTokenName}
          onChange={(e) => setNewTokenName(e.target.value)}
          placeholder="Name"
          className="w-24 rounded border border-iron bg-accent/40 px-1.5 py-0.5 text-[10px] text-foreground placeholder:text-muted-foreground"
        />
        <select
          value={newTokenType}
          onChange={(e) => setNewTokenType(e.target.value as MapToken['type'])}
          className="rounded border border-iron bg-accent/40 px-1 py-0.5 text-[10px] text-foreground"
        >
          <option value="pc">PC</option>
          <option value="npc">NPC</option>
          <option value="monster">Monster</option>
          <option value="other">Other</option>
        </select>
        <button
          type="button"
          onClick={() => {
            if (newTokenName.trim()) setPlacingToken(true);
          }}
          disabled={!newTokenName.trim()}
          className="rounded-md border border-brass/40 bg-brass/10 px-2 py-0.5 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50 transition-colors font-[Cinzel] uppercase"
        >
          Place
        </button>
        <button
          type="button"
          onClick={() => {
            setShowAddForm(false);
            setPlacingToken(false);
            setNewTokenName('');
          }}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  function renderSettingsPanel() {
    const inputCls = 'rounded-sm border border-input bg-input px-2 py-1 text-xs text-foreground input-carved w-full';
    const lblCls = 'font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground';

    return (
      <div className="shrink-0 flex items-end gap-3 border-b border-[hsla(38,40%,30%,0.15)] bg-card/40 px-3 py-2">
        <div className="w-20">
          <label className={lblCls}>Width</label>
          <input type="number" min={5} max={100} value={gridWidth} onChange={(e) => setGridWidth(e.target.value)} className={inputCls} />
        </div>
        <div className="w-20">
          <label className={lblCls}>Height</label>
          <input type="number" min={5} max={100} value={gridHeight} onChange={(e) => setGridHeight(e.target.value)} className={inputCls} />
        </div>
        <div className="w-20">
          <label className={lblCls}>Sq. Ft</label>
          <input type="number" min={1} max={30} value={gridSquareSizeFt} onChange={(e) => setGridSquareSizeFt(e.target.value)} className={inputCls} />
        </div>
        <div className="flex-1">
          <label className={lblCls}>Background URL</label>
          <div className="mb-1 mt-0.5 flex flex-wrap gap-1">
            {DEFAULT_MAPS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setBgUrl(option.url)}
                className="rounded border border-iron px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                {option.label}
              </button>
            ))}
          </div>
          <input type="text" value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} placeholder="https://..." className={inputCls} />
        </div>
        <div className="w-28">
          <label className={lblCls}>Grid Overlay</label>
          <button
            type="button"
            onClick={() => setShowGrid((prev) => !prev)}
            className={`mt-1 w-full rounded border px-2 py-1 text-[10px] ${
              showGrid
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-iron bg-accent/40 text-muted-foreground'
            }`}
          >
            {showGrid ? 'On' : 'Off'}
          </button>
        </div>
        <div className="w-40">
          <label className={lblCls}>Grid Color</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={gridColor}
              onChange={(e) => setGridColor(e.target.value)}
              className="h-7 w-10 rounded border border-iron bg-accent/40 p-0.5"
            />
            <button
              type="button"
              onClick={() => {
                setGridColor(DEFAULT_GRID_COLOR);
                setGridLineOpacity(DEFAULT_GRID_OPACITY);
                setGridCellSize(DEFAULT_GRID_CELL_SIZE);
                setGridLineThickness(DEFAULT_GRID_THICKNESS);
              }}
              className="rounded border border-iron px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/60"
            >
              Reset
            </button>
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={gridLineOpacity}
            onChange={(e) => setGridLineOpacity(Number(e.target.value))}
            className="mt-1 w-full"
          />
          <p className="text-[9px] text-muted-foreground">Opacity {gridLineOpacity.toFixed(2)}</p>
        </div>
        <div className="w-44">
          <label className={lblCls}>Grid Cell Size (px)</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={200}
              step={1}
              value={gridCellSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                setGridCellSize(Math.max(10, Math.min(200, Math.round(next))));
              }}
              className={inputCls}
            />
            <input
              type="range"
              min={10}
              max={200}
              step={1}
              value={gridCellSize}
              onChange={(e) => setGridCellSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        <div className="w-40">
          <label className={lblCls}>Grid Line Thickness ({gridLineThickness.toFixed(1)})</label>
          <input
            type="range"
            min={0.5}
            max={8}
            step={0.1}
            value={gridLineThickness}
            onChange={(e) => setGridLineThickness(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={updateEncounter.isPending}
          className="rounded-md border border-brass/40 bg-brass/10 px-3 py-1 text-[10px] text-brass hover:bg-brass/20 transition-colors font-[Cinzel] uppercase tracking-wider disabled:opacity-50"
        >
          {updateEncounter.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
        </button>
      </div>
    );
  }

  function renderViewControls() {
    return (
      <div className="flex items-center gap-1 ml-2 border-l border-[hsla(38,40%,30%,0.15)] pl-2">
        <button
          type="button"
          onClick={() => setShowGrid((prev) => !prev)}
          className={`inline-flex items-center gap-1 rounded p-1 transition-colors ${showGrid ? 'text-foreground bg-accent/60' : 'text-muted-foreground hover:bg-accent/60'}`}
          title={showGrid ? 'Hide grid' : 'Show grid'}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          <span className="text-[10px] font-[Cinzel] uppercase">{showGrid ? 'Grid On' : 'Grid Off'}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowLabels((prev) => !prev)}
          className={`rounded p-1 transition-colors ${showLabels ? 'text-foreground bg-accent/60' : 'text-muted-foreground hover:bg-accent/60'}`}
          title={showLabels ? 'Hide labels' : 'Show labels'}
        >
          <Type className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={zoomOut} className="rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors" title="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[3.5ch] text-center text-[10px] text-muted-foreground font-[Cinzel]">
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={zoomIn} className="rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors" title="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={fitToView} className="inline-flex items-center gap-1 rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors" title="Fit to screen">
          <Maximize className="h-3.5 w-3.5" />
          <span className="text-[10px] font-[Cinzel] uppercase">Fit</span>
        </button>
      </div>
    );
  }

  function renderViewport() {
    const mapPixelW = mapWidthPx;
    const mapPixelH = mapHeightPx;

    return (
      <div
        ref={viewportRef}
        data-pannable="true"
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
            width: mapPixelW,
            height: mapPixelH,
            position: 'relative',
          }}
        >
          {renderBackground(mapPixelW, mapPixelH)}
          {renderGrid(mapPixelW, mapPixelH)}
          {renderCells(gridCols, gridRows)}
          {renderDragGhost()}
        </div>
      </div>
    );
  }

  function renderBackground(mapPixelW: number, mapPixelH: number) {
    if (!encounter.backgroundImageUrl) return null;

    if (imgError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 pointer-events-auto cursor-pointer hover:bg-destructive/20 transition-colors"
            onClick={() => {
              setImgError(false);
              setImgRetryKey((k) => k + 1);
            }}
            title="Retry loading map image"
          >
            <ImageOff className="h-3.5 w-3.5 text-destructive/70" />
            <span className="text-[10px] text-destructive/80 font-[Cinzel] uppercase">Image failed</span>
            <RefreshCw className="h-3 w-3 text-destructive/60" />
          </button>
        </div>
      );
    }

    return (
      <>
        <img
          key={imgRetryKey}
          src={encounter.backgroundImageUrl}
          alt=""
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgLoaded(false);
            setImgError(true);
          }}
          className={`absolute inset-0 z-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: mapPixelW, height: mapPixelH }}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
          </div>
        )}
      </>
    );
  }

  function renderGrid(mapPixelW: number, mapPixelH: number) {
    if (!showGrid) return null;
    const majorEvery = 2;
    const minorLineThickness = gridLineThickness;
    const majorLineThickness = minorLineThickness * 2;
    const majorLineOpacity = Math.min(1, gridLineOpacity + 0.15);
    const verticalLines = Math.floor(mapPixelW / gridCellSize);
    const horizontalLines = Math.floor(mapPixelH / gridCellSize);
    return (
      <svg
        className="absolute inset-0 z-10 pointer-events-none"
        width={mapPixelW}
        height={mapPixelH}
        shapeRendering="crispEdges"
      >
        {Array.from({ length: verticalLines + 1 }, (_, i) => (
          (() => {
            const isMajor = i % majorEvery === 0;
            return (
          <line
            key={`v${i}`}
            x1={roundToPixel(i * gridCellSize, scale)}
            y1={0}
            x2={roundToPixel(i * gridCellSize, scale)}
            y2={mapPixelH}
            stroke={gridColor}
            strokeOpacity={isMajor ? majorLineOpacity : gridLineOpacity}
            strokeWidth={isMajor ? majorLineThickness : minorLineThickness}
            vectorEffect="non-scaling-stroke"
          />
            );
          })()
        ))}
        {Array.from({ length: horizontalLines + 1 }, (_, i) => (
          (() => {
            const isMajor = i % majorEvery === 0;
            return (
          <line
            key={`h${i}`}
            x1={0}
            y1={roundToPixel(i * gridCellSize, scale)}
            x2={mapPixelW}
            y2={roundToPixel(i * gridCellSize, scale)}
            stroke={gridColor}
            strokeOpacity={isMajor ? majorLineOpacity : gridLineOpacity}
            strokeWidth={isMajor ? majorLineThickness : minorLineThickness}
            vectorEffect="non-scaling-stroke"
          />
            );
          })()
        ))}
      </svg>
    );
  }

  function renderCells(gridW: number, gridH: number) {
    const cells = [];
    const isPlacingOrMoving = placingToken || movingTokenId;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const key = `${x},${y}`;
        const tokenAtOrigin = tokenByOrigin.get(key);
        const coveringToken = coveredCells.get(key);
        const isSelected = (tokenAtOrigin?.id ?? coveringToken?.id) === selectedTokenId;

        cells.push(
          <div
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              handleCellClick(x, y);
            }}
            className={`absolute ${
              isPlacingOrMoving ? 'cursor-crosshair hover:bg-primary/10' : coveringToken ? 'cursor-pointer' : ''
            }`}
            style={{ left: x * gridCellSize, top: y * gridCellSize, width: gridCellSize, height: gridCellSize }}
          >
            {tokenAtOrigin && renderTokenAtOrigin(tokenAtOrigin, isSelected)}
          </div>,
        );
      }
    }
    return cells;
  }

  function renderTokenAtOrigin(token: MapToken, isSelected: boolean) {
    const s = token.size || 1;
    const sizePx = s * gridCellSize;
    const circlePx = sizePx - 4;
    const fontSize = s >= 3 ? 14 : s === 2 ? 11 : 8;

    return (
      <div
        className="absolute z-20 pointer-events-auto"
        style={{ left: 0, top: 0, width: sizePx, height: sizePx }}
        onPointerDown={(e) => handleTokenPointerDown(e, token)}
      >
        <div
          title={`${token.name} (${TOKEN_TYPE_LABELS[token.type]})`}
          className={`
            rounded-full flex items-center justify-center font-bold text-white
            transition-all duration-200
            hover:scale-105 hover:ring-2 hover:ring-primary/40
            ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-card scale-110' : ''}
            ${token.isHidden ? 'opacity-50' : ''}
          `}
          style={{
            backgroundColor: token.color,
            width: circlePx,
            height: circlePx,
            fontSize,
            margin: 2,
          }}
        >
          {token.name.charAt(0).toUpperCase()}
        </div>
        {showLabels && (
          <span
            className="absolute left-1/2 -translate-x-1/2 text-[7px] font-bold text-foreground/80 whitespace-nowrap truncate text-center leading-none pointer-events-none"
            style={{ top: circlePx + 3, maxWidth: Math.max(sizePx, 40) }}
          >
            {token.name.length > 6 ? token.name.slice(0, 6) + '.' : token.name}
          </span>
        )}
      </div>
    );
  }

  function renderDragGhost() {
    if (!draggingToken || !dragGhost || !dragExceededRef.current) return null;
    const token = encounter.tokens.find((t) => t.id === draggingToken.tokenId);
    if (!token) return null;

    const s = token.size || 1;
    const sizePx = s * gridCellSize;
    const circlePx = sizePx - 4;
    const isValid =
      isPositionInBounds(dragGhost.x, dragGhost.y, s, gridCols, gridRows) &&
      isAreaFree(dragGhost.x, dragGhost.y, s, encounter.tokens, token.id);

    return (
      <div
        className="absolute pointer-events-none z-30 opacity-50"
        style={{
          left: dragGhost.x * gridCellSize,
          top: dragGhost.y * gridCellSize,
          width: sizePx,
          height: sizePx,
        }}
      >
        <div
          className="rounded-full flex items-center justify-center text-white font-bold"
          style={{
            backgroundColor: token.color,
            width: circlePx,
            height: circlePx,
            fontSize: s >= 3 ? 14 : s === 2 ? 11 : 8,
            margin: 2,
          }}
        >
          {token.name.charAt(0).toUpperCase()}
        </div>
        <div className={`absolute inset-0 rounded-sm border-2 ${isValid ? 'border-green-500' : 'border-red-500'}`} />
      </div>
    );
  }
}
