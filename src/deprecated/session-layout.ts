import type { PanelId } from './workspace';

/** A single slot in the session panel grid. */
export interface PanelSlotConfig {
  panelId: PanelId;
  sizePercent: number;
}

/**
 * Flat 4-slot layout for the in-session workspace.
 *
 * - topBar:    optional horizontal panel above the main area
 * - leftMain:  required left panel in the main horizontal split
 * - rightMain: required right panel in the main horizontal split
 * - bottomBar: optional horizontal panel below the main area
 *
 * No nesting. Each slot holds exactly one PanelId.
 */
export interface PanelLayout {
  topBar?: PanelSlotConfig | null;
  leftMain: PanelSlotConfig;
  rightMain: PanelSlotConfig;
  bottomBar?: PanelSlotConfig | null;
  /** Horizontal split ratio for leftMain (0-100). rightMain gets the remainder. */
  mainSplitPercent: number;
}

/** Named layout preset. */
export interface SessionLayoutPreset {
  id: string;
  name: string;
  description: string;
  layout: PanelLayout;
  builtIn?: boolean;
}
