import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useCharacters, useUpdateCharacter } from '@/hooks/useCharacters';
import {
  useAddTempHP,
  useHeal,
  useRollDeathSave,
  useTakeDamage,
  useUpdateFateSkill,
} from '@/hooks/useCharacterCombat';
import { useSetLevel } from '@/hooks/useProgression';
import { useSessions } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { useArcs } from '@/hooks/useCampaigns';
import { useWorldExplorerContext } from '../world/useWorldExplorerContext';
import type { CampaignArc, Character, Session, WorldEntity } from '@/types/campaign';

// ── Context value ─────────────────────────────────────────────────────────────

interface PlayersContextValue {
  campaignId: string;
  isDM: boolean;
  onOpenWorldEntity: (entityId: string) => void;
  onOpenArcs: () => void;

  // Data
  party: Character[];
  sessionList: Session[];
  allWorldEntities: WorldEntity[];
  allArcs: CampaignArc[];
  isLoading: boolean;

  // UI state
  selectedCharacterId: string | null;
  setSelectedCharacterId: (id: string | null) => void;
  resolvedSelectedCharacterId: string | null;
  selectedCharacter: Character | null;

  // Mutations
  updateCharacter: ReturnType<typeof useUpdateCharacter>;
  takeDamage: ReturnType<typeof useTakeDamage>;
  heal: ReturnType<typeof useHeal>;
  addTempHP: ReturnType<typeof useAddTempHP>;
  rollDeathSave: ReturnType<typeof useRollDeathSave>;
  setLevel: ReturnType<typeof useSetLevel>;
  updateFateSkill: ReturnType<typeof useUpdateFateSkill>;
}

const PlayersContext = createContext<PlayersContextValue | null>(null);

export function usePlayersContext() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayersContext must be used within PlayersProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface PlayersProviderProps {
  campaignId: string;
  isDM: boolean;
  onOpenWorldEntity: (entityId: string) => void;
  onOpenArcs: () => void;
  children: ReactNode;
}

export function PlayersProvider({
  campaignId,
  isDM,
  onOpenWorldEntity,
  onOpenArcs,
  children,
}: PlayersProviderProps) {
  const { data: characters, isLoading } = useCharacters(campaignId);
  const { data: sessions } = useSessions(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const { data: arcs } = useArcs(campaignId);
  const {
    requestEntityNavigation,
    setActiveCharacterId,
    setActiveEntityId,
    setActiveSessionId,
    setActiveView,
  } = useWorldExplorerContext();

  const party = useMemo(() => characters ?? [], [characters]);
  const sessionList = useMemo(() => sessions ?? [], [sessions]);
  const allWorldEntities = useMemo(() => worldEntities ?? [], [worldEntities]);
  const allArcs = useMemo(() => arcs ?? [], [arcs]);

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const resolvedSelectedCharacterId = useMemo(() => {
    if (selectedCharacterId && party.some((character) => character._id === selectedCharacterId)) {
      return selectedCharacterId;
    }
    return party[0]?._id ?? null;
  }, [party, selectedCharacterId]);

  const selectedCharacter = useMemo(
    () => party.find((character) => character._id === resolvedSelectedCharacterId) ?? null,
    [party, resolvedSelectedCharacterId],
  );

  useEffect(() => {
    setActiveCharacterId(selectedCharacter?._id ?? null);
    setActiveEntityId(null);
    setActiveSessionId(null);
    setActiveView(null);
  }, [selectedCharacter?._id, setActiveCharacterId, setActiveEntityId, setActiveSessionId, setActiveView]);

  const updateCharacter = useUpdateCharacter();
  const takeDamage = useTakeDamage();
  const heal = useHeal();
  const addTempHP = useAddTempHP();
  const rollDeathSave = useRollDeathSave();
  const setLevel = useSetLevel();
  const updateFateSkill = useUpdateFateSkill();

  function handleOpenWorldEntity(entityId: string) {
    requestEntityNavigation(entityId);
    onOpenWorldEntity(entityId);
  }

  const value: PlayersContextValue = {
    campaignId,
    isDM,
    onOpenWorldEntity: handleOpenWorldEntity,
    onOpenArcs,
    party,
    sessionList,
    allWorldEntities,
    allArcs,
    isLoading,
    selectedCharacterId,
    setSelectedCharacterId,
    resolvedSelectedCharacterId,
    selectedCharacter,
    updateCharacter,
    takeDamage,
    heal,
    addTempHP,
    rollDeathSave,
    setLevel,
    updateFateSkill,
  };

  return <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>;
}
