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
} from 'lucide-react';
import type { PrepSection, PrepSectionDef } from '@/types/workspace';

export const PREP_SECTIONS: PrepSectionDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'world', label: 'World', icon: Globe },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'npcs', label: 'NPCs', icon: UserPlus, dmOnly: true },
  { id: 'encounters', label: 'Encounters', icon: Swords, dmOnly: true },
  { id: 'notes', label: 'Notes', icon: NotebookPen, dmOnly: true },
  { id: 'sessions', label: 'Sessions', icon: BookOpen, dmOnly: true },
  { id: 'my-notes', label: 'My Notes', icon: StickyNote, playerOnly: true },
  { id: 'arcs', label: 'Arcs', icon: Flag },
  { id: 'trackers', label: 'Trackers', icon: Activity },
  { id: 'ai-tools', label: 'AI Tools', icon: Sparkles, dmOnly: true },
  { id: 'rules', label: 'Rules', icon: ScrollText },
];

export const DEFAULT_PREP_SECTION: PrepSection = 'encounters';
