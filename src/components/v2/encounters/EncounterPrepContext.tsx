import { createContext, useContext, useEffect, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { toast } from 'sonner';
import { encountersApi } from '@/api/encounters';
import { useBattleMap } from '@/hooks/useBattleMap';
import {
  useCreateEncounter,
  useDeleteEncounter,
  useEncounter,
  useEncounters,
  useLoadEncounter,
  useUpdateEncounter,
} from '@/hooks/useEncounters';
import type {
  Encounter,
  EncounterParticipant,
  EncounterParticipantType,
  EncounterStatus,
  LoadEncounterRequest,
} from '@/types/encounter';
import { useWorldExplorerContext } from '../world/useWorldExplorerContext';

type PickerType = EncounterParticipantType | null;

// ── Context shape ─────────────────────────────────────────────

interface EncounterPrepContextValue {
  // Encounter selection
  selectedEncounterId: string | null;
  setSelectedEncounterId: (id: string | null) => void;

  // Modal / picker state
  pickerType: PickerType;
  setPickerType: (type: PickerType) => void;
  pickerQuery: string;
  setPickerQuery: (q: string) => void;
  showLoadOptions: boolean;
  setShowLoadOptions: (open: boolean) => void;
  loadOptions: LoadEncounterRequest;
  setLoadOptions: Dispatch<SetStateAction<LoadEncounterRequest>>;

  // Data
  encounters: Encounter[];
  encounter: Encounter | undefined;
  hasLoadedMap: boolean;

  // Participant selection (shared with center stage)
  selectedKey: string | null;
  setSelectedKey: (key: string | null) => void;
  upsertParticipant: (p: EncounterParticipant) => void;
  removeParticipant: (id: string) => void;

  // Actions
  updateEncounterPatch: (patch: Record<string, unknown>) => void;
  createBlankEncounter: () => void;
  createEncounterAndContinue: (onReady?: (id: string) => void) => void;
  openParticipantPicker: (type: EncounterParticipantType) => void;
  duplicateEncounter: () => void;
  deleteSelectedEncounter: () => void;
  cycleStatus: () => void;
  openLoadOptions: () => void;
  handleLoadToSession: () => void;

  // Pending
  isCreatePending: boolean;
  isDeletePending: boolean;
  isLoadPending: boolean;
}

// ── Context ───────────────────────────────────────────────────

const EncounterPrepContext = createContext<EncounterPrepContextValue | null>(null);

export function useEncounterPrepContext() {
  const ctx = useContext(EncounterPrepContext);
  if (!ctx) throw new Error('useEncounterPrepContext must be used within EncounterPrepProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────

interface EncounterPrepProviderProps {
  campaignId: string;
  children: ReactNode;
}

export function EncounterPrepProvider({ campaignId, children }: EncounterPrepProviderProps) {
  const { data: encountersData } = useEncounters(campaignId);
  const { data: battleMap } = useBattleMap(campaignId);
  const { pendingEncounterNavigationId, requestEncounterNavigation } = useWorldExplorerContext();

  const [selectedEncounterId, _setSelectedEncounterId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pickerType, setPickerType] = useState<PickerType>(null);

  function setSelectedEncounterId(id: string | null) {
    _setSelectedEncounterId(id);
    setSelectedKey(null);
  }
  const [pickerQuery, setPickerQuery] = useState('');
  const [showLoadOptions, setShowLoadOptions] = useState(false);

  const hasLoadedMap = !!(
    battleMap?.backgroundImageUrl ||
    battleMap?.isActive ||
    (battleMap?.tokens?.length ?? 0) > 0
  );

  const [loadOptions, setLoadOptions] = useState<LoadEncounterRequest>({
    addToInitiative: true,
    clearExisting: true,
    clearExistingMap: true,
    spawnTokens: false,
    autoRollInitiative: true,
    startCombat: false,
  });

  // Handle external encounter navigation requests
  useEffect(() => {
    if (!pendingEncounterNavigationId) return;
    setSelectedEncounterId(pendingEncounterNavigationId);
    requestEncounterNavigation(null);
  }, [pendingEncounterNavigationId, requestEncounterNavigation]);

  const { data: encounterData } = useEncounter(campaignId, selectedEncounterId ?? undefined);
  const createEncounter = useCreateEncounter(campaignId);
  const updateEncounter = useUpdateEncounter(campaignId, selectedEncounterId ?? '');
  const deleteEncounter = useDeleteEncounter(campaignId);
  const loadEncounter = useLoadEncounter(campaignId);

  const encounters = encountersData ?? [];
  const encounter = encounterData;

  function upsertParticipant(next: EncounterParticipant) {
    if (!encounter) return;
    const list = encounter.participants ?? [];
    const updated = list.some((p) => p.id === next.id)
      ? list.map((p) => (p.id === next.id ? next : p))
      : [...list, next];
    updateEncounterPatch({ participants: updated });
  }

  function removeParticipant(id: string) {
    const updated = (encounter?.participants ?? []).filter((p) => p.id !== id);
    updateEncounterPatch({ participants: updated });
  }

  function updateEncounterPatch(patch: Record<string, unknown>) {
    if (!encounter) return;
    updateEncounter.mutate(patch as never, {
      onError: () => toast.error('Failed to update encounter'),
    });
  }

  function createBlankEncounter() {
    const count = encounters.length + 1;
    createEncounter.mutate(
      { name: `Encounter ${count}`, difficulty: 'medium' },
      {
        onSuccess: (created) => {
          setSelectedEncounterId(created._id);
          toast.success('New encounter created');
        },
        onError: () => toast.error('Failed to create encounter'),
      },
    );
  }

  function createEncounterAndContinue(onReady?: (createdId: string) => void) {
    const count = encounters.length + 1;
    createEncounter.mutate(
      { name: `Encounter ${count}`, difficulty: 'medium' },
      {
        onSuccess: (created) => {
          setSelectedEncounterId(created._id);
          toast.success('New encounter created');
          onReady?.(created._id);
        },
        onError: () => toast.error('Failed to create encounter'),
      },
    );
  }

  function openParticipantPicker(type: EncounterParticipantType) {
    if (encounter) {
      setPickerType(type);
      return;
    }
    createEncounterAndContinue(() => setPickerType(type));
  }

  async function duplicateEncounter() {
    if (!encounter) return;
    try {
      const created = await createEncounter.mutateAsync({
        name: `${encounter.name} (Copy)`,
        description: encounter.description || undefined,
        difficulty: encounter.difficulty,
        estimatedXP: encounter.estimatedXP || undefined,
        locationEntityId: encounter.locationEntityId,
        sessionId: encounter.sessionId,
        gridWidth: encounter.gridWidth,
        gridHeight: encounter.gridHeight,
        gridSquareSizeFt: encounter.gridSquareSizeFt,
        backgroundImageUrl: encounter.backgroundImageUrl,
        notes: encounter.notes || undefined,
        tags: encounter.tags.length ? encounter.tags : undefined,
      });
      await encountersApi.update(campaignId, created._id, {
        status: encounter.status,
        tactics: encounter.tactics,
        terrain: encounter.terrain,
        treasure: encounter.treasure,
        hooks: encounter.hooks,
        npcs: encounter.npcs,
        participants: encounter.participants,
      });
      setSelectedEncounterId(created._id);
      toast.success('Encounter duplicated');
    } catch {
      toast.error('Failed to duplicate encounter');
    }
  }

  function deleteSelectedEncounter() {
    if (!encounter) return;
    deleteEncounter.mutate(encounter._id, {
      onSuccess: () => {
        setSelectedEncounterId(null);
        toast.success('Encounter deleted');
      },
      onError: () => toast.error('Failed to delete encounter'),
    });
  }

  function cycleStatus() {
    if (!encounter) return;
    const order: EncounterStatus[] = ['draft', 'ready', 'used'];
    const idx = order.indexOf(encounter.status);
    updateEncounterPatch({ status: order[(idx + 1) % order.length] });
  }

  function openLoadOptions() {
    setLoadOptions((prev) => ({
      ...prev,
      spawnTokens: hasLoadedMap ? prev.spawnTokens : false,
    }));
    setShowLoadOptions(true);
  }

  function handleLoadToSession() {
    if (!encounter) return;
    loadEncounter.mutate(
      {
        encounterId: encounter._id,
        body: {
          ...loadOptions,
          spawnTokens: hasLoadedMap ? loadOptions.spawnTokens : false,
        },
      },
      {
        onSuccess: () => {
          setShowLoadOptions(false);
          toast.success('Encounter loaded into session');
        },
        onError: () => toast.error('Failed to load encounter'),
      },
    );
  }

  const value: EncounterPrepContextValue = {
    selectedEncounterId,
    setSelectedEncounterId,
    selectedKey,
    setSelectedKey,
    upsertParticipant,
    removeParticipant,
    pickerType,
    setPickerType,
    pickerQuery,
    setPickerQuery,
    showLoadOptions,
    setShowLoadOptions,
    loadOptions,
    setLoadOptions,
    encounters,
    encounter,
    hasLoadedMap,
    updateEncounterPatch,
    createBlankEncounter,
    createEncounterAndContinue,
    openParticipantPicker,
    duplicateEncounter,
    deleteSelectedEncounter,
    cycleStatus,
    openLoadOptions,
    handleLoadToSession,
    isCreatePending: createEncounter.isPending,
    isDeletePending: deleteEncounter.isPending,
    isLoadPending: loadEncounter.isPending,
  };

  return (
    <EncounterPrepContext.Provider value={value}>
      {children}
    </EncounterPrepContext.Provider>
  );
}
