import { useState, useRef, useCallback, useEffect, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react';
import { Upload, ZoomIn, ZoomOut, Maximize, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { api } from '@/api/client';
import type { Campaign } from '@/types/campaign';

interface WorldMapViewerProps {
  campaign: Campaign;
  isDM: boolean;
  onMapUpdated: () => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.15;

export function WorldMapViewer({ campaign, isDM, onMapUpdated }: WorldMapViewerProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [uploading, setUploading] = useState(false);

  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const worldMap = campaign.worldMap;

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

      // Update campaign with worldMap field
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
    if (!confirm('Remove the world map?')) return;

    try {
      await api.delete(`/files/${worldMap.key}`);
      await api.patch(`/campaigns/${campaign._id}`, { worldMap: null });
      toast.success('World map removed');
      onMapUpdated();
    } catch {
      toast.error('Failed to remove world map');
    }
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
    setTranslate({
      x: cursorX - ratio * (cursorX - translate.x),
      y: cursorY - ratio * (cursorY - translate.y),
    });
  }

  function handlePointerDown(e: ReactPointerEvent) {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
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

  // No map uploaded — show upload prompt
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
      {/* Controls bar */}
      <div className="flex items-center gap-2">
        <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          World Map
        </span>
        <span className="text-[10px] text-muted-foreground">
          {worldMap.width}x{worldMap.height}
        </span>
        <div className="flex-1" />
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
        {isDM && (
          <div className="flex items-center gap-1 ml-2 border-l border-[hsla(38,40%,30%,0.15)] pl-2">
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
              onClick={handleRemoveMap}
              className="flex items-center gap-1 rounded-md border border-blood/40 bg-blood/10 px-2 py-1 text-[10px] text-[hsl(0,55%,55%)] hover:bg-blood/20 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Map viewport */}
      <div
        ref={viewportRef}
        className="h-[60vh] overflow-hidden relative rounded-lg border border-border bg-card/30 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
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
        </div>
      </div>
    </div>
  );
}
