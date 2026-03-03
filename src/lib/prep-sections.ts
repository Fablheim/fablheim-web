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
} from 'lucide-react';
import type { PrepSection, PrepSectionDef } from '@/types/workspace';

export const PREP_SECTIONS: PrepSectionDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'world', label: 'World', icon: Globe },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'npcs', label: 'NPCs', icon: UserPlus },
  { id: 'encounters', label: 'Encounters', icon: Swords },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
  { id: 'sessions', label: 'Sessions', icon: BookOpen },
  { id: 'ai-tools', label: 'AI Tools', icon: Sparkles },
  { id: 'rules', label: 'Rules', icon: ScrollText },
];

export const DEFAULT_PREP_SECTION: PrepSection = 'encounters';
