import type { MosaicNode } from 'react-mosaic-component';
import type { LucideIcon } from 'lucide-react';

export type CampaignStage = 'prep' | 'live' | 'recap';

// ── Panel IDs ────────────────────────────────────────────

export type PrepPanelId =
  | 'campaign-overview'
  | 'encounter-prep'
  | 'world-browser'
  | 'notebook'
  | 'characters'
  | 'ai-tools'
  | 'campaign-brain';

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
  | 'quick-reference'
  | 'dice-roller';

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

// ── Workspace Preset ─────────────────────────────────────

export interface WorkspacePreset {
  id: string;
  name: string;
  stage: CampaignStage;
  mosaicTree: MosaicNode<PanelId>;
  isDefault?: boolean;
}
