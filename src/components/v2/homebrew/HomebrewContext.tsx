import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  useCampaignContent,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
} from '@/hooks/useContentRegistry';
import type {
  ContentEntry,
  ContentType,
  CreateContentEntryPayload,
} from '@/types/content-entry';

// Homebrew types — previously in @/types/homebrew-template, now inlined.
// These map 1:1 with ContentEntry campaign-scoped content.
export type HomebrewCategory = 'race' | 'class' | 'subclass' | 'background' | 'feat' | 'other';

export interface HomebrewTrait {
  name: string;
  description: string;
}

export interface HomebrewFeature {
  name: string;
  description: string;
  level?: number;
}

export interface HomebrewTemplate {
  _id: string;
  campaignId: string;
  createdBy: string;
  category: HomebrewCategory;
  name: string;
  description: string;
  traits: HomebrewTrait[];
  proficiencies: string[];
  abilityBonuses: Record<string, number>;
  features: HomebrewFeature[];
  prerequisites: string;
  notes: string;
  aiContext: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Category labels ──────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<HomebrewCategory, string> = {
  race: 'Race',
  class: 'Class',
  subclass: 'Subclass',
  background: 'Background',
  feat: 'Feat',
  other: 'Other',
};

export const CATEGORY_BADGE_CLASSES: Record<HomebrewCategory, string> = {
  race: 'border-[hsla(38,60%,52%,0.32)] bg-[hsla(38,60%,52%,0.1)] text-[hsl(38,82%,63%)]',
  class: 'border-[hsla(210,52%,45%,0.32)] bg-[hsla(210,52%,45%,0.12)] text-[hsl(205,80%,72%)]',
  subclass: 'border-[hsla(280,50%,55%,0.32)] bg-[hsla(280,50%,55%,0.12)] text-[hsl(280,60%,72%)]',
  background: 'border-[hsla(150,50%,45%,0.32)] bg-[hsla(150,50%,45%,0.12)] text-[hsl(150,62%,70%)]',
  feat: 'border-[hsla(0,60%,50%,0.32)] bg-[hsla(0,60%,50%,0.12)] text-[hsl(0,72%,72%)]',
  other: 'border-[hsla(32,24%,30%,0.32)] bg-[hsla(24,16%,12%,0.74)] text-[hsl(30,12%,68%)]',
};

// ── Workspace mode ───────────────────────────────────────────────────────────

export type WorkspaceMode = 'view' | 'create' | 'edit';

// ── Content → HomebrewTemplate mapping ───────────────────────────────────────

const HOMEBREW_TYPES = new Set<string>(['race', 'class', 'subclass', 'background', 'feat', 'other']);

function contentEntryToTemplate(entry: ContentEntry): HomebrewTemplate {
  const category = HOMEBREW_TYPES.has(entry.contentType)
    ? (entry.contentType as HomebrewCategory)
    : 'other';

  let traits: HomebrewTrait[] = [];
  let proficiencies: string[] = [];
  let abilityBonuses: Record<string, number> = {};
  let features: HomebrewFeature[] = [];
  let prerequisites = '';

  if (entry.raceData) {
    traits = entry.raceData.traits ?? [];
    proficiencies = entry.raceData.proficiencies ?? [];
    abilityBonuses = entry.raceData.abilityBonuses ?? {};
  }
  if (entry.classData) {
    features = (entry.classData.features ?? []).map((f) => ({
      name: f.name,
      description: f.description,
      level: f.level,
    }));
    proficiencies = [
      ...(entry.classData.armorProficiencies ?? []),
      ...(entry.classData.weaponProficiencies ?? []),
    ];
  }
  if (entry.subclassData) {
    features = (entry.subclassData.features ?? []).map((f) => ({
      name: f.name,
      description: f.description,
      level: f.level,
    }));
  }
  if (entry.backgroundData) {
    proficiencies = [
      ...(entry.backgroundData.skillProficiencies ?? []),
      ...(entry.backgroundData.toolProficiencies ?? []),
    ];
    if (entry.backgroundData.feature) {
      traits = [entry.backgroundData.feature];
    }
  }
  if (entry.featData) {
    prerequisites = entry.featData.prerequisites ?? '';
    features = (entry.featData.benefits ?? []).map((b) => ({
      name: b.name,
      description: b.description,
    }));
    abilityBonuses = entry.featData.abilityIncrease ?? {};
  }

  return {
    _id: entry._id,
    campaignId: entry.campaignId ?? '',
    createdBy: entry.createdBy ?? '',
    category,
    name: entry.name,
    description: entry.summary || entry.body || '',
    traits,
    proficiencies,
    abilityBonuses,
    features,
    prerequisites,
    notes: entry.body || '',
    aiContext: entry.aiContext || '',
    tags: entry.tags ?? [],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

// ── Editor → ContentEntry payload mapping ────────────────────────────────────

export function editorToContentPayload(
  name: string,
  category: HomebrewCategory,
  description: string,
  traits: HomebrewTrait[],
  proficiencies: string[],
  abilityBonuses: Record<string, number>,
  features: HomebrewFeature[],
  prerequisites: string,
  notes: string,
  tags: string[],
  aiContext?: string,
): CreateContentEntryPayload {
  const contentType: ContentType = category;
  const cleanBonuses: Record<string, number> = {};
  for (const [k, v] of Object.entries(abilityBonuses)) {
    if (v !== 0) cleanBonuses[k] = v;
  }

  const payload: CreateContentEntryPayload = {
    name,
    contentType,
    summary: description || undefined,
    body: notes || undefined,
    tags: tags.length ? tags : undefined,
    aiContext: aiContext || undefined,
  };

  switch (category) {
    case 'race':
      payload.raceData = {
        traits: traits.filter((t) => t.name.trim()),
        abilityBonuses: cleanBonuses,
        speed: 30,
        size: 'Medium',
        languages: [],
        proficiencies,
      };
      break;
    case 'class':
      payload.classData = {
        hitDie: 'd8',
        primaryAbility: [],
        savingThrows: [],
        skillChoices: [],
        skillCount: 0,
        armorProficiencies: proficiencies.filter((p) =>
          /armor|shield/i.test(p),
        ),
        weaponProficiencies: proficiencies.filter(
          (p) => !/armor|shield/i.test(p),
        ),
        features: features.filter((f) => f.name.trim()).map((f) => ({
          name: f.name,
          description: f.description,
          level: f.level ?? 1,
        })),
      };
      break;
    case 'subclass':
      payload.subclassData = {
        parentClassSlug: '',
        features: features.filter((f) => f.name.trim()).map((f) => ({
          name: f.name,
          description: f.description,
          level: f.level ?? 1,
        })),
      };
      break;
    case 'background':
      payload.backgroundData = {
        skillProficiencies: proficiencies,
        toolProficiencies: [],
        languages: 0,
        equipment: '',
        feature: traits[0] ?? { name: '', description: '' },
      };
      break;
    case 'feat':
      payload.featData = {
        prerequisites,
        benefits: features.filter((f) => f.name.trim()).map((f) => ({
          name: f.name,
          description: f.description,
        })),
        abilityIncrease: Object.keys(cleanBonuses).length ? cleanBonuses : undefined,
      };
      break;
    case 'other':
      // For 'other', store everything in body as markdown
      {
        const parts: string[] = [];
        if (description) parts.push(description);
        if (traits.length) {
          parts.push('## Traits');
          for (const t of traits) {
            if (t.name.trim()) parts.push(`**${t.name}:** ${t.description}`);
          }
        }
        if (features.length) {
          parts.push('## Features');
          for (const f of features) {
            if (f.name.trim()) parts.push(`**${f.name}${f.level ? ` (Lvl ${f.level})` : ''}:** ${f.description}`);
          }
        }
        if (notes) parts.push(`## Notes\n${notes}`);
        payload.body = parts.join('\n\n') || undefined;
      }
      break;
  }

  return payload;
}

// ── Context value ────────────────────────────────────────────────────────────

interface HomebrewContextValue {
  campaignId: string;
  templates: HomebrewTemplate[];
  isLoading: boolean;

  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;

  selectedTemplate: HomebrewTemplate | null;

  createTemplate: ReturnType<typeof useCreateContent>;
  updateTemplate: ReturnType<typeof useUpdateContent>;
  deleteTemplate: ReturnType<typeof useDeleteContent>;

  startCreate: () => void;
}

const HomebrewContext = createContext<HomebrewContextValue | null>(null);

export function useHomebrewContext() {
  const ctx = useContext(HomebrewContext);
  if (!ctx) throw new Error('useHomebrewContext must be used within HomebrewProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function HomebrewProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  // Fetch homebrew content from the content registry
  const { data: contentEntries, isLoading } = useCampaignContent(campaignId);
  const createTemplate = useCreateContent();
  const updateTemplate = useUpdateContent();
  const deleteTemplate = useDeleteContent();

  // Filter to homebrew types and map ContentEntry → HomebrewTemplate
  const templates = useMemo(() => {
    if (!contentEntries) return [];
    return contentEntries
      .filter((e) => HOMEBREW_TYPES.has(e.contentType))
      .map(contentEntryToTemplate);
  }, [contentEntries]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('view');

  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  // Auto-select first template when none is selected
  useEffect(() => {
    if (isCreating) return;
    if (selectedTemplateId && templates.some((t) => t._id === selectedTemplateId)) return;
    setSelectedTemplateId(templates[0]?._id ?? null);
  }, [templates, selectedTemplateId, isCreating]);

  function startCreate() {
    setIsCreating(true);
    setSelectedTemplateId(null);
    setWorkspaceMode('create');
  }

  const value: HomebrewContextValue = {
    campaignId,
    templates,
    isLoading,
    selectedTemplateId,
    setSelectedTemplateId,
    isCreating,
    setIsCreating,
    workspaceMode,
    setWorkspaceMode,
    selectedTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    startCreate,
  };

  return <HomebrewContext.Provider value={value}>{children}</HomebrewContext.Provider>;
}
