import { useState, useRef, useCallback, useEffect, useMemo, type PointerEvent as ReactPointerEvent, type WheelEvent, type CSSProperties, type ReactNode } from 'react';
import { Plus, Trash2, Move, Loader2, ZoomIn, ZoomOut, Maximize, ImageOff, RefreshCw, Settings, Grid3X3, Type, Users, Eye, EyeOff, ChevronDown, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import {
  useBattleMap,
  useAddMapToken,
  useMoveMapToken,
  useRemoveMapToken,
  useUpdateMapToken,
  useUpdateMapSettings,
  useClearMap,
  useAddAoEOverlay,
  useUpdateAoEOverlay,
  useRemoveAoEOverlay,
} from '@/hooks/useBattleMap';
import { useCombatRules, useInitiative } from '@/hooks/useLiveSession';
import { useCharacters } from '@/hooks/useCharacters';
import { useEncounters, useLoadEncounter } from '@/hooks/useEncounters';
import { useAuth } from '@/context/AuthContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MapSettingsPanel } from '@/components/session/MapSettingsPanel';
import { TokenContextMenu } from '@/components/session/TokenContextMenu';
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
import { TokenHUD } from '@/components/battlemap/TokenHUD';
import { SelectedAoeControls } from '@/components/battlemap/SelectedAoeControls';
import type { MapToken } from '@/types/live-session';
import type { AoEOverlayShape, AoEOverlay } from '@/types/combat-rules';

/*
Verification checklist:
- Grid/labels persistence scope: campaign-scoped localStorage prefs via battlemapUtils (fablheim:map-prefs).
- Grid color/opacity persistence scope: campaign-scoped localStorage via battlemapUtils (fablheim:map-grid-appearance).
- F shortcut input-focus guard: shortcut ignored while focus is in input/textarea/select.
- MapTab behavior confirmed unchanged after utility extraction/parity sync.
*/

interface MapTabProps {
  campaignId: string;
  isDM: boolean;
  onTokenSelect?: (initiativeEntryId: string | undefined) => void;
  selectedEntryId?: string | null;
}

interface SpawnTokenEventDetail {
  name?: string;
  type?: MapToken['type'];
}

interface FocusActionEventDetail {
  action: 'damage' | 'heal' | 'conditions' | 'attack';
}

const TOKEN_TYPE_LABELS: Record<MapToken['type'], string> = {
  pc: 'PC',
  npc: 'NPC',
  monster: 'MON',
  other: 'OTH',
};

const DEFAULT_AOE_SHAPES: Array<{ key: AoEOverlayShape; label: string }> = [
  { key: 'sphere', label: 'Sphere' },
  { key: 'cone', label: 'Cone' },
  { key: 'line', label: 'Line' },
  { key: 'cube', label: 'Cube' },
  { key: 'cylinder', label: 'Cylinder' },
];

export function MapTab({ campaignId, isDM, onTokenSelect, selectedEntryId }: MapTabProps) {
  const { data: map, isLoading } = useBattleMap(campaignId);
  const { data: initiative } = useInitiative(campaignId);
  const addToken = useAddMapToken(campaignId);
  const moveToken = useMoveMapToken(campaignId);
  const removeToken = useRemoveMapToken(campaignId);
  const updateToken = useUpdateMapToken(campaignId);
  const updateSettings = useUpdateMapSettings(campaignId);
  const clearMap = useClearMap(campaignId);
  const addAoE = useAddAoEOverlay(campaignId);
  const updateAoE = useUpdateAoEOverlay(campaignId);
  const removeAoE = useRemoveAoEOverlay(campaignId);
  const { data: combatRules } = useCombatRules(campaignId);
  const { data: encounters } = useEncounters(campaignId);
  const loadEncounter = useLoadEncounter(campaignId);

  const { user } = useAuth();
  const { data: characters } = useCharacters(campaignId);

  // Build a set of character IDs owned by the current user
  const myCharacterIds = useMemo(() => {
    if (!user || !characters) return new Set<string>();
    return new Set(
      characters
        .filter((c) => c.userId === user._id)
        .map((c) => c._id),
    );
  }, [user, characters]);

  /** Check whether a token belongs to the current player */
  function isMyToken(token: MapToken): boolean {
    return (
      token.type === 'pc' &&
      !!token.characterId &&
      myCharacterIds.has(token.characterId)
    );
  }

  // --- State ---
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [placingToken, setPlacingToken] = useState(false);
  const [movingTokenId, setMovingTokenId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [openToolbarMenu, setOpenToolbarMenu] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');
  const [showGrid, setShowGrid] = useState(() => getInitialMapPref(campaignId, 'showGrid', true));
  const [showLabels, setShowLabels] = useState(() => getInitialMapPref(campaignId, 'showLabels', true));
  const [gridColor, setGridColor] = useState(() => getGridAppearance(campaignId).color);
  const [gridLineOpacity, setGridLineOpacity] = useState(() => getGridAppearance(campaignId).opacity);
  const [gridCellSize, setGridCellSize] = useState(() => getGridAppearance(campaignId).cellSize);
  const [gridLineThickness, setGridLineThickness] = useState(() => getGridAppearance(campaignId).thickness);

  // Add token form state
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenType, setNewTokenType] = useState<MapToken['type']>('monster');

  // Background image load state
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgRetryKey, setImgRetryKey] = useState(0);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    token: MapToken;
    x: number;
    y: number;
  } | null>(null);
  const [selectedAoEId, setSelectedAoEId] = useState<string | null>(null);
  const [placingAoE, setPlacingAoE] = useState(false);
  const [aoeShape, setAoeShape] = useState<AoEOverlayShape>('sphere');
  const [aoeColor, setAoeColor] = useState('#ff440066');
  const [aoeLabel, setAoeLabel] = useState('');
  const [draggingAoE, setDraggingAoE] = useState<{
    overlayId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [aoeDragGhost, setAoeDragGhost] = useState<{ x: number; y: number } | null>(null);
  const [resizingAoE, setResizingAoE] = useState<{
    overlayId: string;
    handle: 'n' | 's' | 'e' | 'w' | 'length' | 'width' | 'rotate';
    preview: Partial<AoEOverlay>;
  } | null>(null);
  const [aoeContextMenu, setAoeContextMenu] = useState<{
    overlayId: string;
    x: number;
    y: number;
  } | null>(null);
  const [showAoEHint, setShowAoEHint] = useState(false);
  const [spacePanActive, setSpacePanActive] = useState(false);

  // Drag-to-move state
  const [draggingToken, setDraggingToken] = useState<{
    tokenId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number } | null>(null);
  const dragStartScreenRef = useRef<{ x: number; y: number } | null>(null);
  const dragExceededRef = useRef(false);

  // Reset image state when URL changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [map?.backgroundImageUrl]);

  // Keep map token highlight in sync with shared focused entry selection.
  useEffect(() => {
    if (!map) return;
    if (!selectedEntryId) {
      setSelectedTokenId(null);
      return;
    }
    const linkedToken = map.tokens.find((token) => token.initiativeEntryId === selectedEntryId);
    if (linkedToken) {
      setSelectedTokenId(linkedToken.id);
    } else {
      setSelectedTokenId(null);
    }
  }, [map, selectedEntryId]);

  useEffect(() => {
    function onSpawnTokenEvent(event: Event) {
      if (!isDM) return;
      const customEvent = event as CustomEvent<SpawnTokenEventDetail>;
      const nextName = customEvent.detail?.name?.trim() || 'Token';
      const nextType = customEvent.detail?.type ?? 'other';
      setNewTokenName(nextName);
      setNewTokenType(nextType);
      setShowAddForm(true);
      setPlacingToken(true);
      toast.info('Click a map cell to place token');
    }
    window.addEventListener('fablheim:spawn-token', onSpawnTokenEvent as EventListener);
    return () => {
      window.removeEventListener('fablheim:spawn-token', onSpawnTokenEvent as EventListener);
    };
  }, [isDM]);

  // Zoom/pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  // Touch pinch state
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const aoeHintShownRef = useRef(false);

  // Clamp translate so at least CLAMP_MARGIN px of map stays visible
  const clampTranslate = useCallback(
    (tx: number, ty: number, s: number, overscroll = 0) => {
      const vp = viewportRef.current;
      if (!vp || !map) return { x: tx, y: ty };
      const mapWidthPx = map.gridWidth * TILE_SIZE;
      const mapHeightPx = map.gridHeight * TILE_SIZE;
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
    [map],
  );

  // Build token coverage maps for multi-size token support
  const { tokenByOrigin, coveredCells } = useMemo(() => {
    if (!map) return { tokenByOrigin: new Map<string, MapToken>(), coveredCells: new Map<string, MapToken>() };
    return buildTokenCoverage(map.tokens);
  }, [map]);

  // Current turn entry id for highlighting
  const currentTurnEntryId =
    initiative?.isActive && initiative.entries.length > 0
      ? initiative.entries[initiative.currentTurn]?.id
      : undefined;

  // Fit map to viewport
  const fitToView = useCallback(() => {
    if (!map || !viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    const mapW = map.gridWidth * TILE_SIZE;
    const mapH = map.gridHeight * TILE_SIZE;
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
  }, [map]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

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

  // Fit on first load / map change.
  // Grid spacing is an overlay concern only and must not drive camera transform.
  useEffect(() => {
    if (map) fitToView();
  }, [map, fitToView]);

  // Keyboard controls: fit, cancel, rotate, delete, space-pan
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.code === 'Space' && !isTyping) {
        setSpacePanActive(true);
        return;
      }
      if (isTyping) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        fitToView();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (draggingToken || draggingAoE || resizingAoE) {
          setDraggingToken(null);
          setDragGhost(null);
          setDraggingAoE(null);
          setAoeDragGhost(null);
          setResizingAoE(null);
          setIsPanning(false);
          return;
        }
        if (placingAoE) {
          setPlacingAoE(false);
          return;
        }
        if (placingToken || movingTokenId) {
          setPlacingToken(false);
          setMovingTokenId(null);
          return;
        }
        if (selectedAoEId) {
          setSelectedAoEId(null);
          return;
        }
        if (selectedTokenId) {
          setSelectedTokenId(null);
          onTokenSelect?.(undefined);
        }
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && isDM) {
        if (selectedAoEId) {
          e.preventDefault();
          removeAoE.mutate(selectedAoEId, {
            onSuccess: () => setSelectedAoEId(null),
          });
          return;
        }
        if (selectedTokenId) {
          e.preventDefault();
          handleRemoveToken(selectedTokenId);
        }
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && selectedAoEId && isDM) {
        e.preventDefault();
        const overlay = map?.aoeOverlays?.find((item) => item.id === selectedAoEId);
        if (!overlay) return;
        const current = overlay.angleDeg ?? 0;
        const next = (current + (e.shiftKey ? 5 : 15)) % 360;
        updateAoE.mutate({ overlayId: overlay.id, body: { angleDeg: next } });
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        setSpacePanActive(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    draggingAoE,
    draggingToken,
    fitToView,
    isDM,
    map?.aoeOverlays,
    movingTokenId,
    onTokenSelect,
    placingAoE,
    placingToken,
    removeAoE,
    resizingAoE,
    selectedAoEId,
    selectedTokenId,
    updateAoE,
  ]);

  useEffect(() => {
    function handleResize() {
      setTranslate((prev) => clampTranslate(prev.x, prev.y, scaleRef.current));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampTranslate]);

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

  useEffect(() => {
    if (map?.sourceEncounterId) {
      setSelectedEncounterId(map.sourceEncounterId);
      return;
    }
    if (!selectedEncounterId && encounters && encounters.length > 0) {
      setSelectedEncounterId(encounters[0]._id);
    }
  }, [map?.sourceEncounterId, encounters, selectedEncounterId]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!toolbarRef.current?.contains(target)) {
        setOpenToolbarMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenToolbarMenu(null);
      }
    }

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (isLoading || !map) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mapWidthPx = map.gridWidth * TILE_SIZE;
  const mapHeightPx = map.gridHeight * TILE_SIZE;
  const gridCols = Math.max(1, Math.floor(mapWidthPx / gridCellSize));
  const gridRows = Math.max(1, Math.floor(mapHeightPx / gridCellSize));
  const mapOffsetX = map.gridOffsetX ?? 0;
  const mapOffsetY = map.gridOffsetY ?? 0;
  const snapToGrid = map.snapToGrid ?? true;

  // --- Handlers ---

  function handleCellClick(x: number, y: number) {
    if (placingAoE && isDM) {
      const defaults = getDefaultAoESize(aoeShape);
      addAoE.mutate(
        {
          shape: aoeShape,
          originX: x,
          originY: y,
          color: aoeColor,
          label: aoeLabel.trim() || undefined,
          isVisible: true,
          ...defaults,
        },
        {
          onSuccess: () => {
            setPlacingAoE(false);
            if (!aoeHintShownRef.current) {
              aoeHintShownRef.current = true;
              setShowAoEHint(true);
              window.setTimeout(() => setShowAoEHint(false), 5000);
            }
            toast.success('AoE placed');
          },
          onError: (err) => toast.error(getMutationErrorMessage(err, 'Failed to place AoE')),
        },
      );
      return;
    }

    if (movingTokenId) {
      const movingToken = map!.tokens.find((t) => t.id === movingTokenId);
      const movingSize = movingToken?.size || 1;
      if (!isPositionInBounds(x, y, movingSize, gridCols, gridRows)) {
        toast.error('Out of bounds');
        setMovingTokenId(null);
        return;
      }
      if (!isAreaFree(x, y, movingSize, map!.tokens, movingTokenId)) {
        toast.error('Cell occupied');
        setMovingTokenId(null);
        return;
      }
      moveToken.mutate(
        { tokenId: movingTokenId, x, y },
        {
          onSuccess: () => setMovingTokenId(null),
          onError: (err) => {
            toast.error(getMoveErrorMessage(err));
            setMovingTokenId(null);
          },
        },
      );
      return;
    }

    if (placingToken && newTokenName.trim()) {
      if (!isPositionInBounds(x, y, 1, gridCols, gridRows)) {
        toast.error('Out of bounds');
        return;
      }
      if (!isAreaFree(x, y, 1, map!.tokens)) {
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

    // Check if a token covers this cell (supports multi-size)
    const token = coveredCells.get(`${x},${y}`);
    if (token) {
      setSelectedTokenId(token.id);
      setSelectedAoEId(null);
      onTokenSelect?.(token.initiativeEntryId);
    } else {
      setSelectedTokenId(null);
      setSelectedAoEId(null);
      onTokenSelect?.(undefined);
    }
  }

  function handleRemoveToken(tokenId: string) {
    removeToken.mutate(tokenId, {
      onError: () => toast.error('Failed to remove token'),
    });
    if (selectedTokenId === tokenId) {
      setSelectedTokenId(null);
      onTokenSelect?.(undefined);
    }
  }

  function dispatchFocusAction(action: FocusActionEventDetail['action']) {
    window.dispatchEvent(
      new CustomEvent<FocusActionEventDetail>('fablheim:focus-action', {
        detail: { action },
      }),
    );
  }

  // Zoom toward cursor
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

  // --- Drag-to-move handlers ---

  function handleTokenPointerDown(e: ReactPointerEvent, token: MapToken) {
    if (e.button !== 0) return;
    if (!isDM && !isMyToken(token)) return;
    if (placingToken || movingTokenId || placingAoE) return;

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
      offsetX: mapX - (mapOffsetX + token.x * gridCellSize),
      offsetY: mapY - (mapOffsetY + token.y * gridCellSize),
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  // Pan + drag handlers
  function handlePointerDown(e: ReactPointerEvent) {
    const shouldPan = e.button === 1 || (e.button === 0 && spacePanActive);
    if (shouldPan) {
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
    if (resizingAoE) {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const overlay = map?.aoeOverlays?.find((item) => item.id === resizingAoE.overlayId);
      if (!overlay) return;
      const effectiveOverlay = { ...overlay, ...resizingAoE.preview };
      const rect = viewport.getBoundingClientRect();
      const mapX = (e.clientX - rect.left - translateRef.current.x) / scaleRef.current;
      const mapY = (e.clientY - rect.top - translateRef.current.y) / scaleRef.current;
      const pxPerFt = gridCellSize / Math.max(1, map!.gridSquareSizeFt);
      const originPxX = mapOffsetX + effectiveOverlay.originX * gridCellSize;
      const originPxY = mapOffsetY + effectiveOverlay.originY * gridCellSize;
      const stepFt = Math.max(1, map!.gridSquareSizeFt);

      if (effectiveOverlay.shape === 'sphere') {
        const radiusPx = Math.hypot(mapX - originPxX, mapY - originPxY);
        const radiusFt = clampAoEFt(snapAoEFt(radiusPx / pxPerFt, stepFt), 5, 120);
        setResizingAoE((prev) =>
          prev ? { ...prev, preview: { ...prev.preview, radiusFt } } : prev,
        );
      } else if (effectiveOverlay.shape === 'line' || effectiveOverlay.shape === 'cone' || effectiveOverlay.shape === 'cube') {
        const angleDeg = effectiveOverlay.angleDeg ?? 0;
        const angleRad = (angleDeg * Math.PI) / 180;
        const ux = Math.cos(angleRad);
        const uy = Math.sin(angleRad);
        const dx = mapX - originPxX;
        const dy = mapY - originPxY;

        if (resizingAoE.handle === 'length') {
          const projectedPx = Math.max(0, dx * ux + dy * uy);
          const lengthFt = clampAoEFt(snapAoEFt(projectedPx / pxPerFt, stepFt), 5, 120);
          setResizingAoE((prev) =>
            prev ? { ...prev, preview: { ...prev.preview, lengthFt } } : prev,
          );
        } else if (resizingAoE.handle === 'width' && effectiveOverlay.shape === 'line') {
          const perpDistPx = Math.abs(dx * -uy + dy * ux);
          const widthFt = clampAoEFt(
            snapAoEFt((perpDistPx * 2) / pxPerFt, stepFt),
            5,
            30,
          );
          setResizingAoE((prev) =>
            prev ? { ...prev, preview: { ...prev.preview, widthFt } } : prev,
          );
        } else if (resizingAoE.handle === 'rotate') {
          let nextAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (nextAngle < 0) nextAngle += 360;
          if (e.shiftKey) {
            nextAngle = Math.round(nextAngle / 15) * 15;
          }
          setResizingAoE((prev) =>
            prev ? { ...prev, preview: { ...prev.preview, angleDeg: nextAngle % 360 } } : prev,
          );
        }
      }
      return;
    }

    if (draggingAoE) {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const mapX = (e.clientX - rect.left - translateRef.current.x) / scaleRef.current;
      const mapY = (e.clientY - rect.top - translateRef.current.y) / scaleRef.current;
      const rawGridX = (mapX - draggingAoE.offsetX - mapOffsetX) / gridCellSize;
      const rawGridY = (mapY - draggingAoE.offsetY - mapOffsetY) / gridCellSize;
      const shouldSnap = snapToGrid && !e.shiftKey;
      const gridX = shouldSnap ? Math.round(rawGridX) : Math.floor(rawGridX);
      const gridY = shouldSnap ? Math.round(rawGridY) : Math.floor(rawGridY);
      setAoeDragGhost({ x: Math.max(0, gridX), y: Math.max(0, gridY) });
      return;
    }

    // Handle token drag
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
      const rawGridX = (mapX - draggingToken.offsetX - mapOffsetX) / gridCellSize;
      const rawGridY = (mapY - draggingToken.offsetY - mapOffsetY) / gridCellSize;
      const shouldSnap = snapToGrid && !e.shiftKey;
      const gridX = shouldSnap ? Math.round(rawGridX) : Math.floor(rawGridX);
      const gridY = shouldSnap ? Math.round(rawGridY) : Math.floor(rawGridY);
      setDragGhost({ x: gridX, y: gridY });
      return;
    }

    // Handle pan
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTranslate(
      clampTranslate(translateStart.current.x + dx, translateStart.current.y + dy, scaleRef.current, 40),
    );
  }

  function handlePointerUp() {
    if (resizingAoE) {
      const body = getAoEResizePatch(resizingAoE.handle, resizingAoE.preview);
      if (body) {
        updateAoE.mutate({
          overlayId: resizingAoE.overlayId,
          body,
        });
      }
      setResizingAoE(null);
      return;
    }

    if (draggingAoE) {
      if (aoeDragGhost) {
        updateAoE.mutate({
          overlayId: draggingAoE.overlayId,
          body: { originX: aoeDragGhost.x, originY: aoeDragGhost.y },
        });
      }
      setDraggingAoE(null);
      setAoeDragGhost(null);
      return;
    }

    // Handle drag drop
    if (draggingToken) {
      if (dragExceededRef.current && dragGhost) {
        const token = map!.tokens.find((t) => t.id === draggingToken.tokenId);
        const s = token?.size || 1;
        const nextX = dragGhost.x;
        const nextY = dragGhost.y;

        if (!isPositionInBounds(nextX, nextY, s, gridCols, gridRows)) {
          toast.error('Out of bounds');
        } else if (!isAreaFree(nextX, nextY, s, map!.tokens, draggingToken.tokenId)) {
          toast.error('Cell occupied');
        } else {
          moveToken.mutate(
            { tokenId: draggingToken.tokenId, x: nextX, y: nextY },
            {
              onError: (err) => {
                toast.error(getMoveErrorMessage(err));
              },
            },
          );
        }
      } else {
        // Threshold not exceeded — treat as select
        setSelectedTokenId(draggingToken.tokenId);
        const token = map!.tokens.find((t) => t.id === draggingToken.tokenId);
        onTokenSelect?.(token?.initiativeEntryId);
      }
      setDraggingToken(null);
      setDragGhost(null);
      dragStartScreenRef.current = null;
      dragExceededRef.current = false;
      return;
    }

    // Handle pan end
    if (isPanning) {
      setTranslate((prev) => clampTranslate(prev.x, prev.y, scaleRef.current));
    }
    setIsPanning(false);
  }

  // Touch pinch-to-zoom
  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

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

  // Quick-add party characters
  async function handleAddParty() {
    if (!characters || characters.length === 0) {
      toast.error('No characters in this campaign');
      return;
    }

    const existingCharacterIds = new Set(
      map!.tokens.filter((t) => t.characterId).map((t) => t.characterId),
    );
    const newChars = characters.filter((c) => !existingCharacterIds.has(c._id));

    if (newChars.length === 0) {
      toast('All party characters are already on the map');
      return;
    }

    const startY = Math.floor(gridRows / 2);
    const workingTokens = [...map!.tokens];

    for (let i = 0; i < newChars.length; i++) {
      const c = newChars[i];
      let found = false;
      for (let y = startY; y < gridRows && !found; y++) {
        for (let x = 0; x < gridCols; x++) {
          if (!isAreaFree(x, y, 1, workingTokens)) continue;
          await addToken.mutateAsync({
            name: c.name,
            type: 'pc',
            x,
            y,
            characterId: c._id,
          });
          workingTokens.push({
            id: `virtual-${c._id}`,
            name: c.name,
            type: 'pc',
            x,
            y,
            size: 1,
            color: '#3b82f6',
            characterId: c._id,
          });
          found = true;
          break;
        }
      }
      if (!found) {
        toast.error(`No free cell for ${c.name}`);
      }
    }

    toast.success(`Added ${newChars.length} character${newChars.length > 1 ? 's' : ''} to map`);
  }

  // --- Render (max 3 direct children for tsc -b safety) ---

  return (
    <div className="flex h-full flex-col">
      {renderToolbarAndSettings()}
      {renderViewport()}
      {renderOverlays()}
    </div>
  );

  function renderToolbarAndSettings() {
    return (
      <>
        {renderToolbar()}
        {showSettings && isDM && (
          <MapSettingsPanel
            map={map!}
            showGrid={showGrid}
            onShowGridChange={setShowGrid}
            gridColor={gridColor}
            gridLineOpacity={gridLineOpacity}
            gridCellSize={gridCellSize}
            gridLineThickness={gridLineThickness}
            onGridColorChange={setGridColor}
            onGridLineOpacityChange={setGridLineOpacity}
            onGridCellSizeChange={(next) => {
              if (!Number.isFinite(next)) return;
              setGridCellSize(Math.max(10, Math.min(200, Math.round(next))));
            }}
            onGridLineThicknessChange={(next) => {
              if (!Number.isFinite(next)) return;
              setGridLineThickness(Math.max(0.5, Math.min(8, next)));
            }}
            onResetGridAppearance={() => {
              setGridColor(DEFAULT_GRID_COLOR);
              setGridLineOpacity(DEFAULT_GRID_OPACITY);
              setGridCellSize(DEFAULT_GRID_CELL_SIZE);
              setGridLineThickness(DEFAULT_GRID_THICKNESS);
            }}
            onApply={(settings) => {
              updateSettings.mutate(settings, {
                onSuccess: () => {
                  toast.success('Map settings updated');
                  setShowSettings(false);
                },
                onError: (err) => toast.error(getMutationErrorMessage(err, 'Failed to update settings')),
              });
            }}
            onClose={() => setShowSettings(false)}
            isPending={updateSettings.isPending}
          />
        )}
      </>
    );
  }

  function renderToolbar() {
    return (
      <div ref={toolbarRef} className="shrink-0 flex items-center gap-2 border-b border-[hsla(38,40%,30%,0.15)] px-3 py-2">
        <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          {map!.name || 'Battle Map'}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {map!.gridWidth}x{map!.gridHeight} ({map!.gridSquareSizeFt}ft)
        </span>
        {map!.sourceEncounterName && (
          <span className="rounded-full border border-border/60 bg-accent/40 px-2 py-0.5 text-[9px] text-muted-foreground">
            Loaded from: {map!.sourceEncounterName}
          </span>
        )}

        {isDM && (
          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            className={`rounded p-1 transition-colors ${showSettings ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}
            title="Map Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="flex-1" />

        <span className="hidden text-[9px] text-muted-foreground/60 xl:inline">
          Shift+Wheel zoom · Space+Drag or Middle-Drag pan · F fit
        </span>

        {movingTokenId && (
          <span className="text-[10px] text-primary animate-pulse font-[Cinzel] uppercase">
            Click cell to place
          </span>
        )}
        {placingAoE && (
          <span className="text-[10px] text-primary animate-pulse font-[Cinzel] uppercase">
            Click cell to place AoE
          </span>
        )}
        {placingToken && (
          <span className="text-[10px] text-primary animate-pulse font-[Cinzel] uppercase">
            Click cell to place token
          </span>
        )}

        {isDM && !placingToken && !movingTokenId && (
          <div className="flex items-center gap-1">
            {renderDMActions()}
          </div>
        )}

        {isDM && selectedTokenId && renderSelectedTokenActions()}

        {!isDM && selectedTokenId && (() => {
          const selectedToken = map!.tokens.find((t) => t.id === selectedTokenId);
          return selectedToken && isMyToken(selectedToken) ? (
            <button
              type="button"
              onClick={() => setMovingTokenId(selectedTokenId)}
              className="flex items-center gap-1 rounded-md border border-iron bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/80 transition-colors font-[Cinzel] uppercase tracking-wider"
            >
              <Move className="h-3 w-3" /> Move
            </button>
          ) : null;
        })()}

        {renderViewControls()}
      </div>
    );
  }

  function renderDMActions() {
    return (
      <>
        {renderToolbarMenu('encounter', 'Encounter', (
          <div className="space-y-2">
            <select
              value={selectedEncounterId}
              onChange={(e) => setSelectedEncounterId(e.target.value)}
              className="w-full rounded border border-iron bg-accent/40 px-2 py-1 text-[11px] text-foreground"
            >
              {(encounters ?? []).map((encounter) => (
                <option key={encounter._id} value={encounter._id}>
                  {encounter.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                disabled={!selectedEncounterId || loadEncounter.isPending}
                onClick={() => {
                  if (!selectedEncounterId) return;
                  loadEncounter.mutate(
                    {
                      encounterId: selectedEncounterId,
                      body: {
                        addToInitiative: true,
                        clearExistingMap: true,
                        clearExisting: false,
                        spawnTokens: true,
                        autoRollInitiative: true,
                        startCombat: false,
                      },
                    },
                    {
                      onSuccess: () => toast.success('Encounter loaded to map'),
                      onError: () => toast.error('Failed to load encounter'),
                    },
                  );
                }}
                className="rounded border border-brass/40 bg-brass/10 px-2 py-1 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50"
              >
                Load
              </button>
              <button
                type="button"
                disabled={!map?.sourceEncounterId || loadEncounter.isPending}
                onClick={() => setShowResetConfirm(true)}
                className="rounded border border-iron px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/60 disabled:opacity-50"
                title="Reset live map to currently loaded encounter defaults"
              >
                Reset
              </button>
            </div>
          </div>
        ))}

        {renderToolbarMenu('tokens', 'Tokens', (
          <div className="space-y-2">
            {showAddForm ? renderAddForm() : (
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center gap-1 rounded-md border border-brass/40 bg-brass/10 px-2 py-1 text-[10px] text-brass hover:bg-brass/20 transition-colors font-[Cinzel] uppercase tracking-wider"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTokenName((prev) => prev.trim() || 'New Token');
                    setPlacingToken(true);
                  }}
                  className="flex items-center justify-center gap-1 rounded-md border border-iron bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/80 transition-colors font-[Cinzel] uppercase tracking-wider"
                >
                  Quick
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleAddParty}
              disabled={addToken.isPending}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-brass/40 bg-brass/10 px-2 py-1 text-[10px] text-brass hover:bg-brass/20 disabled:opacity-50 transition-colors font-[Cinzel] uppercase tracking-wider"
              title="Add all party characters as tokens"
            >
              <Users className="h-3 w-3" /> Add Party
            </button>
            {map!.tokens.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-blood/40 bg-blood/10 px-2 py-1 text-[10px] text-[hsl(0,55%,55%)] hover:bg-blood/20 transition-colors font-[Cinzel] uppercase tracking-wider"
              >
                <Trash2 className="h-3 w-3" /> Clear All
              </button>
            )}
          </div>
        ))}

        {renderToolbarMenu('aoe', 'AoE', (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto] gap-1">
              <select
                value={aoeShape}
                onChange={(e) => setAoeShape(e.target.value as AoEOverlayShape)}
                className="rounded border border-iron bg-accent/40 px-2 py-1 text-[11px] text-foreground"
                title="AoE shape"
              >
                {(combatRules?.aoeShapes ?? DEFAULT_AOE_SHAPES).map((shape) => (
                  <option key={shape.key} value={shape.key}>
                    {shape.label}
                  </option>
                ))}
              </select>
              <input
                type="color"
                value={normalizeColorForPicker(aoeColor)}
                onChange={(e) => setAoeColor(addAlphaToHex(e.target.value, '66'))}
                className="h-7 w-8 rounded border border-iron bg-accent/40 p-0.5"
                title="AoE color"
              />
            </div>
            <input
              type="text"
              value={aoeLabel}
              onChange={(e) => setAoeLabel(e.target.value)}
              placeholder="AoE label"
              className="w-full rounded border border-iron bg-accent/40 px-2 py-1 text-[11px] text-foreground"
            />
            <button
              type="button"
              onClick={() => setPlacingAoE((prev) => !prev)}
              className={`w-full rounded border px-2 py-1 text-[10px] ${
                placingAoE
                  ? 'border-primary/40 bg-primary/20 text-primary'
                  : 'border-iron text-muted-foreground hover:bg-accent/60'
              }`}
              title="Toggle AoE placement"
            >
              {placingAoE ? 'Cancel AoE Placement' : 'Place AoE'}
            </button>
          </div>
        ))}
      </>
    );
  }

  function renderSelectedTokenActions() {
    const selectedToken = map!.tokens.find((t) => t.id === selectedTokenId);
    if (!selectedToken) return null;
    return (
      renderToolbarMenu(`token-${selectedToken.id}`, `Token: ${selectedToken.name}`, (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setMovingTokenId(selectedTokenId)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-iron bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/80 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            <Move className="h-3 w-3" /> Move
          </button>
          <button
            type="button"
            onClick={() =>
              updateToken.mutate({
                tokenId: selectedToken.id,
                body: { isHidden: !selectedToken.isHidden },
              })
            }
            className="flex w-full items-center justify-center gap-1 rounded-md border border-iron bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/80 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            {selectedToken.isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {selectedToken.isHidden ? 'Show' : 'Hide'}
          </button>
          <div className="flex items-center justify-center gap-1 rounded-md border border-iron bg-accent/60 px-1 py-1">
            {[1, 2, 3, 4].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() =>
                  updateToken.mutate({
                    tokenId: selectedToken.id,
                    body: { size },
                  })
                }
                className={`h-5 w-5 rounded text-[9px] font-bold ${(
                  selectedToken.size || 1
                ) === size ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              >
                {size}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleRemoveToken(selectedTokenId!)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-blood/40 bg-blood/10 px-2 py-1 text-[10px] text-[hsl(0,55%,55%)] hover:bg-blood/20 transition-colors font-[Cinzel] uppercase tracking-wider"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
      ))
    );
  }

  function renderViewControls() {
    return renderToolbarMenu('view', 'View', (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setShowGrid((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-1 rounded border px-2 py-1 text-[10px] ${showGrid ? 'border-primary/40 bg-primary/20 text-primary' : 'border-iron text-muted-foreground hover:bg-accent/60'}`}
            title={showGrid ? 'Hide grid' : 'Show grid'}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setShowLabels((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-1 rounded border px-2 py-1 text-[10px] ${showLabels ? 'border-primary/40 bg-primary/20 text-primary' : 'border-iron text-muted-foreground hover:bg-accent/60'}`}
            title={showLabels ? 'Hide labels' : 'Show labels'}
          >
            <Type className="h-3.5 w-3.5" />
            Labels
          </button>
        </div>
        <div className="flex items-center justify-between gap-1 rounded border border-iron bg-accent/30 px-1 py-1">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3.5ch] text-center text-[10px] text-muted-foreground font-[Cinzel]">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={fitToView}
            className="inline-flex items-center gap-1 rounded border border-iron px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
            title="Fit to screen (F)"
          >
            <Maximize className="h-3.5 w-3.5" />
            Fit
          </button>
        </div>
      </div>
    ));
  }

  function renderToolbarMenu(menuId: string, label: string, content: ReactNode) {
    const isOpen = openToolbarMenu === menuId;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenToolbarMenu((prev) => (prev === menuId ? null : menuId))}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors font-[Cinzel] uppercase tracking-wider ${
            isOpen
              ? 'border-primary/40 bg-primary/15 text-primary'
              : 'border-iron bg-accent/30 text-muted-foreground hover:bg-accent/60 hover:text-foreground'
          }`}
        >
          {label}
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full z-30 mt-1 w-[260px] rounded-md border border-border bg-card p-2 shadow-warm-lg">
            {content}
          </div>
        )}
      </div>
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
          {renderBackgroundImage()}
          {renderAoEOverlays()}
          {renderGridLines(mapPixelW, mapPixelH)}
          {renderCells(gridCols, gridRows)}
          {renderDragGhost()}
        </div>
        {renderTokenHud()}
        {renderAoEHint()}
      </div>
    );
  }

  function renderTokenHud() {
    if (!isDM) return null;
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const token = selectedTokenId
      ? map!.tokens.find((item) => item.id === selectedTokenId) ?? null
      : null;
    if (!token || token.isHidden) return null;

    const size = token.size || 1;
    const tokenCenterMapX = mapOffsetX + (token.x + size / 2) * gridCellSize;
    const tokenTopMapY = mapOffsetY + token.y * gridCellSize;
    const anchorX = tokenCenterMapX * scale + translate.x;
    const anchorY = tokenTopMapY * scale + translate.y;
    const viewW = viewport.clientWidth;
    const viewH = viewport.clientHeight;
    const inView = anchorX >= 0 && anchorX <= viewW && anchorY >= 0 && anchorY <= viewH;
    if (!inView) return null;

    return (
      <TokenHUD
        x={anchorX}
        y={anchorY}
        viewportWidth={viewW}
        viewportHeight={viewH}
        onDamage={() => dispatchFocusAction('damage')}
        onHeal={() => dispatchFocusAction('heal')}
        onConditions={() => dispatchFocusAction('conditions')}
        onAttack={() => dispatchFocusAction('attack')}
      />
    );
  }

  function renderAoEHint() {
    if (!showAoEHint) return null;
    return (
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded border border-border/70 bg-card/95 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground shadow-warm-lg">
        Drag to move • R rotate • Del remove • Esc cancel
      </div>
    );
  }

  function renderBackgroundImage() {
    if (!map!.backgroundImageUrl) return null;

    if (imgError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 pointer-events-auto cursor-pointer hover:bg-destructive/20 transition-colors"
            onClick={() => { setImgError(false); setImgRetryKey((k) => k + 1); }}
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
          src={map!.backgroundImageUrl}
          alt=""
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgLoaded(false); setImgError(true); }}
          className={`absolute inset-0 z-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
          </div>
        )}
      </>
    );
  }

  function renderAoEOverlays() {
    const overlays = map!.aoeOverlays ?? [];
    return overlays.map((overlay) => {
      if (!overlay.isVisible && !isDM) return null;

      const dragPosition =
        draggingAoE?.overlayId === overlay.id && aoeDragGhost
          ? aoeDragGhost
          : null;
      const previewOverlay =
        resizingAoE?.overlayId === overlay.id
          ? { ...overlay, ...resizingAoE.preview }
          : overlay;
      const originX = dragPosition?.x ?? previewOverlay.originX;
      const originY = dragPosition?.y ?? previewOverlay.originY;
      const effectiveOverlay = { ...previewOverlay, originX, originY };
      const isSelected = selectedAoEId === overlay.id;
      const style = getAoEOverlayStyle(
        effectiveOverlay,
        originX,
        originY,
        mapOffsetX,
        mapOffsetY,
        gridCellSize,
        map!.gridSquareSizeFt,
      );
      const coneVisualStyle = effectiveOverlay.shape === 'cone'
        ? {
            backgroundColor: effectiveOverlay.color,
            border: '1px solid rgba(255,255,255,0.5)',
            clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
            width: '100%',
            height: '100%',
            pointerEvents: 'none' as const,
          }
        : null;
      const interactiveStyle = effectiveOverlay.shape === 'cone'
        ? {
            ...style,
            backgroundColor: 'rgba(255, 255, 255, 0.001)',
            border: 'none',
            clipPath: undefined,
          }
        : style;
      const selectedStyle = isSelected
        ? {
            boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.9), 0 0 0 5px rgba(245, 158, 11, 0.2)',
          }
        : null;

      return (
        <div
          key={overlay.id}
          className={`absolute z-[8] ${isDM ? 'cursor-move' : ''}`}
          style={{ ...interactiveStyle, ...(selectedStyle ?? {}) }}
          onPointerDown={(e) => {
            if (!isDM) return;
            if (e.button === 2) {
              e.preventDefault();
              e.stopPropagation();
              setSelectedAoEId(overlay.id);
              setSelectedTokenId(null);
              onTokenSelect?.(undefined);
              setAoeContextMenu({ overlayId: overlay.id, x: e.clientX, y: e.clientY });
              return;
            }
            if (e.button !== 0) return;
            e.stopPropagation();
            const viewport = viewportRef.current;
            if (!viewport) return;
            const rect = viewport.getBoundingClientRect();
            const mapX = (e.clientX - rect.left - translateRef.current.x) / scaleRef.current;
            const mapY = (e.clientY - rect.top - translateRef.current.y) / scaleRef.current;
            const pxX = mapOffsetX + originX * gridCellSize;
            const pxY = mapOffsetY + originY * gridCellSize;
            setDraggingAoE({
              overlayId: overlay.id,
              offsetX: mapX - pxX,
              offsetY: mapY - pxY,
            });
            setSelectedAoEId(overlay.id);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAoEId(overlay.id);
            setSelectedTokenId(null);
            onTokenSelect?.(undefined);
          }}
          onContextMenu={(e) => {
            if (!isDM) return;
            e.preventDefault();
            e.stopPropagation();
            setSelectedAoEId(overlay.id);
            setSelectedTokenId(null);
            onTokenSelect?.(undefined);
            setAoeContextMenu({ overlayId: overlay.id, x: e.clientX, y: e.clientY });
          }}
          title={overlay.label || overlay.shape}
        >
          {coneVisualStyle && <div style={coneVisualStyle} />}
          <span className={`absolute -top-4 left-0 text-[10px] ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
            {overlay.label || overlay.shape}
          </span>
          {isDM && isSelected && renderAoEHandles(effectiveOverlay)}
          {isDM && isSelected && renderSelectedAoEControls(effectiveOverlay)}
        </div>
      );
    });
  }

  function renderAoEHandles(overlay: AoEOverlay) {
    const pxPerFt = gridCellSize / Math.max(1, map!.gridSquareSizeFt);
    const commonHandleClass =
      'absolute z-[14] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/70 bg-primary/30 shadow-[0_0_0_1px_hsla(38,70%,55%,0.25)]';

    function startResize(
      e: ReactPointerEvent,
      handle: 'n' | 's' | 'e' | 'w' | 'length' | 'width' | 'rotate',
    ) {
      e.stopPropagation();
      e.preventDefault();
      setResizingAoE({ overlayId: overlay.id, handle, preview: {} });
    }

    if (overlay.shape === 'sphere') {
      const radiusPx = (overlay.radiusFt ?? 20) * pxPerFt;
      return (
        <>
          <button type="button" className={commonHandleClass} style={{ left: radiusPx, top: 0 }} onPointerDown={(e) => startResize(e, 'e')} title="Resize sphere" />
          <button type="button" className={commonHandleClass} style={{ left: radiusPx, top: radiusPx * 2 }} onPointerDown={(e) => startResize(e, 's')} title="Resize sphere" />
          <button type="button" className={commonHandleClass} style={{ left: 0, top: radiusPx }} onPointerDown={(e) => startResize(e, 'w')} title="Resize sphere" />
          <button type="button" className={commonHandleClass} style={{ left: radiusPx * 2, top: radiusPx }} onPointerDown={(e) => startResize(e, 'n')} title="Resize sphere" />
        </>
      );
    }

    if (overlay.shape === 'line') {
      const lengthPx = (overlay.lengthFt ?? 20) * pxPerFt;
      const widthPx = (overlay.widthFt ?? 5) * pxPerFt;
      const tipX = lengthPx;
      const tipY = widthPx / 2;
      const rotateHandleX = lengthPx + 12;
      const rotateHandleY = widthPx / 2;
      const widthHandleX = lengthPx / 2;
      const widthHandleY = 0;

      return (
        <div
          className="absolute left-0 top-0"
          style={{ width: lengthPx, height: widthPx }}
        >
          <button type="button" className={commonHandleClass} style={{ left: tipX, top: tipY }} onPointerDown={(e) => startResize(e, 'length')} title="Resize length" />
          <button type="button" className={commonHandleClass} style={{ left: widthHandleX, top: widthHandleY }} onPointerDown={(e) => startResize(e, 'width')} title="Resize width" />
          <button
            type="button"
            className="absolute z-[14] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/70 bg-amber-300/30"
            style={{ left: rotateHandleX, top: rotateHandleY }}
            onPointerDown={(e) => startResize(e, 'rotate')}
            title="Rotate line (shift=15° snap)"
          />
        </div>
      );
    }

    if (overlay.shape === 'cone') {
      const lengthPx = (overlay.lengthFt ?? 20) * pxPerFt;
      const tipX = lengthPx;
      const tipY = lengthPx / 2;
      const rotateHandleX = lengthPx + 14;
      const rotateHandleY = lengthPx / 2;
      return (
        <div
          className="absolute left-0 top-0"
          style={{ width: lengthPx, height: lengthPx }}
        >
          <button
            type="button"
            className={commonHandleClass}
            style={{ left: tipX, top: tipY }}
            onPointerDown={(e) => startResize(e, 'length')}
            title="Resize cone length"
          />
          <button
            type="button"
            className="absolute z-[14] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/70 bg-amber-300/30"
            style={{ left: rotateHandleX, top: rotateHandleY }}
            onPointerDown={(e) => startResize(e, 'rotate')}
            title="Rotate cone (shift=15° snap)"
          />
        </div>
      );
    }

    if (overlay.shape === 'cube') {
      const lengthPx = (overlay.lengthFt ?? 15) * pxPerFt;
      const rotateHandleX = lengthPx + 14;
      const rotateHandleY = lengthPx / 2;
      return (
        <div className="absolute left-0 top-0" style={{ width: lengthPx, height: lengthPx }}>
          <button
            type="button"
            className={commonHandleClass}
            style={{ left: lengthPx, top: lengthPx }}
            onPointerDown={(e) => startResize(e, 'length')}
            title="Resize cube length"
          />
          <button
            type="button"
            className="absolute z-[14] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/70 bg-amber-300/30"
            style={{ left: rotateHandleX, top: rotateHandleY }}
            onPointerDown={(e) => startResize(e, 'rotate')}
            title="Rotate cube (shift=15° snap)"
          />
        </div>
      );
    }

    return null;
  }

  function renderSelectedAoEControls(overlay: AoEOverlay) {
    const pxPerFt = gridCellSize / Math.max(1, map!.gridSquareSizeFt);
    const radiusPx = (overlay.radiusFt ?? 20) * pxPerFt;
    const lengthPx = (overlay.lengthFt ?? 20) * pxPerFt;
    const widthPx = (overlay.widthFt ?? 5) * pxPerFt;
    const controlsLeft =
      overlay.shape === 'line' ? Math.max(8, lengthPx * 0.45) : Math.max(8, radiusPx * 1.1);
    const controlsTop =
      overlay.shape === 'line' ? Math.max(-44, widthPx / 2 - 42) : Math.max(-44, -radiusPx - 42);
    return (
      <SelectedAoeControls
        left={controlsLeft}
        top={controlsTop}
        onRotateLeft={() => {
          const current = overlay.angleDeg ?? 0;
          updateAoE.mutate({ overlayId: overlay.id, body: { angleDeg: (current - 15 + 360) % 360 } });
        }}
        onRotateRight={() => {
          const current = overlay.angleDeg ?? 0;
          updateAoE.mutate({ overlayId: overlay.id, body: { angleDeg: (current + 15) % 360 } });
        }}
        onStartResize={() =>
          setResizingAoE({
            overlayId: overlay.id,
            handle: overlay.shape === 'sphere' ? 'e' : 'length',
            preview: {},
          })
        }
        onDelete={() => {
          removeAoE.mutate(overlay.id, {
            onSuccess: () => setSelectedAoEId(null),
          });
        }}
      />
    );
  }

  function renderGridLines(mapPixelW: number, mapPixelH: number) {
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
            x1={roundToPixel(mapOffsetX + i * gridCellSize, scale)}
            y1={mapOffsetY}
            x2={roundToPixel(mapOffsetX + i * gridCellSize, scale)}
            y2={mapOffsetY + mapPixelH}
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
            x1={mapOffsetX}
            y1={roundToPixel(mapOffsetY + i * gridCellSize, scale)}
            x2={mapOffsetX + mapPixelW}
            y2={roundToPixel(mapOffsetY + i * gridCellSize, scale)}
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
        const token = tokenAtOrigin;
        const isSelected = (token?.id ?? coveringToken?.id) === selectedTokenId;
        const isCurrentTurn =
          (token?.initiativeEntryId ?? coveringToken?.initiativeEntryId) === currentTurnEntryId &&
          currentTurnEntryId != null;

        cells.push(
          <div
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              handleCellClick(x, y);
            }}
            onContextMenu={(e) => {
              const t = coveringToken || token;
              if (t && (isDM || isMyToken(t))) {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ token: t, x: e.clientX, y: e.clientY });
                setSelectedTokenId(t.id);
              }
            }}
            className={`absolute ${
              isPlacingOrMoving ? 'cursor-crosshair hover:bg-primary/10' : coveringToken ? 'cursor-pointer' : ''
            }`}
            style={{
              left: mapOffsetX + x * gridCellSize,
              top: mapOffsetY + y * gridCellSize,
              width: gridCellSize,
              height: gridCellSize,
            }}
          >
            {token && !token.isHidden && renderTokenAtOrigin(token, isSelected, isCurrentTurn, isMyToken(token))}
            {token && token.isHidden && (isDM || isMyToken(token)) && renderTokenAtOrigin(token, isSelected, isCurrentTurn, isMyToken(token))}
          </div>,
        );
      }
    }
    return cells;
  }

  function renderTokenAtOrigin(token: MapToken, isSelected: boolean, isCurrentTurn: boolean, isOwn: boolean) {
    const s = token.size || 1;
    const sizePx = s * gridCellSize;
    const circlePx = sizePx - 4;
    const fontSize = s >= 3 ? 14 : s === 2 ? 11 : 8;

    return (
      <div
        className="absolute z-10 pointer-events-auto"
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
            ${isCurrentTurn ? 'ring-2 ring-[hsl(38,80%,55%)] shadow-[0_0_8px_hsla(38,80%,55%,0.6)]' : ''}
            ${isOwn && !isSelected && !isCurrentTurn ? 'ring-2 ring-primary/50' : ''}
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
    const token = map!.tokens.find((t) => t.id === draggingToken.tokenId);
    if (!token) return null;
    const s = token.size || 1;
    const sizePx = s * gridCellSize;
    const circlePx = sizePx - 4;
    const isValid =
      isPositionInBounds(dragGhost.x, dragGhost.y, s, gridCols, gridRows) &&
      isAreaFree(dragGhost.x, dragGhost.y, s, map!.tokens, token.id);

    return (
      <div
        className="absolute pointer-events-none z-20 opacity-50"
        style={{
          left: mapOffsetX + dragGhost.x * gridCellSize,
          top: mapOffsetY + dragGhost.y * gridCellSize,
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
        <div
          className={`absolute inset-0 rounded-sm border-2 ${isValid ? 'border-green-500' : 'border-red-500'}`}
        />
      </div>
    );
  }

  function renderOverlays() {
    return (
      <>
        {aoeContextMenu && (
          <div
            className="fixed inset-0 z-40"
            onMouseDown={() => setAoeContextMenu(null)}
          >
            <div
              className="absolute z-50 w-44 rounded-md border border-border bg-card p-1 shadow-warm-lg"
              style={{ left: aoeContextMenu.x, top: aoeContextMenu.y }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => {
                  const overlay = map!.aoeOverlays.find((item) => item.id === aoeContextMenu.overlayId);
                  if (!overlay) return;
                  const next = ((overlay.angleDeg ?? 0) - 15 + 360) % 360;
                  updateAoE.mutate({ overlayId: overlay.id, body: { angleDeg: next } });
                  setAoeContextMenu(null);
                }}
              >
                Rotate Left <RotateCw className="h-3.5 w-3.5 rotate-180" />
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => {
                  const overlay = map!.aoeOverlays.find((item) => item.id === aoeContextMenu.overlayId);
                  if (!overlay) return;
                  const next = ((overlay.angleDeg ?? 0) + 15) % 360;
                  updateAoE.mutate({ overlayId: overlay.id, body: { angleDeg: next } });
                  setAoeContextMenu(null);
                }}
              >
                Rotate Right <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="mt-1 flex w-full items-center justify-between rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/20"
                onClick={() => {
                  removeAoE.mutate(aoeContextMenu.overlayId, {
                    onSuccess: () => {
                      if (selectedAoEId === aoeContextMenu.overlayId) setSelectedAoEId(null);
                    },
                  });
                  setAoeContextMenu(null);
                }}
              >
                Remove <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
        {contextMenu && (
          <TokenContextMenu
            token={contextMenu.token}
            position={{ x: contextMenu.x, y: contextMenu.y }}
            isDM={isDM}
            isOwn={isMyToken(contextMenu.token)}
            onMove={() => {
              setMovingTokenId(contextMenu.token.id);
              setContextMenu(null);
            }}
            onRemove={() => {
              handleRemoveToken(contextMenu.token.id);
              setContextMenu(null);
            }}
            onToggleHidden={() => {
              updateToken.mutate({
                tokenId: contextMenu.token.id,
                body: { isHidden: !contextMenu.token.isHidden },
              });
              setContextMenu(null);
            }}
            onSetSize={(size) => {
              updateToken.mutate({
                tokenId: contextMenu.token.id,
                body: { size },
              });
              setContextMenu(null);
            }}
            onClose={() => setContextMenu(null)}
          />
        )}
        <ConfirmDialog
          open={showClearConfirm}
          title="Clear Battle Map"
          description="Remove all tokens from the map? This cannot be undone."
          confirmLabel="Clear All"
          variant="destructive"
          isPending={clearMap.isPending}
          onConfirm={() => {
            clearMap.mutate(undefined, {
              onSuccess: () => {
                setShowClearConfirm(false);
                setSelectedTokenId(null);
                toast.success('Map cleared');
              },
              onError: () => toast.error('Failed to clear map'),
            });
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
        <ConfirmDialog
          open={showResetConfirm}
          title="Reset Live Map to Encounter Defaults"
          description="This will replace current live map settings and tokens with the loaded encounter template."
          confirmLabel="Reset Map"
          isPending={loadEncounter.isPending}
          onConfirm={() => {
            if (!map?.sourceEncounterId) {
              setShowResetConfirm(false);
              return;
            }
            loadEncounter.mutate(
              {
                encounterId: map.sourceEncounterId,
                body: {
                  addToInitiative: false,
                  clearExistingMap: true,
                  clearExisting: false,
                  spawnTokens: true,
                  autoRollInitiative: false,
                  startCombat: false,
                },
              },
              {
                onSuccess: () => {
                  setShowResetConfirm(false);
                  setSelectedTokenId(null);
                  toast.success('Live map reset to encounter defaults');
                },
                onError: () => toast.error('Failed to reset live map'),
              },
            );
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      </>
    );
  }
}

function getMoveErrorMessage(err: unknown): string {
  return getMutationErrorMessage(err, 'Failed to move token');
}

function getDefaultAoESize(shape: AoEOverlayShape): {
  radiusFt?: number;
  lengthFt?: number;
  widthFt?: number;
  angleDeg?: number;
} {
  if (shape === 'line') return { lengthFt: 30, widthFt: 5 };
  if (shape === 'cone') return { lengthFt: 15, angleDeg: 0 };
  if (shape === 'cube') return { lengthFt: 15 };
  return { radiusFt: 20 };
}

function getAoEOverlayStyle(
  overlay: {
    shape: AoEOverlayShape;
    radiusFt?: number;
    lengthFt?: number;
    widthFt?: number;
    angleDeg?: number;
    color: string;
  },
  originX: number,
  originY: number,
  mapOffsetX: number,
  mapOffsetY: number,
  gridCellSize: number,
  gridSquareSizeFt: number,
): CSSProperties {
  const pxPerFt = gridCellSize / Math.max(1, gridSquareSizeFt);
  const originPxX = mapOffsetX + originX * gridCellSize;
  const originPxY = mapOffsetY + originY * gridCellSize;
  const radiusPx = (overlay.radiusFt ?? 20) * pxPerFt;
  const lengthPx = (overlay.lengthFt ?? 20) * pxPerFt;
  const widthPx = (overlay.widthFt ?? 5) * pxPerFt;

  if (overlay.shape === 'line') {
    return {
      left: originPxX,
      top: originPxY - widthPx / 2,
      width: lengthPx,
      height: widthPx,
      backgroundColor: overlay.color,
      border: '1px solid rgba(255,255,255,0.5)',
      transform: `rotate(${overlay.angleDeg ?? 0}deg)`,
      transformOrigin: 'left center',
    };
  }

  if (overlay.shape === 'cube') {
    return {
      left: originPxX - lengthPx / 2,
      top: originPxY - lengthPx / 2,
      width: lengthPx,
      height: lengthPx,
      backgroundColor: overlay.color,
      border: '1px solid rgba(255,255,255,0.5)',
    };
  }

  if (overlay.shape === 'cone') {
    return {
      left: originPxX,
      top: originPxY - lengthPx / 2,
      width: lengthPx,
      height: lengthPx,
      backgroundColor: overlay.color,
      border: '1px solid rgba(255,255,255,0.5)',
      clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
      transform: `rotate(${overlay.angleDeg ?? 0}deg)`,
      transformOrigin: 'left center',
    };
  }

  return {
    left: originPxX - radiusPx,
    top: originPxY - radiusPx,
    width: radiusPx * 2,
    height: radiusPx * 2,
    backgroundColor: overlay.color,
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: '9999px',
  };
}

function normalizeColorForPicker(color: string): string {
  if (color.startsWith('#') && (color.length === 9 || color.length === 5)) {
    return color.slice(0, color.length - 2);
  }
  return color.length >= 7 ? color.slice(0, 7) : '#ff4400';
}

function addAlphaToHex(color: string, alpha: string): string {
  if (!color.startsWith('#')) return color;
  if (color.length === 7) return `${color}${alpha}`;
  if (color.length === 9) return `${color.slice(0, 7)}${alpha}`;
  return color;
}

function snapAoEFt(valueFt: number, stepFt: number): number {
  if (!Number.isFinite(valueFt)) return 0;
  const step = Math.max(1, stepFt);
  return Math.round(valueFt / step) * step;
}

function clampAoEFt(valueFt: number, minFt: number, maxFt: number): number {
  return Math.max(minFt, Math.min(maxFt, valueFt));
}

function getAoEResizePatch(
  handle: 'n' | 's' | 'e' | 'w' | 'length' | 'width' | 'rotate',
  preview: Partial<AoEOverlay>,
): { radiusFt?: number; lengthFt?: number; widthFt?: number; angleDeg?: number } | null {
  if (handle === 'n' || handle === 's' || handle === 'e' || handle === 'w') {
    if (preview.radiusFt === undefined) return null;
    return { radiusFt: preview.radiusFt };
  }
  if (handle === 'length') {
    if (preview.lengthFt === undefined) return null;
    return { lengthFt: preview.lengthFt };
  }
  if (handle === 'width') {
    if (preview.widthFt === undefined) return null;
    return { widthFt: preview.widthFt };
  }
  if (handle === 'rotate') {
    if (preview.angleDeg === undefined) return null;
    return { angleDeg: preview.angleDeg };
  }
  return null;
}

function getMutationErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const message = err.response?.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.length > 0) return String(message[0]);
  if (err.response?.status === 403) return "You can only move your own character's token";
  return fallback;
}
