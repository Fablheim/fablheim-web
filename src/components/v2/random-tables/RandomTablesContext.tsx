import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRandomTables } from '@/hooks/useRandomTables';
import type { RandomTable } from '@/types/random-table';

export type WorkspaceMode = 'view' | 'create' | 'edit';

interface RandomTablesContextValue {
  campaignId: string;
  tables: RandomTable[];
  isLoading: boolean;
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  selectedTable: RandomTable | null;
  startCreate: () => void;
}

const RandomTablesContext = createContext<RandomTablesContextValue | null>(null);

export function useRandomTablesContext() {
  const ctx = useContext(RandomTablesContext);
  if (!ctx) throw new Error('useRandomTablesContext must be used within RandomTablesProvider');
  return ctx;
}

export function RandomTablesProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const { data: tables, isLoading } = useRandomTables(campaignId);
  const allTables = useMemo(() => tables ?? [], [tables]);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('view');

  useEffect(() => {
    if (workspaceMode !== 'view') return;
    if (selectedTableId && allTables.some((t) => t._id === selectedTableId)) return;
    setSelectedTableId(allTables[0]?._id ?? null);
  }, [allTables, selectedTableId, workspaceMode]);

  const selectedTable = useMemo(
    () => allTables.find((t) => t._id === selectedTableId) ?? null,
    [allTables, selectedTableId],
  );

  function startCreate() {
    setWorkspaceMode('create');
    setSelectedTableId(null);
  }

  const value: RandomTablesContextValue = {
    campaignId,
    tables: allTables,
    isLoading,
    selectedTableId,
    setSelectedTableId,
    workspaceMode,
    setWorkspaceMode,
    selectedTable,
    startCreate,
  };

  return <RandomTablesContext.Provider value={value}>{children}</RandomTablesContext.Provider>;
}
