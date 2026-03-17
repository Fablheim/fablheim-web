import {
  Globe,
  Swords,
  Target,
  ScrollText,
  Users,
  FileText,
  Sparkles,
  BookOpen,
  User,
  NotebookPen,
  Eye,
  Map,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SessionTabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** DM sidebar tabs during a live session (narrative or combat). */
export const SESSION_DM_TABS: SessionTabDef[] = [
  { id: 'world', label: 'World', icon: Globe },
  { id: 'encounters', label: 'Encounters', icon: Swords },
  { id: 'initiative', label: 'Initiative', icon: Target },
  { id: 'map', label: 'Battle Map', icon: Map },
  { id: 'passive', label: 'Passive Checks', icon: Eye },
  { id: 'notes', label: 'Notes', icon: ScrollText },
  { id: 'handouts', label: 'Handouts', icon: FileText },
  { id: 'party', label: 'Party', icon: Users },
  { id: 'ai', label: 'AI Tools', icon: Sparkles },
];

/** Player sidebar tabs during a live session. */
export const SESSION_PLAYER_TABS: SessionTabDef[] = [
  { id: 'character', label: 'Character', icon: User },
  { id: 'party', label: 'Party', icon: Users },
  { id: 'notes', label: 'My Notes', icon: ScrollText },
  { id: 'shared-notes', label: 'Shared Notes', icon: NotebookPen },
  { id: 'handouts', label: 'Handouts', icon: FileText },
  { id: 'rules', label: 'Rules', icon: BookOpen },
];
