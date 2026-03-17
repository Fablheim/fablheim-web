import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorldEntityType } from '@/types/campaign';
import { WorldHome } from './WorldHome';
import { WorldTypeRoster } from './WorldTypeRoster';
import { WorldHierarchyView } from './WorldHierarchyView';
import { WorldEntityDetail } from './WorldEntityDetail';
import { WorldUnassigned } from './WorldUnassigned';
import { WorldCommandPalette } from './WorldCommandPalette';
import { WorldCreatePanel } from './WorldCreatePanel';
import { useWorldExplorerContext } from './useWorldExplorerContext';
import type { WorldCreateDraft } from './world-create';

/** Navigation state for the world center stage. */
export type WorldView =
  | { kind: 'home' }
  | { kind: 'type'; entityType: WorldEntityType }
  | { kind: 'hierarchy'; entityId: string }
  | { kind: 'detail'; entityId: string }
  | { kind: 'unassigned' };

export interface WorldNavigation {
  view: WorldView;
  goHome: () => void;
  goToType: (type: WorldEntityType) => void;
  goToHierarchy: (entityId: string) => void;
  goToDetail: (entityId: string) => void;
  goToUnassigned: () => void;
  goBack: () => void;
  openCreate: (draft?: WorldCreateDraft) => void;
}

interface WorldCenterStageProps {
  campaignId: string;
  isDM: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function WorldCenterStage({ campaignId, isDM, activeTab = 'world', onTabChange }: WorldCenterStageProps) {
  const [viewStack, setViewStack] = useState<WorldView[]>([{ kind: 'home' }]);
  const [createDraft, setCreateDraft] = useState<WorldCreateDraft | null>(null);
  const {
    setActiveEntityId,
    setActiveView,
    setNavigation,
    pendingEntityNavigationId,
    pendingCreateDraft,
    requestEntityNavigation,
    requestWorldCreate,
  } = useWorldExplorerContext();

  const view = viewStack[viewStack.length - 1];

  const push = useCallback((v: WorldView) => {
    setViewStack((s) => [...s, v]);
  }, []);

  const openCreate = useCallback((draft?: WorldCreateDraft) => {
    setCreateDraft(draft ?? {});
  }, []);

  const nav: WorldNavigation = useMemo(
    () => ({
      view,
      goHome: () => setViewStack([{ kind: 'home' }]),
      goToType: (type) => push({ kind: 'type', entityType: type }),
      goToHierarchy: (entityId) => push({ kind: 'hierarchy', entityId }),
      goToDetail: (entityId) => push({ kind: 'detail', entityId }),
      goToUnassigned: () => push({ kind: 'unassigned' }),
      goBack: () =>
        setViewStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      openCreate,
    }),
    [view, push, openCreate],
  );

  useEffect(() => {
    setNavigation(nav);
    setActiveView(view);

    if (view.kind === 'detail' || view.kind === 'hierarchy') {
      setActiveEntityId(view.entityId);
      return;
    }

    setActiveEntityId(null);
  }, [nav, setActiveEntityId, setActiveView, setNavigation, view]);

  useEffect(() => {
    const nextView = getInitialViewForTab(activeTab);
    setViewStack([nextView]);
    setCreateDraft(null);
  }, [activeTab]);

  useEffect(() => {
    if (!pendingEntityNavigationId) return;

    setViewStack([{ kind: 'home' }, { kind: 'detail', entityId: pendingEntityNavigationId }]);
    requestEntityNavigation(null);
  }, [pendingEntityNavigationId, requestEntityNavigation]);

  useEffect(() => {
    if (!pendingCreateDraft) return;

    setViewStack([{ kind: 'home' }]);
    setCreateDraft(pendingCreateDraft);
    requestWorldCreate(null);
  }, [pendingCreateDraft, requestWorldCreate]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <WorldCommandPalette campaignId={campaignId} nav={nav} />
      {renderView()}
      <WorldCreatePanel
        key={JSON.stringify(createDraft)}
        campaignId={campaignId}
        nav={nav}
        open={createDraft !== null}
        draft={createDraft}
        onClose={() => setCreateDraft(null)}
      />
    </div>
  );

  function renderView() {
    switch (view.kind) {
      case 'home':
        return (
          <WorldHome
            campaignId={campaignId}
            isDM={isDM}
            nav={nav}
          />
        );
      case 'type':
        return (
          <WorldTypeRoster
            campaignId={campaignId}
            isDM={isDM}
            entityType={view.entityType}
            nav={nav}
          />
        );
      case 'hierarchy':
        return (
          <WorldHierarchyView
            campaignId={campaignId}
            isDM={isDM}
            entityId={view.entityId}
            nav={nav}
          />
        );
      case 'detail':
        return (
          <WorldEntityDetail
            campaignId={campaignId}
            isDM={isDM}
            entityId={view.entityId}
            nav={nav}
            onTabChange={onTabChange}
          />
        );
      case 'unassigned':
        return (
          <WorldUnassigned
            campaignId={campaignId}
            isDM={isDM}
            nav={nav}
          />
        );
    }
  }
}

function getInitialViewForTab(tab: string): WorldView {
  switch (tab) {
    case 'npcs':
      return { kind: 'type', entityType: 'npc' };
    case 'notes':
      return { kind: 'type', entityType: 'lore' };
    case 'relationships':
      return { kind: 'type', entityType: 'faction' };
    case 'world':
    default:
      return { kind: 'home' };
  }
}
