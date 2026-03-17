import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useDowntimeActivities } from '@/hooks/useDowntime';
import type { DowntimeActivity } from '@/types/downtime';

export type WorkspaceMode = 'detail' | 'create';

interface DowntimeContextValue {
  campaignId: string;
  activities: DowntimeActivity[];
  isLoading: boolean;
  selectedActivityId: string | null;
  setSelectedActivityId: (id: string | null) => void;
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  selectedActivity: DowntimeActivity | null;
  startCreate: () => void;
}

const DowntimeContext = createContext<DowntimeContextValue | null>(null);

export function useDowntimeContext() {
  const ctx = useContext(DowntimeContext);
  if (!ctx) throw new Error('useDowntimeContext must be used within DowntimeProvider');
  return ctx;
}

export function DowntimeProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const { data: activitiesData, isLoading } = useDowntimeActivities(campaignId);
  const activities = useMemo(() => activitiesData ?? [], [activitiesData]);

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('detail');

  useEffect(() => {
    if (workspaceMode !== 'detail') return;
    if (selectedActivityId && activities.some((a) => a._id === selectedActivityId)) return;
    setSelectedActivityId(activities[0]?._id ?? null);
  }, [activities, selectedActivityId, workspaceMode]);

  const selectedActivity = useMemo(
    () => activities.find((a) => a._id === selectedActivityId) ?? null,
    [activities, selectedActivityId],
  );

  function startCreate() {
    setWorkspaceMode('create');
    setSelectedActivityId(null);
  }

  const value: DowntimeContextValue = {
    campaignId,
    activities,
    isLoading,
    selectedActivityId,
    setSelectedActivityId,
    workspaceMode,
    setWorkspaceMode,
    selectedActivity,
    startCreate,
  };

  return <DowntimeContext.Provider value={value}>{children}</DowntimeContext.Provider>;
}
