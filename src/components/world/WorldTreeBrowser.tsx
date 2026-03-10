import { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  MapPin,
  Users,
  User,
  Gem,
  Swords,
  Calendar,
  ScrollText,
  Castle,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import type { WorldTreeNode, WorldEntityType, LocationType } from '@/types/campaign';
import { TYPE_LABELS, TYPE_ACCENTS, LOCATION_TYPE_LABELS } from './world-constants';

interface WorldTreeBrowserProps {
  nodes: WorldTreeNode[];
  onSelectEntity: (entityId: string) => void;
  selectedEntityId?: string | null;
}

const TYPE_TREE_ICONS: Record<WorldEntityType, LucideIcon> = {
  location: MapPin,
  location_detail: Castle,
  faction: Users,
  npc: User,
  npc_minor: User,
  item: Gem,
  quest: Swords,
  event: Calendar,
  lore: ScrollText,
};

interface TreeNodeData {
  node: WorldTreeNode;
  children: TreeNodeData[];
}

function buildTree(nodes: WorldTreeNode[]): TreeNodeData[] {
  const nodeMap = new Map<string, TreeNodeData>();
  const roots: TreeNodeData[] = [];

  // Create TreeNodeData for each node
  for (const n of nodes) {
    nodeMap.set(n._id, { node: n, children: [] });
  }

  // Assign children
  for (const n of nodes) {
    const treeNode = nodeMap.get(n._id)!;
    if (n.parentEntityId && nodeMap.has(n.parentEntityId)) {
      nodeMap.get(n.parentEntityId)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  // Sort children: locations first (by locationType scale), then other types alphabetically
  const SCALE_ORDER: LocationType[] = [
    'continent', 'region', 'kingdom', 'city', 'town', 'village',
    'district', 'building', 'landmark', 'dungeon', 'room', 'wilderness', 'other',
  ];

  function sortChildren(items: TreeNodeData[]) {
    items.sort((a, b) => {
      const aIsLoc = a.node.type === 'location' || a.node.type === 'location_detail';
      const bIsLoc = b.node.type === 'location' || b.node.type === 'location_detail';
      // Locations first
      if (aIsLoc && !bIsLoc) return -1;
      if (!aIsLoc && bIsLoc) return 1;
      // Among locations, sort by scale
      if (aIsLoc && bIsLoc) {
        const aScale = SCALE_ORDER.indexOf(a.node.locationType as LocationType);
        const bScale = SCALE_ORDER.indexOf(b.node.locationType as LocationType);
        if (aScale !== bScale) return aScale - bScale;
      }
      // Among non-locations, group by type
      if (!aIsLoc && !bIsLoc && a.node.type !== b.node.type) {
        return a.node.type.localeCompare(b.node.type);
      }
      return a.node.name.localeCompare(b.node.name);
    });
    for (const item of items) {
      sortChildren(item.children);
    }
  }

  sortChildren(roots);
  return roots;
}

function TreeItem({
  data,
  depth,
  expanded,
  onToggle,
  onSelect,
  selectedId,
}: {
  data: TreeNodeData;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId?: string | null;
}) {
  const { node, children } = data;
  const isExpanded = expanded.has(node._id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === node._id;
  const Icon = TYPE_TREE_ICONS[node.type];
  const accent = TYPE_ACCENTS[node.type];
  const isLocation = node.type === 'location' || node.type === 'location_detail';

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node._id)}
        className={`group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
          isSelected
            ? 'bg-brass/15 text-brass'
            : 'text-foreground hover:bg-accent/50'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node._id);
            }}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}

        {/* Icon */}
        <Icon className={`h-3.5 w-3.5 shrink-0 ${accent.text}`} />

        {/* Name */}
        <span className="min-w-0 truncate font-[Cinzel] text-xs">
          {node.name}
        </span>

        {/* Scale badge for locations */}
        {isLocation && node.locationType && (
          <span className="ml-auto shrink-0 rounded bg-background/40 px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
            {LOCATION_TYPE_LABELS[node.locationType as LocationType] ?? node.locationType}
          </span>
        )}

        {/* Type badge for non-locations */}
        {!isLocation && (
          <span className={`ml-auto shrink-0 rounded ${accent.bg} px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${accent.text}`}>
            {TYPE_LABELS[node.type]}
          </span>
        )}

        {/* Child count */}
        {hasChildren && (
          <span className="shrink-0 text-[9px] text-muted-foreground">
            {children.length}
          </span>
        )}
      </button>

      {/* Children */}
      {isExpanded && children.map((child) => (
        <TreeItem
          key={child.node._id}
          data={child}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </>
  );
}

export function WorldTreeBrowser({ nodes, onSelectEntity, selectedEntityId }: WorldTreeBrowserProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => buildTree(nodes), [nodes]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(nodes.filter((n) => n.childCount > 0).map((n) => n._id)));
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  // Stats
  const rootCount = tree.length;
  const totalCount = nodes.length;
  const locationCount = nodes.filter((n) => n.type === 'location' || n.type === 'location_detail').length;

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="font-['IM_Fell_English'] text-sm italic text-muted-foreground">
          No entities yet. Create locations and place things inside them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          {totalCount} entities &middot; {locationCount} locations &middot; {rootCount} top-level
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Expand
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {tree.map((item) => (
          <TreeItem
            key={item.node._id}
            data={item}
            depth={0}
            expanded={expanded}
            onToggle={toggleExpanded}
            onSelect={onSelectEntity}
            selectedId={selectedEntityId}
          />
        ))}
      </div>
    </div>
  );
}
