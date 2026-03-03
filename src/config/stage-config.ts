import { BookOpen, Flame, ScrollText } from 'lucide-react';
import type { CampaignStage } from '@/types/campaign';

export const stageConfig: Record<
  CampaignStage,
  {
    label: string;
    Icon: typeof BookOpen;
    color: string;
    bg: string;
    border: string;
  }
> = {
  prep: {
    label: 'Prep',
    Icon: BookOpen,
    color: 'text-[hsl(38,80%,60%)]',
    bg: 'bg-[hsl(38,80%,60%)]/15',
    border: 'border-l-[hsl(38,80%,60%)]',
  },
  live: {
    label: 'Live',
    Icon: Flame,
    color: 'text-[hsl(5,84%,58%)]',
    bg: 'bg-[hsl(5,84%,58%)]/15',
    border: 'border-l-[hsl(5,84%,58%)]',
  },
  recap: {
    label: 'Recap',
    Icon: ScrollText,
    color: 'text-[hsl(200,60%,60%)]',
    bg: 'bg-[hsl(200,60%,60%)]/15',
    border: 'border-l-[hsl(200,60%,60%)]',
  },
};

export const stageOrder: CampaignStage[] = ['prep', 'live', 'recap'];
