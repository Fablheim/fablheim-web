import {
  LayoutDashboard,
  Swords,
  Globe,
  BookOpen,
  Users,
  Sparkles,
  ListOrdered,
  Map,
  FileText,
  MessageCircle,
  CalendarClock,
  Image,
  HelpCircle,
  Dices,
  BarChart3,
  SkipForward,
} from 'lucide-react';
import type { PanelDefinition, PanelId, CampaignStage } from '@/types/workspace';

export const PANEL_REGISTRY: Record<PanelId, PanelDefinition> = {
  // ── Prep Stage ──────────────────────────────────────────
  'campaign-overview': {
    id: 'campaign-overview',
    title: 'Campaign Overview',
    icon: LayoutDashboard,
    stages: ['prep'],
  },
  'encounter-prep': {
    id: 'encounter-prep',
    title: 'Encounter Prep',
    icon: Swords,
    stages: ['prep'],
  },
  'world-browser': {
    id: 'world-browser',
    title: 'World',
    icon: Globe,
    stages: ['prep'],
  },
  'notebook': {
    id: 'notebook',
    title: 'Notebook',
    icon: BookOpen,
    stages: ['prep'],
  },
  'characters': {
    id: 'characters',
    title: 'Characters',
    icon: Users,
    stages: ['prep', 'live'],
  },
  'ai-tools': {
    id: 'ai-tools',
    title: 'AI Tools',
    icon: Sparkles,
    stages: ['prep'],
  },

  // ── Live Stage ──────────────────────────────────────────
  'initiative': {
    id: 'initiative',
    title: 'Initiative',
    icon: ListOrdered,
    stages: ['live'],
  },
  'map': {
    id: 'map',
    title: 'Battle Map',
    icon: Map,
    stages: ['live'],
  },
  'session-notes': {
    id: 'session-notes',
    title: 'Session Notes',
    icon: FileText,
    stages: ['live'],
  },
  'encounters-live': {
    id: 'encounters-live',
    title: 'Encounters',
    icon: Swords,
    stages: ['live'],
  },
  'chat': {
    id: 'chat',
    title: 'Chat',
    icon: MessageCircle,
    stages: ['live'],
  },
  'events': {
    id: 'events',
    title: 'Events',
    icon: CalendarClock,
    stages: ['live'],
  },
  'handouts': {
    id: 'handouts',
    title: 'Handouts',
    icon: Image,
    stages: ['live'],
  },
  'ai-tools-live': {
    id: 'ai-tools-live',
    title: 'AI Tools',
    icon: Sparkles,
    stages: ['live'],
  },
  'party-overview': {
    id: 'party-overview',
    title: 'Party',
    icon: Users,
    stages: ['prep', 'live'],
  },
  'quick-reference': {
    id: 'quick-reference',
    title: 'Quick Reference',
    icon: HelpCircle,
    stages: ['live'],
  },
  'dice-roller': {
    id: 'dice-roller',
    title: 'Dice Roller',
    icon: Dices,
    stages: ['live'],
  },

  // ── Recap Stage ─────────────────────────────────────────
  'session-recap': {
    id: 'session-recap',
    title: 'Session Recap',
    icon: BookOpen,
    stages: ['recap'],
  },
  'session-statistics': {
    id: 'session-statistics',
    title: 'Statistics',
    icon: BarChart3,
    stages: ['recap'],
  },
  'session-notes-recap': {
    id: 'session-notes-recap',
    title: 'Session Notes',
    icon: FileText,
    stages: ['recap'],
  },
  'next-session': {
    id: 'next-session',
    title: 'Next Session',
    icon: SkipForward,
    stages: ['recap'],
  },
};

export function getPanelsForStage(stage: CampaignStage): PanelDefinition[] {
  return Object.values(PANEL_REGISTRY).filter((p) => p.stages.includes(stage));
}
