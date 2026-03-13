import { useCallback, useEffect, useRef, useState } from 'react';
import { getLeaves } from 'react-mosaic-component';
import type { MosaicNode } from 'react-mosaic-component';
import type { PanelId, CampaignStage } from '@/types/workspace';
import { getDefaultLayout } from '@/lib/default-layouts';

function getTreeStorageKey(campaignId: string, stage: CampaignStage) {
  return `fablheim:workspace-tree:${campaignId}:${stage}`;
}

function migrateLegacyPanelIds(
  node: MosaicNode<PanelId | 'companions'> | null,
): MosaicNode<PanelId> | null {
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

/**
 * Manages mosaic panel layout state with localStorage persistence,
 * legacy migration, per-stage storage, and intelligent panel splitting.
 */
export function useMosaicLayout(campaignId: string, stage: CampaignStage) {
  const prevStageRef = useRef(stage);

  const [tree, setTree] = useState<MosaicNode<PanelId> | null>(() =>
    loadTree(campaignId, stage) ?? getDefaultLayout(stage),
  );

  // When stage changes, load the appropriate layout
  useEffect(() => {
    if (prevStageRef.current !== stage) {
      prevStageRef.current = stage;
      const saved = loadTree(campaignId, stage);
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

  const addPanel = useCallback(
    (panelId: PanelId) => {
      setTree((currentTree) => {
        if (!currentTree) return panelId;
        if (typeof currentTree === 'string') {
          return { direction: 'row', first: currentTree, second: panelId, splitPercentage: 60 };
        }
        return {
          direction: currentTree.direction === 'row' ? 'column' : 'row',
          first: currentTree,
          second: panelId,
          splitPercentage: 75,
        };
      });
    },
    [],
  );

  const loadPreset = useCallback((newTree: MosaicNode<PanelId>) => {
    setTree(newTree);
  }, []);

  return {
    tree,
    setTree,
    activePanelIds,
    addPanel,
    loadPreset,
  };
}
