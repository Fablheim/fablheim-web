import { useState, useRef, useCallback, useEffect, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react';
import { Plus, Trash2, Move, Loader2, ZoomIn, ZoomOut, Maximize, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddEncounterToken,
  useUpdateEncounterToken,
  useRemoveEncounterToken,
  useUpdateEncounter,
} from '@/hooks/useEncounters';
import type { Encounter } from '@/types/encounter';
import type { MapToken } from '@/types/live-session';

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

const TILE_SIZE = 28;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.15;

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

  // Add token form state
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenType, setNewTokenType] = useState<MapToken['type']>('monster');

  // Map settings form
  const [gridWidth, setGridWidth] = useState(encounter.gridWidth.toString());
  const [gridHeight, setGridHeight] = useState(encounter.gridHeight.toString());
  const [gridSquareSizeFt, setGridSquareSizeFt] = useState(encounter.gridSquareSizeFt.toString());
  const [bgUrl, setBgUrl] = useState(encounter.backgroundImageUrl ?? '');

  // Zoom/pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  // Sync settings when encounter changes
  useEffect(() => {
    setGridWidth(encounter.gridWidth.toString());
    setGridHeight(encounter.gridHeight.toString());
    setGridSquareSizeFt(encounter.gridSquareSizeFt.toString());
    setBgUrl(encounter.backgroundImageUrl ?? '');
  }, [encounter._id, encounter.updatedAt]);

  // Fit map to viewport
  const fitToView = useCallback(() => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    const mapW = encounter.gridWidth * TILE_SIZE;
    const mapH = encounter.gridHeight * TILE_SIZE;
    const s = Math.min(vw / mapW, vh / mapH, 1);
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
    setScale(clampedScale);
    setTranslate({
      x: (vw - mapW * clampedScale) / 2,
      y: (vh - mapH * clampedScale) / 2,
    });
  }, [encounter.gridWidth, encounter.gridHeight]);

  useEffect(() => {
    fitToView();
  }, [fitToView]);

  function handleCellClick(x: number, y: number) {
    if (movingTokenId) {
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

    const token = encounter.tokens.find((t) => t.x === x && t.y === y);
    if (token) {
      setSelectedTokenId(token.id);
    } else {
      setSelectedTokenId(null);
    }
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

  // Zoom toward cursor
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const direction = e.deltaY < 0 ? 1 : -1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + direction * ZOOM_STEP));
    if (newScale === scale) return;
    const ratio = newScale / scale;
    setScale(newScale);
    setTranslate({ x: cursorX - ratio * (cursorX - translate.x), y: cursorY - ratio * (cursorY - translate.y) });
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
    if (!isPanning) return;
    setTranslate({
      x: translateStart.current.x + (e.clientX - panStart.current.x),
      y: translateStart.current.y + (e.clientY - panStart.current.y),
    });
  }

  function handlePointerUp() {
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
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * pinchRatio));
        const ratio = newScale / scale;
        setScale(newScale);
        setTranslate({ x: cx - ratio * (cx - translate.x), y: cy - ratio * (cy - translate.y) });
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
    const newScale = Math.min(MAX_SCALE, scale + ZOOM_STEP);
    const viewport = viewportRef.current;
    if (!viewport) { setScale(newScale); return; }
    const cx = viewport.clientWidth / 2;
    const cy = viewport.clientHeight / 2;
    const ratio = newScale / scale;
    setScale(newScale);
    setTranslate({ x: cx - ratio * (cx - translate.x), y: cy - ratio * (cy - translate.y) });
  }

  function zoomOut() {
    const newScale = Math.max(MIN_SCALE, scale - ZOOM_STEP);
    const viewport = viewportRef.current;
    if (!viewport) { setScale(newScale); return; }
    const cx = viewport.clientWidth / 2;
    const cy = viewport.clientHeight / 2;
    const ratio = newScale / scale;
    setScale(newScale);
    setTranslate({ x: cx - ratio * (cx - translate.x), y: cy - ratio * (cy - translate.y) });
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
        {renderZoomControls()}
      </div>
    );
  }

  function renderTokenActions() {
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
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded p-1 transition-colors ${showSettings ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'}`}
              title="Map settings"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {selectedTokenId && (
          <>
            <button
              type="button"
              onClick={() => setMovingTokenId(selectedTokenId)}
              className="flex items-center gap-1 rounded-md border border-iron bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/80 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              <Move className="h-3 w-3" /> Move
            </button>
            <button
              type="button"
              onClick={() => handleRemoveToken(selectedTokenId)}
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
          onClick={() => { if (newTokenName.trim()) setPlacingToken(true); }}
          disabled={!newTokenName.trim()}
          className="rounded-md border border-brass/40 bg-brass/10 px-2 py-0.5 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50 transition-colors font-[Cinzel] uppercase"
        >
          Place
        </button>
        <button
          type="button"
          onClick={() => { setShowAddForm(false); setPlacingToken(false); setNewTokenName(''); }}
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
          <input type="text" value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} placeholder="https://..." className={inputCls} />
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

  function renderZoomControls() {
    return (
      <div className="flex items-center gap-1 ml-2 border-l border-[hsla(38,40%,30%,0.15)] pl-2">
        <button type="button" onClick={zoomOut} className="rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors" title="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[3.5ch] text-center text-[10px] text-muted-foreground font-[Cinzel]">
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={zoomIn} className="rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors" title="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={fitToView} className="rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors" title="Fit to screen">
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  function renderViewport() {
    const gridW = encounter.gridWidth;
    const gridH = encounter.gridHeight;
    const mapPixelW = gridW * TILE_SIZE;
    const mapPixelH = gridH * TILE_SIZE;

    const tokenMap = new Map<string, MapToken>();
    for (const token of encounter.tokens) {
      tokenMap.set(`${token.x},${token.y}`, token);
    }

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
          {renderGrid(gridW, gridH, mapPixelW, mapPixelH)}
          {renderCells(gridW, gridH, tokenMap)}
        </div>
      </div>
    );
  }

  function renderBackground(mapPixelW: number, mapPixelH: number) {
    if (!encounter.backgroundImageUrl) return null;
    return (
      <img
        src={encounter.backgroundImageUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ width: mapPixelW, height: mapPixelH }}
      />
    );
  }

  function renderGrid(gridW: number, gridH: number, mapPixelW: number, mapPixelH: number) {
    return (
      <svg className="absolute inset-0 pointer-events-none" width={mapPixelW} height={mapPixelH}>
        {Array.from({ length: gridW + 1 }, (_, i) => (
          <line key={`v${i}`} x1={i * TILE_SIZE} y1={0} x2={i * TILE_SIZE} y2={mapPixelH} stroke="hsla(38,40%,30%,0.15)" strokeWidth={1 / scale} />
        ))}
        {Array.from({ length: gridH + 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * TILE_SIZE} x2={mapPixelW} y2={i * TILE_SIZE} stroke="hsla(38,40%,30%,0.15)" strokeWidth={1 / scale} />
        ))}
      </svg>
    );
  }

  function renderCells(gridW: number, gridH: number, tokenMap: Map<string, MapToken>) {
    const cells = [];
    const isPlacingOrMoving = placingToken || movingTokenId;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const key = `${x},${y}`;
        const token = tokenMap.get(key);
        const isSelected = token?.id === selectedTokenId;

        cells.push(
          <div
            key={key}
            onClick={(e) => { e.stopPropagation(); handleCellClick(x, y); }}
            className={`absolute flex items-center justify-center ${isPlacingOrMoving ? 'cursor-crosshair hover:bg-primary/10' : token ? 'cursor-pointer' : ''}`}
            style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
          >
            {token && renderTokenCircle(token, isSelected)}
          </div>,
        );
      }
    }
    return cells;
  }

  function renderTokenCircle(token: MapToken, isSelected: boolean) {
    return (
      <div
        title={`${token.name} (${TOKEN_TYPE_LABELS[token.type]})`}
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white transition-all duration-200 ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-card scale-110' : ''} ${token.isHidden ? 'opacity-50' : ''}`}
        style={{ backgroundColor: token.color }}
      >
        {token.name.charAt(0).toUpperCase()}
      </div>
    );
  }
}
