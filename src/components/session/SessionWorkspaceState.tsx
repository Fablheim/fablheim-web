import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Initiative } from '@/types/live-session';

interface SelectEntryOptions {
  pin?: boolean;
}

interface SessionWorkspaceStateValue {
  selectedEntryId: string | null;
  isPinned: boolean;
  followTurn: boolean;
  currentTurnEntryId: string | null;
  focusedEntryId: string | null;
  selectEntry: (entryId: string | null, opts?: SelectEntryOptions) => void;
  pinSelection: () => void;
  unpinSelection: () => void;
  setFollowTurn: (value: boolean) => void;
}

const SessionWorkspaceStateContext = createContext<SessionWorkspaceStateValue | null>(null);

export function SessionWorkspaceStateProvider({
  initiative,
  children,
}: {
  initiative?: Initiative;
  children: ReactNode;
}) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [followTurn, setFollowTurnState] = useState(true);

  const currentTurnEntryId =
    initiative?.isActive && initiative.entries[initiative.currentTurn]
      ? initiative.entries[initiative.currentTurn].id
      : null;

  const focusedEntryId =
    followTurn && !isPinned
      ? currentTurnEntryId ?? selectedEntryId
      : selectedEntryId;

  const value = useMemo<SessionWorkspaceStateValue>(
    () => ({
      selectedEntryId,
      isPinned,
      followTurn,
      currentTurnEntryId,
      focusedEntryId,
      selectEntry: (entryId, opts) => {
        setSelectedEntryId(entryId);
        if (opts?.pin) {
          if (entryId) {
            setIsPinned(true);
            setFollowTurnState(false);
          } else {
            setIsPinned(false);
            setFollowTurnState(true);
          }
        }
      },
      pinSelection: () => {
        if (!selectedEntryId) return;
        setIsPinned(true);
        setFollowTurnState(false);
      },
      unpinSelection: () => {
        setIsPinned(false);
        setFollowTurnState(true);
      },
      setFollowTurn: (value: boolean) => {
        setFollowTurnState(value);
        if (value) {
          setIsPinned(false);
        }
      },
    }),
    [selectedEntryId, isPinned, followTurn, currentTurnEntryId, focusedEntryId],
  );

  return (
    <SessionWorkspaceStateContext.Provider value={value}>
      {children}
    </SessionWorkspaceStateContext.Provider>
  );
}

export function useSessionWorkspaceState() {
  const context = useContext(SessionWorkspaceStateContext);
  if (!context) {
    throw new Error('useSessionWorkspaceState must be used within SessionWorkspaceStateProvider');
  }
  return context;
}
