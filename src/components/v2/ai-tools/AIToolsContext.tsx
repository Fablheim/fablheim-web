import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookOpen,
  Castle,
  ClipboardList,
  Compass,
  Map,
  ScrollText,
  ShieldQuestion,
  Sparkles,
  Store,
  Swords,
  Users,
  WandSparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCreditBalance, useCreditCosts } from '@/hooks/useCredits';
import {
  useAIUsageSummary,
  useAskRule,
  useGenerateEncounter,
  useGenerateLocation,
  useGenerateLore,
  useGenerateNPC,
  useGeneratePlotHooks,
  useGenerateQuest,
  useGenerateShop,
  useGenerateTavern,
  useGenerateWorldNPC,
  useRecentRules,
} from '@/hooks/useAITools';
import { useSessions, useGenerateAISummary } from '@/hooks/useSessions';
import { useWorldEntities } from '@/hooks/useWorldEntities';
import { useSaveAIEncounter } from '@/hooks/useEncounters';
import type {
  EncounterDifficulty,
  GeneratedEncounter,
  GeneratedNPC,
  GeneratedPlotHooks,
  RuleAnswer,
} from '@/types/ai-tools';
import type { SaveAIEncounterRequest } from '@/types/encounter';
import type { Session, WorldEntity } from '@/types/campaign';

// ── Type definitions ──────────────────────────────────────────────────────────

export type ToolCategory = 'characters' | 'worldbuilding' | 'session-prep' | 'story' | 'reference';
export type ToolId =
  | 'npc-generator'
  | 'world-npc-generator'
  | 'encounter-builder'
  | 'session-summary'
  | 'plot-hooks'
  | 'quest-generator'
  | 'lore-generator'
  | 'location-generator'
  | 'tavern-generator'
  | 'shop-generator'
  | 'rule-assistant';

export type ToolDefinition = {
  id: ToolId;
  label: string;
  category: ToolCategory;
  description: string;
  helper: string;
  creditKey: string;
  icon: typeof Sparkles;
};

export const tools: ToolDefinition[] = [
  {
    id: 'npc-generator',
    label: 'NPC Generator',
    category: 'characters',
    description: 'Create a scene-ready NPC with role, presence, personality, and a usable stat block.',
    helper: 'Campaign-aware character generation',
    creditKey: 'npc_generation',
    icon: Users,
  },
  {
    id: 'world-npc-generator',
    label: 'World NPC Seed',
    category: 'characters',
    description: 'Draft a world-facing NPC and save it directly into the campaign setting.',
    helper: 'Creates a persistent world entity',
    creditKey: 'world_building',
    icon: Compass,
  },
  {
    id: 'encounter-builder',
    label: 'Encounter Builder',
    category: 'session-prep',
    description: 'Draft a combat concept with creatures, tactics, terrain, and treasure.',
    helper: 'Can be saved into the encounter library',
    creditKey: 'encounter_building',
    icon: Swords,
  },
  {
    id: 'session-summary',
    label: 'Session Summary',
    category: 'session-prep',
    description: 'Turn session notes into a recap and structured summary tied to a real session.',
    helper: 'Updates session recap and context',
    creditKey: 'session_summary',
    icon: ClipboardList,
  },
  {
    id: 'plot-hooks',
    label: 'Plot Hook Generator',
    category: 'story',
    description: 'Generate hooks, jobs, leads, and complications that fit the campaign.',
    helper: 'Story-first hook generation',
    creditKey: 'plot_hooks',
    icon: WandSparkles,
  },
  {
    id: 'quest-generator',
    label: 'Quest Generator',
    category: 'story',
    description: 'Draft a quest entity with objectives, complications, and rewards.',
    helper: 'Creates a saved world entity',
    creditKey: 'world_building',
    icon: ScrollText,
  },
  {
    id: 'lore-generator',
    label: 'Lore Generator',
    category: 'story',
    description: 'Expand legends, histories, prophecies, and setting details.',
    helper: 'Creates a saved lore record',
    creditKey: 'world_building',
    icon: BookOpen,
  },
  {
    id: 'location-generator',
    label: 'Location Generator',
    category: 'worldbuilding',
    description: 'Create settlements, dungeons, landmarks, and other place anchors.',
    helper: 'Creates a saved location entity',
    creditKey: 'world_building',
    icon: Map,
  },
  {
    id: 'tavern-generator',
    label: 'Tavern Generator',
    category: 'worldbuilding',
    description: 'Spin up an inn or tavern with tone, flavor, and campaign-fit details.',
    helper: 'Creates a saved location entity',
    creditKey: 'world_building',
    icon: Castle,
  },
  {
    id: 'shop-generator',
    label: 'Shop Generator',
    category: 'worldbuilding',
    description: 'Draft a merchant space or storefront tied to the setting.',
    helper: 'Creates a saved merchant entity',
    creditKey: 'world_building',
    icon: Store,
  },
  {
    id: 'rule-assistant',
    label: 'Rule Assistant',
    category: 'reference',
    description: 'Ask a rules question and get a campaign-aware answer with citations.',
    helper: 'Stores recent rule questions',
    creditKey: 'rule_questions',
    icon: ShieldQuestion,
  },
];

