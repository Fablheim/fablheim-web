import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mosaic, MosaicWindow, getLeaves } from 'react-mosaic-component';
import { toast } from 'sonner';
import 'react-mosaic-component/react-mosaic-component.css';
import './workspace.css';

import type { MosaicNode, MosaicBranch } from 'react-mosaic-component';
import type { PanelId, CampaignStage } from '@/types/workspace';
import type { Campaign } from '@/types/campaign';
import { PANEL_REGISTRY } from '@/lib/panel-registry';
import { getDefaultLayout } from '@/lib/default-layouts';
import { useCampaignStage } from '@/hooks/useCampaignStage';
import { useAuth } from '@/context/AuthContext';
import { useSessions } from '@/hooks/useSessions';
import { useAccessibleCampaigns } from '@/hooks/useCampaignMembers';
import { WorkspaceNav } from './WorkspaceNav';
import { PanelRenderer } from './PanelRenderer';
import { PrepWorkspace } from './PrepWorkspace';

interface CampaignWorkspaceProps {
  campaignId: string;
  campaign: Campaign;
}

function getTreeStorageKey(campaignId: string, stage: CampaignStage) {
  return `fablheim:workspace-tree:${campaignId}:${stage}`;
}

function migrateLegacyPanelIds(node: MosaicNode<PanelId | 'companions'> | null): MosaicNode<PanelId> | null {
  if (!node) return null;
  if (typeof node === 'string') {
    return (node === 'companions' ? 'allies' : node) as PanelId;
  }
  return {
    ...node,
    first: migrateLegacyPanelIds(node.first)!,
    second: migrateLegacyPanelIds(node.second)!,
  };
}

function loadTree(campaignId: string, stage: CampaignStage): MosaicNode<PanelId> | null {
  try {
    const raw = localStorage.getItem(getTreeStorageKey(campaignId, stage));
    return raw ? migrateLegacyPanelIds(JSON.parse(raw) as MosaicNode<PanelId | 'companions'>) : null;
  } catch {
    return null;
  }
}

function saveTree(campaignId: string, stage: CampaignStage, tree: MosaicNode<PanelId> | null) {
  if (tree) {
    localStorage.setItem(getTreeStorageKey(campaignId, stage), JSON.stringify(tree));
  }
}

export function CampaignWorkspace({ campaignId, campaign }: CampaignWorkspaceProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    stage,
    activeSessionId,
    startSession,
    endSession,
    returnToPrep,
    isTransitioning,
  } = useCampaignStage(campaignId);

  const { data: accessibleCampaigns } = useAccessibleCampaigns();
  const campaignRole = accessibleCampaigns?.find((c) => c._id === campaignId)?.role;
  const isDM = campaignRole === 'dm' || campaignRole === 'co_dm' || campaign.dmId === user?._id;

  const { data: sessions } = useSessions(campaignId);
  const activeSession = sessions?.find((s) => s._id === activeSessionId);

  // Redirect to session when campaign is live
  useEffect(() => {
    if (stage === 'live') {
      navigate(`/app/campaigns/${campaignId}/session`, { replace: true });
    }
  }, [stage, campaignId, navigate]);

  // Track previous stage to detect transitions
  const prevStageRef = useRef(stage);

  const [tree, setTree] = useState<MosaicNode<PanelId> | null>(() =>
    loadTree(campaignId, stage) ?? getDefaultLayout(stage),
  );

  // When stage changes, load the appropriate layout
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      prevStageRef.current = stage;
      const saved = loadTree(campaignId, stage);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing layout from stage change
      setTree(saved ?? getDefaultLayout(stage));
    }
  }, [stage, campaignId]);

  // Persist tree changes
  useEffect(() => {
    if (tree) {
      saveTree(campaignId, stage, tree);
    }
  }, [tree, campaignId, stage]);

  const activePanelIds = tree ? (getLeaves(tree) as PanelId[]) : [];

  const handleAddPanel = useCallback(
    (panelId: PanelId) => {
      if (!tree) {
        setTree(panelId);
        return;
      }
      if (typeof tree === 'string') {
        setTree({ direction: 'row', first: tree, second: panelId, splitPercentage: 60 });
        return;
      }
      // Alternate direction to avoid all-horizontal layouts
      setTree({
        direction: tree.direction === 'row' ? 'column' : 'row',
        first: tree,
        second: panelId,
        splitPercentage: 75,
      });
    },
    [tree],
  );

  const handleLoadPreset = useCallback((newTree: MosaicNode<PanelId>) => {
    setTree(newTree);
  }, []);

  const handleStartSession = useCallback(() => {
    startSession.mutate(undefined, {
      onSuccess: () => toast.success('Session started!'),
      onError: (err) => toast.error(`Failed to start session: ${(err as Error).message}`),
    });
  }, [startSession]);

  const handleEndSession = useCallback(() => {
    endSession.mutate(undefined, {
      onSuccess: () => toast.success('Session ended'),
      onError: (err) => toast.error(`Failed to end session: ${(err as Error).message}`),
    });
  }, [endSession]);

  const handleReturnToPrep = useCallback(() => {
    returnToPrep.mutate(undefined, {
      onSuccess: () => toast.success('Returned to prep'),
      onError: (err) => toast.error(`Failed to return to prep: ${(err as Error).message}`),
    });
  }, [returnToPrep]);

  const renderTile = useCallback(
    (id: PanelId, path: MosaicBranch[]) => {
      const panel = PANEL_REGISTRY[id];
      const Icon = panel?.icon;

      return (
        <MosaicWindow<PanelId>
          path={path}
          title={panel?.title ?? id}
          renderToolbar={(props) => (
            <div className="mosaic-window-toolbar">
              <div className="mosaic-window-title">
                {Icon && <Icon style={{ width: 14, height: 14, opacity: 0.6 }} />}
                <span>{props.title}</span>
              </div>
              <div className="mosaic-window-controls">
                {props.toolbarControls}
              </div>
            </div>
          )}
        >
          <PanelRenderer
            panelId={id}
            campaign={campaign}
            isDM={isDM}
            sessionId={activeSessionId}
          />
        </MosaicWindow>
      );
    },
    [campaign, isDM, activeSessionId],
  );

  return (
    <div className="flex h-full flex-col">
      <WorkspaceNav
        campaignId={campaignId}
        campaignName={campaign.name}
        stage={stage}
        isDM={isDM}
        isTransitioning={isTransitioning}
        activePanelIds={activePanelIds}
        currentTree={tree}
        sessionStartedAt={activeSession?.startedAt}
        onStartSession={handleStartSession}
        onEndSession={handleEndSession}
        onReturnToPrep={handleReturnToPrep}
        onAddPanel={handleAddPanel}
        onLoadPreset={handleLoadPreset}
      />
      <div className="relative flex-1">
        {stage === 'prep' ? (
          <PrepWorkspace campaign={campaign} isDM={isDM} />
        ) : (
          <Mosaic<PanelId>
            renderTile={renderTile}
            value={tree}
            onChange={setTree}
            className="mosaic-fablheim"
          />
        )}
      </div>
    </div>
  );
}
