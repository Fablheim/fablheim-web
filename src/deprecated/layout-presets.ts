import type { PanelLayout, SessionLayoutPreset } from '@/types/session-layout';

const BALANCED: PanelLayout = {
  topBar: null,
  leftMain: { panelId: 'initiative', sizePercent: 100 },
  rightMain: { panelId: 'map', sizePercent: 100 },
  bottomBar: { panelId: 'chat', sizePercent: 100 },
  mainSplitPercent: 30,
};

const THEATER_OF_MIND: PanelLayout = {
  topBar: null,
  leftMain: { panelId: 'initiative', sizePercent: 100 },
  rightMain: { panelId: 'quick-reference', sizePercent: 100 },
  bottomBar: { panelId: 'chat', sizePercent: 100 },
  mainSplitPercent: 25,
};

const MAP_HEAVY: PanelLayout = {
  topBar: { panelId: 'initiative', sizePercent: 100 },
  leftMain: { panelId: 'map', sizePercent: 100 },
  rightMain: { panelId: 'party-overview', sizePercent: 100 },
  bottomBar: { panelId: 'chat', sizePercent: 100 },
  mainSplitPercent: 70,
};

const STORY_FOCUS: PanelLayout = {
  topBar: null,
  leftMain: { panelId: 'chat', sizePercent: 100 },
  rightMain: { panelId: 'quick-reference', sizePercent: 100 },
  bottomBar: { panelId: 'dice-roller', sizePercent: 100 },
  mainSplitPercent: 55,
};

export const SESSION_LAYOUT_PRESETS: SessionLayoutPreset[] = [
  { id: 'balanced', name: 'Balanced', description: 'Initiative + Map + Chat', layout: BALANCED, builtIn: true },
  { id: 'theater-of-mind', name: 'Theater of Mind', description: 'Initiative + Quick Ref + Chat', layout: THEATER_OF_MIND, builtIn: true },
  { id: 'map-heavy', name: 'Map Heavy', description: 'Initiative bar, large map + Party + Chat', layout: MAP_HEAVY, builtIn: true },
  { id: 'story-focus', name: 'Story Focus', description: 'Chat + Quick Ref + Dice Roller', layout: STORY_FOCUS, builtIn: true },
];

export const DEFAULT_SESSION_LAYOUT = BALANCED;