export const categoryLabels: Record<ToolCategory, string> = {
  characters: 'Characters',
  worldbuilding: 'Worldbuilding',
  'session-prep': 'Session Prep',
  story: 'Story & Hooks',
  reference: 'Reference',
};

export const locationTypes = ['city', 'town', 'village', 'dungeon', 'wilderness', 'landmark'] as const;
export const tavernTones = ['friendly', 'rough', 'mysterious', 'upscale', 'seedy'] as const;
export const shopTypes = ['general', 'blacksmith', 'alchemist', 'magic', 'books', 'exotic', 'fence'] as const;
export const questTypes = ['fetch', 'kill', 'escort', 'mystery', 'social', 'exploration', 'defense'] as const;
export const loreTypes = ['history', 'religion', 'magic', 'legend', 'prophecy', 'artifact', 'culture'] as const;
export const worldNpcRoles = ['quest_giver', 'merchant', 'information', 'ally', 'villain', 'neutral'] as const;

// ── Context value ─────────────────────────────────────────────────────────────

interface AIToolsContextValue {
  campaignId: string;

  // auth / credits
  user: ReturnType<typeof useAuth>['user'];
  refreshUser: ReturnType<typeof useAuth>['refreshUser'];
  creditBalance: ReturnType<typeof useCreditBalance>['data'];
  creditCosts: ReturnType<typeof useCreditCosts>['data'];
  usageSummary: ReturnType<typeof useAIUsageSummary>['data'];

  // data
  sessions: Session[] | undefined;
  worldEntities: WorldEntity[] | undefined;
  recentRules: ReturnType<typeof useRecentRules>['data'];
  recentOutputs: Array<{ id: string; label: string; detail: string; createdAt: string }>;

  // mutations
  generateNPC: ReturnType<typeof useGenerateNPC>;
  generateWorldNPC: ReturnType<typeof useGenerateWorldNPC>;
  generateEncounter: ReturnType<typeof useGenerateEncounter>;
  saveEncounter: ReturnType<typeof useSaveAIEncounter>;
  generateSummary: ReturnType<typeof useGenerateAISummary>;
  generatePlotHooks: ReturnType<typeof useGeneratePlotHooks>;
  generateQuest: ReturnType<typeof useGenerateQuest>;
  generateLore: ReturnType<typeof useGenerateLore>;
  generateLocation: ReturnType<typeof useGenerateLocation>;
  generateTavern: ReturnType<typeof useGenerateTavern>;
  generateShop: ReturnType<typeof useGenerateShop>;
  askRule: ReturnType<typeof useAskRule>;

  // UI state — tool selection
  selectedTool: ToolId;
  setSelectedTool: (id: ToolId) => void;
  toolSearch: string;
  setToolSearch: (value: string) => void;
  groupedTools: Array<{ id: ToolCategory; label: string; tools: ToolDefinition[] }>;
  selectedDefinition: ToolDefinition;
  canUseAI: boolean;

  // UI state — form fields
  npcDescription: string;
  setNpcDescription: (v: string) => void;
  npcRole: string;
  setNpcRole: (v: string) => void;
  npcLevel: string;
  setNpcLevel: (v: string) => void;

  worldNpcRole: (typeof worldNpcRoles)[number];
  setWorldNpcRole: (v: (typeof worldNpcRoles)[number]) => void;
  worldNpcPrompt: string;
  setWorldNpcPrompt: (v: string) => void;

  encounterLevel: string;
  setEncounterLevel: (v: string) => void;
  encounterPartySize: string;
  setEncounterPartySize: (v: string) => void;
  encounterDifficulty: EncounterDifficulty;
  setEncounterDifficulty: (v: EncounterDifficulty) => void;
  encounterEnvironment: string;
  setEncounterEnvironment: (v: string) => void;
  encounterType: string;
  setEncounterType: (v: string) => void;

  selectedSessionId: string;
  setSelectedSessionId: (v: string) => void;

  plotHookCount: string;
  setPlotHookCount: (v: string) => void;
  plotHookDifficulty: 'easy' | 'medium' | 'hard';
  setPlotHookDifficulty: (v: 'easy' | 'medium' | 'hard') => void;
  plotHookThemes: string;
  setPlotHookThemes: (v: string) => void;

  questType: (typeof questTypes)[number];
  setQuestType: (v: (typeof questTypes)[number]) => void;
  questDifficulty: string;
  setQuestDifficulty: (v: string) => void;
  questPrompt: string;
  setQuestPrompt: (v: string) => void;
  questPartyLevel: string;
  setQuestPartyLevel: (v: string) => void;

