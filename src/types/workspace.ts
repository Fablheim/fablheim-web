import type { MosaicNode } from 'react-mosaic-component';
import type { LucideIcon } from 'lucide-react';

export type CampaignStage = 'prep' | 'live' | 'recap';

/** Derived UI state: stage + combat status. Not stored — computed from server state. */
export type AppState = 'prep' | 'narrative' | 'combat' | 'recap';

// ── Panel IDs ────────────────────────────────────────────

export type PrepPanelId =
  | 'campaign-overview'
  | 'encounter-prep'
  | 'world-browser'
  | 'notebook'
  | 'characters'
  | 'ai-tools'
  | 'campaign-brain'
  | 'rules';

export type LivePanelId =
  | 'initiative'
  | 'map'
  | 'session-notes'
  | 'encounters-live'
  | 'chat'
  | 'events'
  | 'handouts'
  | 'ai-tools-live'
  | 'party-overview'
  | 'allies'
  | 'quick-reference'
  | 'dice-roller'
  | 'character-sheet';

export type RecapPanelId =
  | 'session-recap'
  | 'session-statistics'
  | 'session-notes-recap'
  | 'next-session';

export type PanelId = PrepPanelId | LivePanelId | RecapPanelId;

// ── Panel Definition ─────────────────────────────────────

export interface PanelDefinition {
  id: PanelId;
  title: string;
  icon: LucideIcon;
  stages: CampaignStage[];
}

// ── Prep Sections (sidebar nav) ──────────────────────────

export type PrepSection =
  | 'overview'
  | 'timeline'
  | 'world'
  | 'players'
  | 'npcs'
  | 'encounters'
  | 'notes'
  | 'sessions'
  | 'ai-tools'
  | 'rules'
  | 'arcs'
  | 'trackers'
  | 'calendar'
  | 'random-tables'
  | 'downtime'
  | 'relationships'
  | 'campaign-health'
  | 'economy'
  | 'modules'
  | 'safety-tools'
  | 'handouts'
  | 'homebrew'
  | 'my-notes';

export type PrepSectionGroupId =
  | 'campaign'
  | 'world'
  | 'prep'
  | 'tracking'
  | 'system'
  | 'player';

export interface PrepSectionDef {
  id: PrepSection;
  label: string;
  icon: LucideIcon;
  group: PrepSectionGroupId;
  /** When true, section is only visible to the DM / co-DM */
  dmOnly?: boolean;
  /** When true, section is only visible to players (hidden from DM) */
  playerOnly?: boolean;
}

export interface PrepSectionGroupDef {
  id: PrepSectionGroupId;
  label: string;
}

// ── Workspace Preset ─────────────────────────────────────

export interface WorkspacePreset {
  id: string;
  name: string;
  stage: CampaignStage;
  mosaicTree: MosaicNode<PanelId>;
  isDefault?: boolean;
}
