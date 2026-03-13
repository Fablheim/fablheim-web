import {
  createContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { WorldNavigation, WorldView } from './WorldCenterStage';
import type { WorldCreateDraft } from './world-create';

interface WorldExplorerContextValue {
  activeEntityId: string | null;
  activeCharacterId: string | null;
  activeSessionId: string | null;
  activeView: WorldView | null;
  navigation: WorldNavigation | null;
  pendingEntityNavigationId: string | null;
  pendingSessionNavigationId: string | null;
  pendingCreateDraft: WorldCreateDraft | null;
  setActiveEntityId: (entityId: string | null) => void;
  setActiveCharacterId: (characterId: string | null) => void;
  setActiveSessionId: (sessionId: string | null) => void;
  setActiveView: (view: WorldView | null) => void;
  setNavigation: (navigation: WorldNavigation | null) => void;
  requestEntityNavigation: (entityId: string | null) => void;
  requestSessionNavigation: (sessionId: string | null) => void;
  requestWorldCreate: (draft: WorldCreateDraft | null) => void;
}

const WorldExplorerContext = createContext<WorldExplorerContextValue | null>(null);

export function WorldExplorerProvider({ children }: { children: ReactNode }) {
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WorldView | null>(null);
  const [navigation, setNavigation] = useState<WorldNavigation | null>(null);
  const [pendingEntityNavigationId, setPendingEntityNavigationId] = useState<string | null>(null);
  const [pendingSessionNavigationId, setPendingSessionNavigationId] = useState<string | null>(null);
  const [pendingCreateDraft, setPendingCreateDraft] = useState<WorldCreateDraft | null>(null);

  const value = useMemo(
    () => ({
      activeEntityId,
      activeCharacterId,
      activeSessionId,
      activeView,
      navigation,
      pendingEntityNavigationId,
      pendingSessionNavigationId,
      pendingCreateDraft,
      setActiveEntityId,
      setActiveCharacterId,
      setActiveSessionId,
      setActiveView,
      setNavigation,
      requestEntityNavigation: setPendingEntityNavigationId,
      requestSessionNavigation: setPendingSessionNavigationId,
      requestWorldCreate: setPendingCreateDraft,
    }),
    [
      activeEntityId,
      activeCharacterId,
      activeSessionId,
      activeView,
      navigation,
      pendingCreateDraft,
      pendingEntityNavigationId,
      pendingSessionNavigationId,
    ],
  );

  return (
    <WorldExplorerContext.Provider value={value}>
      {children}
    </WorldExplorerContext.Provider>
  );
}

export { WorldExplorerContext };