  loreType: (typeof loreTypes)[number];
  setLoreType: (v: (typeof loreTypes)[number]) => void;
  loreName: string;
  setLoreName: (v: string) => void;
  lorePrompt: string;
  setLorePrompt: (v: string) => void;

  locationType: (typeof locationTypes)[number];
  setLocationType: (v: (typeof locationTypes)[number]) => void;
  locationName: string;
  setLocationName: (v: string) => void;
  locationPrompt: string;
  setLocationPrompt: (v: string) => void;

  tavernTone: (typeof tavernTones)[number];
  setTavernTone: (v: (typeof tavernTones)[number]) => void;
  tavernName: string;
  setTavernName: (v: string) => void;
  tavernSpecialty: string;
  setTavernSpecialty: (v: string) => void;

  shopType: (typeof shopTypes)[number];
  setShopType: (v: (typeof shopTypes)[number]) => void;
  shopName: string;
  setShopName: (v: string) => void;
  shopSpecialty: string;
  setShopSpecialty: (v: string) => void;

  ruleQuestion: string;
  setRuleQuestion: (v: string) => void;

  activeOutput: { toolId: ToolId; data: unknown } | null;
  setActiveOutput: (v: { toolId: ToolId; data: unknown } | null) => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
}

const AIToolsContext = createContext<AIToolsContextValue | null>(null);

