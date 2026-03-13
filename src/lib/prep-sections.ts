import {
  LayoutDashboard,
  Globe,
  Users,
  UserPlus,
  Swords,
  NotebookPen,
  BookOpen,
  Sparkles,
  ScrollText,
  Flag,
  Activity,
  StickyNote,
  CalendarDays,
  Dices,
  Coffee,
  Heart,
  BarChart3,
  Store,
  Blocks,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import type { PrepSection, PrepSectionDef, PrepSectionGroupDef } from '@/types/workspace';

export const PREP_SECTION_GROUPS: PrepSectionGroupDef[] = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'world', label: 'World' },
  { id: 'prep', label: 'Prep' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'system', label: 'System' },
  { id: 'player', label: 'Player' },
];

export const PREP_SECTIONS: PrepSectionDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'campaign' },
  { id: 'sessions', label: 'Session Plans', icon: BookOpen, group: 'campaign', dmOnly: true },
  { id: 'players', label: 'Players', icon: Users, group: 'campaign' },
  { id: 'handouts', label: 'Handouts', icon: FileText, group: 'campaign', dmOnly: true },
  { id: 'safety-tools', label: 'Safety Tools', icon: ShieldAlert, group: 'campaign', dmOnly: true },
  { id: 'rules', label: 'Rules Reference', icon: ScrollText, group: 'campaign' },
  { id: 'world', label: 'World Browser', icon: Globe, group: 'world' },
  { id: 'npcs', label: 'NPC Directory', icon: UserPlus, group: 'world', dmOnly: true },
  { id: 'notes', label: 'Campaign Notes', icon: NotebookPen, group: 'world', dmOnly: true },
  { id: 'relationships', label: 'Relationships', icon: Heart, group: 'world', dmOnly: true },
  { id: 'encounters', label: 'Encounters', icon: Swords, group: 'prep', dmOnly: true },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, group: 'prep', dmOnly: true },
  { id: 'random-tables', label: 'Random Tables', icon: Dices, group: 'prep', dmOnly: true },
  { id: 'downtime', label: 'Downtime', icon: Coffee, group: 'prep', dmOnly: true },
  { id: 'arcs', label: 'Story Arcs', icon: Flag, group: 'tracking' },
  { id: 'trackers', label: 'Trackers', icon: Activity, group: 'tracking' },
  { id: 'campaign-health', label: 'Campaign Health', icon: BarChart3, group: 'tracking', dmOnly: true },
  { id: 'economy', label: 'Economy', icon: Store, group: 'tracking', dmOnly: true },
  { id: 'ai-tools', label: 'AI Tools', icon: Sparkles, group: 'system', dmOnly: true },
  { id: 'modules', label: 'Module Browser', icon: Blocks, group: 'system', dmOnly: true },
  { id: 'my-notes', label: 'My Notes', icon: StickyNote, group: 'player', playerOnly: true },
];

export const DEFAULT_PREP_SECTION: PrepSection = 'encounters';
