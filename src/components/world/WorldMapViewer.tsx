import { useState, useRef, useCallback, useEffect, useMemo, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react';
import { Upload, ZoomIn, ZoomOut, Maximize, Loader2, Trash2, MapPinPlus, MapPinOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUpdateWorldEntity } from '@/hooks/useWorldEntities';
import { TYPE_ICONS, TYPE_ACCENTS, TYPE_LABELS, LOCATION_TYPE_LABELS } from './world-constants';
import { api } from '@/api/client';
import type { Campaign, WorldEntity, LocationType } from '@/types/campaign';

interface WorldMapViewerProps {
  campaign: Campaign;
  isDM: boolean;
  onMapUpdated: () => void;
  entities?: WorldEntity[];
  onSelectEntity?: (entity: WorldEntity) => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.15;
const PIN_SIZE = 28;

export function WorldMapViewer({ campaign, isDM, onMapUpdated, entities, onSelectEntity }: WorldMapViewerProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Pin placement mode
  const [pinMode, setPinMode] = useState(false);
  const [pinEntityId, setPinEntityId] = useState('');
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateEntity = useUpdateWorldEntity();
  const worldMap = campaign.worldMap;

  // Entities with pins placed on the map
  const pinnedEntities = useMemo(() => {
    if (!entities) return [];
    return entities.filter((e) => e.mapPin);
  }, [entities]);

  // Entities available for pinning (no pin yet)
  const unpinnedEntities = useMemo(() => {
    if (!entities) return [];
    return entities
      .filter((e) => !e.mapPin)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entities]);

  const fitToView = useCallback(() => {
    if (!worldMap || !viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    const s = Math.min(vw / worldMap.width, vh / worldMap.height, 1);
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
    setScale(clampedScale);
    setTranslate({
      x: (vw - worldMap.width * clampedScale) / 2,
      y: (vh - worldMap.height * clampedScale) / 2,
    });
  }, [worldMap]);

  useEffect(() => {
    if (worldMap) fitToView();
  }, [worldMap, fitToView]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaignId', campaign._id);

      const uploadRes = await api.post('/files/world-map', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await api.patch(`/campaigns/${campaign._id}`, {
        worldMap: {
          url: uploadRes.data.url,
          key: uploadRes.data.key,
          filename: uploadRes.data.filename,
          width: uploadRes.data.width,
          height: uploadRes.data.height,
        },
      });

      toast.success('World map uploaded');
      onMapUpdated();
    } catch {
      toast.error('Failed to upload world map');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveMap() {
    if (!worldMap) return;
    setRemoving(true);
    try {
      await api.delete(`/files/${worldMap.key}`);
      await api.patch(`/campaigns/${campaign._id}`, { worldMap: null });
      toast.success('World map removed');
      setShowRemoveConfirm(false);
      onMapUpdated();
    } catch {
      toast.error('Failed to remove world map');
    } finally {
      setRemoving(false);
    }
  }

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
    setTranslate({
      x: cursorX - ratio * (cursorX - translate.x),
      y: cursorY - ratio * (cursorY - translate.y),
    });
  }

  function handlePointerDown(e: ReactPointerEvent) {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      didDrag.current = false;
      panStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    setTranslate({
      x: translateStart.current.x + dx,
      y: translateStart.current.y + dy,
    });
  }

  function handlePointerUp(e: ReactPointerEvent) {
    const wasPanning = isPanning;
    setIsPanning(false);

    // If in pin mode and user clicked (didn't drag), place pin
    if (pinMode && pinEntityId && wasPanning && !didDrag.current && worldMap) {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const mapX = (e.clientX - rect.left - translate.x) / scale;
      const mapY = (e.clientY - rect.top - translate.y) / scale;

      // Convert to percentage
      const px = mapX / worldMap.width;
      const py = mapY / worldMap.height;

      if (px >= 0 && px <= 1 && py >= 0 && py <= 1) {
        placePin(pinEntityId, px, py);
      }
    }
  }

  function placePin(entityId: string, x: number, y: number) {
    updateEntity.mutate(
      { campaignId: campaign._id, id: entityId, data: { mapPin: { x, y } } },
      {
        onSuccess: () => {
          toast.success('Pin placed');
          setPinEntityId('');
        },
        onError: () => toast.error('Failed to place pin'),
      },
    );
  }

  function removePin(entityId: string) {
    updateEntity.mutate(
      { campaignId: campaign._id, id: entityId, data: { mapPin: null } },
      {
        onSuccess: () => toast.success('Pin removed'),
        onError: () => toast.error('Failed to remove pin'),
      },
    );
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

  // No map uploaded
  if (!worldMap) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-12 text-center texture-parchment">
        <div className="mx-auto max-w-sm">
          <h3 className="mb-2 text-lg font-semibold text-foreground font-['IM_Fell_English']">
            No World Map
          </h3>
          <p className="mb-6 text-muted-foreground">
            {isDM ? 'Upload a map of your campaign world' : 'The GM has not uploaded a world map yet'}
          </p>
          {isDM && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Uploading...</>
                ) : (
                  <><Upload className="mr-1.5 h-4 w-4" />Upload Map</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {renderControls()}

      {/* Pin mode entity selector */}
      {pinMode && renderPinSelector()}

      {/* Map viewport */}
      <div
        ref={viewportRef}
        className={`h-[60vh] overflow-hidden relative rounded-lg border bg-card/30 ${
          pinMode ? 'border-brass/50 cursor-crosshair' : 'border-border cursor-grab active:cursor-grabbing'
        }`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setIsPanning(false)}
        style={{ touchAction: 'none' }}
      >
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
            width: worldMap.width,
            height: worldMap.height,
            position: 'relative',
          }}
        >
          <img
            src={worldMap.url}
            alt="World Map"
            draggable={false}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Render pins */}
          {pinnedEntities.map((entity) => renderPin(entity))}
        </div>
      </div>

      <ConfirmDialog
        open={showRemoveConfirm}
        title="Remove World Map"
        description="The world map image will be deleted. You can upload a new one later."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemoveMap}
        onCancel={() => setShowRemoveConfirm(false)}
        isPending={removing}
      />
    </div>
  );

  function renderControls() {
    return (
      <div className="flex items-center gap-2">
        <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          World Map
        </span>
        <span className="text-[10px] text-muted-foreground">
          {worldMap!.width}x{worldMap!.height}
        </span>

        {/* Pin count badge */}
        {pinnedEntities.length > 0 && (
          <span className="rounded-full bg-brass/20 px-1.5 py-0.5 text-[10px] text-brass font-[Cinzel]">
            {pinnedEntities.length} pin{pinnedEntities.length !== 1 ? 's' : ''}
          </span>
        )}

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
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

        {/* DM actions */}
        {isDM && (
          <div className="flex items-center gap-1 ml-2 border-l border-[hsla(38,40%,30%,0.15)] pl-2">
            {/* Pin mode toggle */}
            <button
              type="button"
              onClick={() => { setPinMode(!pinMode); setPinEntityId(''); }}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors font-[Cinzel] uppercase tracking-wider ${
                pinMode
                  ? 'border-brass bg-brass/20 text-brass'
                  : 'border-brass/40 bg-brass/10 text-brass hover:bg-brass/20'
              }`}
              title={pinMode ? 'Exit pin mode' : 'Place pins on map'}
            >
              {pinMode ? <MapPinOff className="h-3 w-3" /> : <MapPinPlus className="h-3 w-3" />}
              {pinMode ? 'Done' : 'Pins'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 rounded-md border border-brass/40 bg-brass/10 px-2 py-1 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              <Upload className="h-3 w-3" />
              {uploading ? 'Uploading...' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => setShowRemoveConfirm(true)}
              className="flex items-center gap-1 rounded-md border border-blood/40 bg-blood/10 px-2 py-1 text-[10px] text-[hsl(0,55%,55%)] hover:bg-blood/20 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderPinSelector() {
    return (
      <div className="mkt-card mkt-card-mounted rounded-lg border border-brass/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <MapPinPlus className="h-4 w-4 text-brass" />
          <span className="font-[Cinzel] text-xs uppercase tracking-wider text-brass">
            Pin Mode
          </span>
          <span className="text-[10px] text-muted-foreground">
            Select an entity, then click the map to place it
          </span>
        </div>

        {pinEntityId ? (
          <div className="flex items-center gap-2 rounded-md border border-brass/30 bg-brass/10 px-3 py-2 text-sm">
            <span className="text-foreground">
              {entities?.find((e) => e._id === pinEntityId)?.name ?? 'Unknown'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              — click the map to place
            </span>
            <button
              type="button"
              onClick={() => setPinEntityId('')}
              className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {unpinnedEntities.map((entity) => {
              const Icon = TYPE_ICONS[entity.type];
              const accent = TYPE_ACCENTS[entity.type];
              return (
                <button
                  key={entity._id}
                  type="button"
                  onClick={() => setPinEntityId(entity._id)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent/50 transition-colors"
                >
                  <Icon className={`h-3 w-3 ${accent.text}`} />
                  <span className="text-foreground">{entity.name}</span>
                </button>
              );
            })}
            {unpinnedEntities.length === 0 && (
              <span className="text-xs text-muted-foreground py-1">All entities are pinned</span>
            )}
          </div>
        )}

        {/* Pinned entities with remove option */}
        {pinnedEntities.length > 0 && (
          <div className="mt-2 border-t border-border/50 pt-2">
            <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
              Pinned ({pinnedEntities.length})
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {pinnedEntities.map((entity) => {
                const Icon = TYPE_ICONS[entity.type];
                const accent = TYPE_ACCENTS[entity.type];
                return (
                  <div
                    key={entity._id}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-accent/30 px-2 py-1 text-xs"
                  >
                    <Icon className={`h-3 w-3 ${accent.text}`} />
                    <span className="text-foreground">{entity.name}</span>
                    <button
                      type="button"
                      onClick={() => removePin(entity._id)}
                      className="rounded p-0.5 text-muted-foreground hover:text-blood transition-colors"
                      title="Remove pin"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderPin(entity: WorldEntity) {
    if (!entity.mapPin || !worldMap) return null;
    const Icon = TYPE_ICONS[entity.type];
    const accent = TYPE_ACCENTS[entity.type];
    const isHovered = hoveredPin === entity._id;
    const pixelX = entity.mapPin.x * worldMap.width;
    const pixelY = entity.mapPin.y * worldMap.height;

    return (
      <div
        key={entity._id}
        className="absolute"
        style={{
          left: pixelX,
          top: pixelY,
          transform: 'translate(-50%, -100%)',
          zIndex: isHovered ? 50 : 10,
          pointerEvents: 'auto',
        }}
      >
        {/* Pin marker */}
        <button
          type="button"
          className={`group relative flex items-center justify-center transition-transform ${isHovered ? 'scale-125' : 'hover:scale-110'}`}
          style={{ width: PIN_SIZE, height: PIN_SIZE }}
          onMouseEnter={() => setHoveredPin(entity._id)}
          onMouseLeave={() => setHoveredPin(null)}
          onClick={(e) => {
            e.stopPropagation();
            if (!pinMode && onSelectEntity) onSelectEntity(entity);
          }}
        >
          {/* Pin drop shadow */}
          <div
            className="absolute rounded-full bg-black/40 blur-sm"
            style={{ width: PIN_SIZE * 0.6, height: PIN_SIZE * 0.3, bottom: -2, left: '50%', transform: 'translateX(-50%)' }}
          />
          {/* Pin body */}
          <div className={`flex h-full w-full items-center justify-center rounded-full border-2 border-background/80 shadow-lg ${accent.bg}`}
            style={{ backgroundColor: `hsl(var(--card))` }}
          >
            <Icon className={`h-3.5 w-3.5 ${accent.text}`} />
          </div>
          {/* Pin point */}
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '6px solid hsl(var(--card))',
            }}
          />
        </button>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap pointer-events-none">
            <div className="rounded-md border border-border bg-card px-2.5 py-1.5 shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="font-['IM_Fell_English'] text-sm text-card-foreground">{entity.name}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`font-[Cinzel] text-[9px] uppercase tracking-wider ${accent.text}`}>
                  {TYPE_LABELS[entity.type]}
                </span>
                {entity.locationType && (
                  <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
                    {LOCATION_TYPE_LABELS[entity.locationType as LocationType] ?? entity.locationType}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