export function useAIToolsContext() {
  const ctx = useContext(AIToolsContext);
  if (!ctx) throw new Error('useAIToolsContext must be used within AIToolsProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AIToolsProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const { data: creditBalance } = useCreditBalance();
  const { data: creditCosts } = useCreditCosts();
  const { data: usageSummary } = useAIUsageSummary();
  const { data: sessions } = useSessions(campaignId);
  const { data: worldEntities } = useWorldEntities(campaignId);
  const { data: recentRules } = useRecentRules(campaignId);

  const generateNPC = useGenerateNPC();
  const generateWorldNPC = useGenerateWorldNPC();
  const generateEncounter = useGenerateEncounter();
  const saveEncounter = useSaveAIEncounter(campaignId);
  const generateSummary = useGenerateAISummary();
  const generatePlotHooks = useGeneratePlotHooks();
  const generateQuest = useGenerateQuest();
  const generateLore = useGenerateLore();
  const generateLocation = useGenerateLocation();
  const generateTavern = useGenerateTavern();
  const generateShop = useGenerateShop();
  const askRule = useAskRule();

  const [selectedTool, setSelectedTool] = useState<ToolId>('npc-generator');
  const [toolSearch, setToolSearch] = useState('');

  const [npcDescription, setNpcDescription] = useState('');
  const [npcRole, setNpcRole] = useState('');
  const [npcLevel, setNpcLevel] = useState('3');

  const [worldNpcRole, setWorldNpcRole] = useState<(typeof worldNpcRoles)[number]>('neutral');
  const [worldNpcPrompt, setWorldNpcPrompt] = useState('');

  const [encounterLevel, setEncounterLevel] = useState('4');
  const [encounterPartySize, setEncounterPartySize] = useState('4');
  const [encounterDifficulty, setEncounterDifficulty] = useState<EncounterDifficulty>('medium');
  const [encounterEnvironment, setEncounterEnvironment] = useState('');
  const [encounterType, setEncounterType] = useState('');

  const [selectedSessionId, setSelectedSessionId] = useState('');

  const [plotHookCount, setPlotHookCount] = useState('3');
  const [plotHookDifficulty, setPlotHookDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [plotHookThemes, setPlotHookThemes] = useState('');

  const [questType, setQuestType] = useState<(typeof questTypes)[number]>('mystery');
  const [questDifficulty, setQuestDifficulty] = useState('medium');
  const [questPrompt, setQuestPrompt] = useState('');
  const [questPartyLevel, setQuestPartyLevel] = useState('4');

  const [loreType, setLoreType] = useState<(typeof loreTypes)[number]>('history');
  const [loreName, setLoreName] = useState('');
  const [lorePrompt, setLorePrompt] = useState('');

  const [locationType, setLocationType] = useState<(typeof locationTypes)[number]>('village');
  const [locationName, setLocationName] = useState('');
  const [locationPrompt, setLocationPrompt] = useState('');

  const [tavernTone, setTavernTone] = useState<(typeof tavernTones)[number]>('friendly');
  const [tavernName, setTavernName] = useState('');
  const [tavernSpecialty, setTavernSpecialty] = useState('');

  const [shopType, setShopType] = useState<(typeof shopTypes)[number]>('general');
  const [shopName, setShopName] = useState('');
  const [shopSpecialty, setShopSpecialty] = useState('');

  const [ruleQuestion, setRuleQuestion] = useState('');

  const [activeOutput, setActiveOutput] = useState<{ toolId: ToolId; data: unknown } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!selectedSessionId && sessions?.length) {
      setSelectedSessionId(sessions[0]._id);
    }
  }, [selectedSessionId, sessions]);

  const filteredTools = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    return tools.filter((tool) => {
      if (!q) return true;
      return (
        tool.label.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q)
      );
    });
  }, [toolSearch]);

  const groupedTools = useMemo(
    () =>
      Object.entries(categoryLabels)
        .map(([category, label]) => ({
          id: category as ToolCategory,
          label,
          tools: filteredTools.filter((tool) => tool.category === category),
        }))
        .filter((group) => group.tools.length > 0),
    [filteredTools],
  );

  const selectedDefinition = tools.find((tool) => tool.id === selectedTool) ?? tools[0];
  const canUseAI = Boolean(user?.ageVerified) && (creditBalance?.total ?? 0) > 0;

  const recentOutputs = useMemo(() => {
    const entityOutputs = (worldEntities ?? [])
      .filter((entity) => entity.aiGenerated)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 6)
      .map((entity) => ({
        id: entity._id,
        label: entity.name,
        detail: entity.type.replaceAll('_', ' '),
        createdAt: entity.updatedAt,
      }));

    const sessionOutputs = (sessions ?? [])
      .filter((session) => session.aiSummary?.generatedAt || session.aiRecapGeneratedAt)
      .sort((a, b) => {
        const aDate = Date.parse(a.aiSummary?.generatedAt ?? a.aiRecapGeneratedAt ?? a.updatedAt);
        const bDate = Date.parse(b.aiSummary?.generatedAt ?? b.aiRecapGeneratedAt ?? b.updatedAt);
        return bDate - aDate;
      })
      .slice(0, 3)
      .map((session) => ({
        id: session._id,
        label: session.title || `Session ${session.sessionNumber}`,
        detail: 'session summary',
        createdAt: session.aiSummary?.generatedAt ?? session.aiRecapGeneratedAt ?? session.updatedAt,
      }));

    return [...entityOutputs, ...sessionOutputs]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 6);
  }, [sessions, worldEntities]);

  const value: AIToolsContextValue = {
    campaignId,
    user,
    refreshUser,
    creditBalance,
    creditCosts,
    usageSummary,
    sessions,
    worldEntities,
    recentRules,
    recentOutputs,
    generateNPC,
    generateWorldNPC,
    generateEncounter,
    saveEncounter,
    generateSummary,
    generatePlotHooks,
    generateQuest,
    generateLore,
    generateLocation,
    generateTavern,
    generateShop,
    askRule,
    selectedTool,
    setSelectedTool,
    toolSearch,
    setToolSearch,
    groupedTools,
    selectedDefinition,
    canUseAI,
    npcDescription,
    setNpcDescription,
    npcRole,
    setNpcRole,
    npcLevel,
    setNpcLevel,
    worldNpcRole,
    setWorldNpcRole,
    worldNpcPrompt,
    setWorldNpcPrompt,
    encounterLevel,
    setEncounterLevel,
    encounterPartySize,
    setEncounterPartySize,
    encounterDifficulty,
    setEncounterDifficulty,
    encounterEnvironment,
    setEncounterEnvironment,
    encounterType,
    setEncounterType,
    selectedSessionId,
    setSelectedSessionId,
    plotHookCount,
    setPlotHookCount,
    plotHookDifficulty,
    setPlotHookDifficulty,
    plotHookThemes,
    setPlotHookThemes,
    questType,
    setQuestType,
    questDifficulty,
    setQuestDifficulty,
    questPrompt,
    setQuestPrompt,
    questPartyLevel,
    setQuestPartyLevel,
    loreType,
    setLoreType,
    loreName,
    setLoreName,
    lorePrompt,
    setLorePrompt,
    locationType,
    setLocationType,
    locationName,
    setLocationName,
    locationPrompt,
    setLocationPrompt,
    tavernTone,
    setTavernTone,
    tavernName,
    setTavernName,
    tavernSpecialty,
    setTavernSpecialty,
    shopType,
    setShopType,
    shopName,
    setShopName,
    shopSpecialty,
    setShopSpecialty,
    ruleQuestion,
    setRuleQuestion,
    activeOutput,
    setActiveOutput,
    copied,
    setCopied,
  };

  return <AIToolsContext.Provider value={value}>{children}</AIToolsContext.Provider>;
}

// ── Re-export types used in desk/panel ────────────────────────────────────────

export type { EncounterDifficulty, GeneratedEncounter, GeneratedNPC, GeneratedPlotHooks, RuleAnswer };
export type { SaveAIEncounterRequest };
export type { Session, WorldEntity };
