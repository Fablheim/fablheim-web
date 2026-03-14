import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Castle,
  ClipboardList,
  Coins,
  Compass,
  Map,
  ScrollText,
  Search,
  ShieldQuestion,
  Sparkles,
  Store,
  Swords,
  Users,
  WandSparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AgeVerificationModal } from '@/components/ui/AgeVerificationModal';
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

interface AIToolsDeskV2Props {
  campaignId: string;
}

type ToolCategory = 'characters' | 'worldbuilding' | 'session-prep' | 'story' | 'reference';
type ToolId =
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

type ToolDefinition = {
  id: ToolId;
  label: string;
  category: ToolCategory;
  description: string;
  helper: string;
  creditKey: string;
  icon: typeof Sparkles;
};

const panelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(20,24%,8%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';

const tools: ToolDefinition[] = [
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

const categoryLabels: Record<ToolCategory, string> = {
  characters: 'Characters',
  worldbuilding: 'Worldbuilding',
  'session-prep': 'Session Prep',
  story: 'Story & Hooks',
  reference: 'Reference',
};

const locationTypes = ['city', 'town', 'village', 'dungeon', 'wilderness', 'landmark'] as const;
const tavernTones = ['friendly', 'rough', 'mysterious', 'upscale', 'seedy'] as const;
const shopTypes = ['general', 'blacksmith', 'alchemist', 'magic', 'books', 'exotic', 'fence'] as const;
const questTypes = ['fetch', 'kill', 'escort', 'mystery', 'social', 'exploration', 'defense'] as const;
const loreTypes = ['history', 'religion', 'magic', 'legend', 'prophecy', 'artifact', 'culture'] as const;
const worldNpcRoles = ['quest_giver', 'merchant', 'information', 'ally', 'villain', 'neutral'] as const;

export function AIToolsDeskV2({ campaignId }: AIToolsDeskV2Props) {
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

  const totalUsageCalls = (usageSummary ?? []).reduce((sum, row) => sum + row.count, 0);
  const totalUsageTokens = (usageSummary ?? []).reduce((sum, row) => sum + row.totalTokens, 0);

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

  async function handleGenerateNPC() {
    const result = await generateNPC.mutateAsync({
      campaignId,
      description: npcDescription.trim(),
      role: npcRole.trim() || undefined,
      level: npcLevel ? Number(npcLevel) : undefined,
    });
    setActiveOutput({ toolId: 'npc-generator', data: result });
  }

  async function handleGenerateWorldNPC() {
    const result = await generateWorldNPC.mutateAsync({
      campaignId,
      role: worldNpcRole,
      importance: 'minor',
      prompt: worldNpcPrompt.trim() || undefined,
    });
    setActiveOutput({ toolId: 'world-npc-generator', data: result });
  }

  async function handleGenerateEncounter() {
    const result = await generateEncounter.mutateAsync({
      campaignId,
      partyLevel: Number(encounterLevel) || 1,
      partySize: Number(encounterPartySize) || 1,
      difficulty: encounterDifficulty,
      environment: encounterEnvironment.trim() || undefined,
      encounterType: encounterType.trim() || undefined,
    });
    setActiveOutput({ toolId: 'encounter-builder', data: result });
  }

  async function handleSaveEncounter() {
    if (activeOutput?.toolId !== 'encounter-builder') return;
    const encounter = activeOutput.data as GeneratedEncounter;
    const body: SaveAIEncounterRequest = {
      name: encounter.title,
      description: encounter.description,
      difficulty: encounter.difficulty as EncounterDifficulty,
      estimatedXP: encounter.totalXP,
      npcs: encounter.npcs,
      tactics: encounter.tactics,
      terrain: encounter.terrain,
      treasure: encounter.treasure,
      hooks: encounter.hooks,
    };
    await saveEncounter.mutateAsync(body);
  }

  async function handleGenerateSummary() {
    if (!selectedSessionId) return;
    const result = await generateSummary.mutateAsync({
      campaignId,
      sessionId: selectedSessionId,
    });
    setActiveOutput({ toolId: 'session-summary', data: result });
  }

  async function handleGeneratePlotHooks() {
    const result = await generatePlotHooks.mutateAsync({
      campaignId,
      count: Number(plotHookCount) || 3,
      difficulty: plotHookDifficulty,
      themes: plotHookThemes
        .split(',')
        .map((theme) => theme.trim())
        .filter(Boolean),
    });
    setActiveOutput({ toolId: 'plot-hooks', data: result });
  }

  async function handleGenerateQuest() {
    const result = await generateQuest.mutateAsync({
      campaignId,
      questType,
      difficulty: questDifficulty,
      partyLevel: Number(questPartyLevel) || undefined,
      prompt: questPrompt.trim() || undefined,
    });
    setActiveOutput({ toolId: 'quest-generator', data: result });
  }

  async function handleGenerateLore() {
    const result = await generateLore.mutateAsync({
      campaignId,
      loreType,
      name: loreName.trim() || undefined,
      prompt: lorePrompt.trim() || undefined,
    });
    setActiveOutput({ toolId: 'lore-generator', data: result });
  }

  async function handleGenerateLocation() {
    const result = await generateLocation.mutateAsync({
      campaignId,
      locationType,
      name: locationName.trim() || undefined,
      prompt: locationPrompt.trim() || undefined,
    });
    setActiveOutput({ toolId: 'location-generator', data: result });
  }

  async function handleGenerateTavern() {
    const result = await generateTavern.mutateAsync({
      campaignId,
      tone: tavernTone,
      name: tavernName.trim() || undefined,
      specialty: tavernSpecialty.trim() || undefined,
    });
    setActiveOutput({ toolId: 'tavern-generator', data: result });
  }

  async function handleGenerateShop() {
    const result = await generateShop.mutateAsync({
      campaignId,
      shopType,
      name: shopName.trim() || undefined,
      specialty: shopSpecialty.trim() || undefined,
    });
    setActiveOutput({ toolId: 'shop-generator', data: result });
  }

  async function handleAskRule() {
    const result = await askRule.mutateAsync({
      campaignId,
      question: ruleQuestion.trim(),
      shareWithSession: false,
    });
    setRuleQuestion('');
    setActiveOutput({ toolId: 'rule-assistant', data: result });
  }

  async function handleCopyOutput() {
    if (!activeOutput) return;

    let text = '';
    switch (activeOutput.toolId) {
      case 'npc-generator': {
        const npc = activeOutput.data as GeneratedNPC;
        text = [npc.name, npc.role, npc.appearance, npc.personality, npc.plotHooks, npc.statBlock]
          .filter(Boolean)
          .join('\n\n');
        break;
      }
      case 'encounter-builder': {
        const encounter = activeOutput.data as GeneratedEncounter;
        text = [
          encounter.title,
          encounter.description,
          encounter.npcs.map((npc) => `${npc.count}x ${npc.name} (CR ${npc.cr}, AC ${npc.ac}, HP ${npc.hp})`).join('\n'),
          encounter.tactics,
          encounter.treasure,
        ]
          .filter(Boolean)
          .join('\n\n');
        break;
      }
      case 'plot-hooks': {
        const hooks = activeOutput.data as GeneratedPlotHooks;
        text = hooks.hooks.join('\n');
        break;
      }
      case 'rule-assistant': {
        const answer = activeOutput.data as RuleAnswer;
        text = [answer.answer, answer.citations.join('\n'), answer.dmAdvice].filter(Boolean).join('\n\n');
        break;
      }
      case 'session-summary': {
        const session = activeOutput.data as Session;
        text =
          session.aiSummary?.summary ??
          session.aiRecap ??
          session.summary ??
          '';
        break;
      }
      default: {
        const entity = activeOutput.data as WorldEntity;
        text = [entity.name, entity.description].filter(Boolean).join('\n\n');
      }
    }

    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(40,48%,24%,0.12),transparent_28%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(18,20%,7%)_100%)] text-[hsl(38,24%,88%)]">
      {user && !user.ageVerified ? (
        <AgeVerificationModal
          onVerified={() => {
            refreshUser();
          }}
          onCancel={() => undefined}
        />
      ) : null}

      <header className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(38,30%,60%)]">Campaign Co-Pilot</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-['IM_Fell_English'] text-[28px] leading-none text-[hsl(38,42%,90%)]">AI Tools</h2>
            <p className="mt-2 max-w-3xl text-sm text-[hsl(30,14%,66%)]">
              Creative generation grounded in the current campaign, with real outputs that can feed sessions, encounters, and world records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HeaderQuickAction label="Generate NPC" onClick={() => setSelectedTool('npc-generator')} />
            <HeaderQuickAction label="Generate Quest" onClick={() => setSelectedTool('quest-generator')} />
            <HeaderQuickAction label="Generate Location" onClick={() => setSelectedTool('location-generator')} />
            <HeaderQuickAction label="Open Recent Outputs" onClick={() => setSelectedTool('session-summary')} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <MetricChip icon={Coins} label="Credits" value={String(creditBalance?.total ?? 0)} />
          <MetricChip icon={Sparkles} label="Calls this month" value={String(totalUsageCalls)} />
          <MetricChip icon={BookOpen} label="Recent outputs" value={String(recentOutputs.length)} />
          <MetricChip icon={WandSparkles} label="Tokens this month" value={totalUsageTokens.toLocaleString()} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className={`${panelClass} min-h-0 overflow-hidden`}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Tool Library</p>
                <h3 className="mt-1 font-[Cinzel] text-2xl text-[hsl(38,34%,88%)]">Creative Bench</h3>
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,12%,52%)]" />
                  <input
                    value={toolSearch}
                    onChange={(event) => setToolSearch(event.target.value)}
                    placeholder="Search tools, outputs, or tasks..."
                    className="w-full rounded-[16px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] py-2.5 pl-10 pr-3 text-sm text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-4">
                  {groupedTools.map((group) => (
                    <div key={group.id}>
                      <p className="px-2 text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">{group.label}</p>
                      <div className="mt-2 space-y-2">
                        {group.tools.map((tool) => (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => setSelectedTool(tool.id)}
                            className={`w-full rounded-[18px] border px-3 py-3 text-left transition ${
                              selectedTool === tool.id
                                ? 'border-[hsla(42,64%,58%,0.58)] bg-[linear-gradient(180deg,hsla(40,64%,52%,0.16)_0%,hsla(24,22%,12%,0.9)_100%)]'
                                : 'border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] hover:border-[hsla(42,42%,46%,0.38)]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <tool.icon className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(42,72%,72%)]" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-[Cinzel] text-base text-[hsl(38,32%,88%)]">{tool.label}</p>
                                  <span className="rounded-full border border-[hsla(42,42%,46%,0.28)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(38,36%,70%)]">
                                    {creditCosts?.[tool.creditKey] ?? 0} cr
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-[hsl(38,26%,78%)]">{tool.description}</p>
                                <p className="mt-2 text-xs leading-6 text-[hsl(30,12%,56%)]">{tool.helper}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className={`${panelClass} min-h-0 overflow-y-auto`}>
            <div className="px-5 py-5">
              <div className="border-b border-[hsla(32,24%,24%,0.4)] pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <selectedDefinition.icon className="h-5 w-5 text-[hsl(42,72%,72%)]" />
                  <h3 className="font-['IM_Fell_English'] text-[34px] leading-none text-[hsl(38,42%,90%)]">
                    {selectedDefinition.label}
                  </h3>
                  <span className="rounded-full border border-[hsla(42,42%,46%,0.28)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[hsl(38,36%,70%)]">
                    {creditCosts?.[selectedDefinition.creditKey] ?? 0} credits
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[hsl(30,14%,66%)]">
                  {selectedDefinition.description} This workspace uses the campaign’s saved context rather than asking the GM to handcraft prompts from scratch.
                </p>
              </div>

              {!user?.ageVerified ? (
                <NoticeBanner
                  title="Age verification required"
                  body="AI tools are available after confirming you are 18 or older. The rest of the campaign workspace remains available without it."
                />
              ) : null}
              {user?.ageVerified && (creditBalance?.total ?? 0) === 0 ? (
                <NoticeBanner
                  title="No AI credits available"
                  body="The tool desk is ready, but generation is paused until credits are available again."
                />
              ) : null}

              <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
                <div className="space-y-5">
                  <div className="rounded-[22px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Tool Workspace</p>
                    <div className="mt-4">{renderWorkspace()}</div>
                  </div>

                  <div className="rounded-[22px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Current Output</p>
                        <h4 className="mt-1 font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">Draft Result</h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCopyOutput}
                          disabled={!activeOutput}
                          className="rounded-full border border-[hsla(42,42%,46%,0.28)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[hsl(38,30%,78%)] transition hover:border-[hsla(42,62%,56%,0.44)] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                        {activeOutput?.toolId === 'encounter-builder' ? (
                          <button
                            type="button"
                            onClick={() => void handleSaveEncounter()}
                            disabled={saveEncounter.isPending}
                            className="rounded-full border border-[hsla(42,62%,56%,0.44)] bg-[hsla(40,48%,22%,0.32)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[hsl(42,76%,84%)] transition hover:bg-[hsla(40,48%,26%,0.42)] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {saveEncounter.isPending ? 'Saving...' : 'Save Encounter'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4">{renderOutput()}</div>
                  </div>
                </div>

                <div className="space-y-5">
                  <InfoPanel
                    title="Recent Outputs"
                    subtitle="Saved AI-created records and summaries that already fed back into the campaign."
                    items={recentOutputs.map((item) => ({
                      title: item.label,
                      detail: `${item.detail} · ${formatDate(item.createdAt)}`,
                    }))}
                    emptyLabel="No saved AI outputs yet."
                  />

                  <InfoPanel
                    title="Recent Rule Lookups"
                    subtitle="The rule assistant is the only AI feature with a dedicated history feed today."
                    items={(recentRules ?? []).slice(0, 5).map((item) => ({
                      title: item.question,
                      detail: `${item.system} · ${formatDate(item.createdAt)}`,
                    }))}
                    emptyLabel="No recent rule lookups yet."
                  />

                  <div className="rounded-[22px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Usage Read</p>
                    <h4 className="mt-1 font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">This Month</h4>
                    <div className="mt-4 space-y-2">
                      {(usageSummary ?? []).length > 0 ? (
                        usageSummary.map((row) => (
                          <div
                            key={row._id}
                            className="flex items-center justify-between rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2"
                          >
                            <div>
                              <p className="font-[Cinzel] text-sm text-[hsl(38,30%,84%)]">{featureLabel(row._id)}</p>
                              <p className="text-xs text-[hsl(30,12%,56%)]">{row.totalTokens.toLocaleString()} tokens</p>
                            </div>
                            <span className="text-sm text-[hsl(42,72%,78%)]">{row.count} calls</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[hsl(30,14%,62%)]">No AI usage recorded yet this month.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  function renderWorkspace() {
    const disabled = !canUseAI;

    switch (selectedTool) {
      case 'npc-generator':
        return (
          <ToolForm
            fields={
              <>
                <Field
                  label="Scene Brief"
                  description="Describe who the GM needs at the table."
                >
                  <textarea
                    value={npcDescription}
                    onChange={(event) => setNpcDescription(event.target.value)}
                    rows={5}
                    placeholder="A suspicious river ferryman who knows too much about the ruined chapel."
                    className={fieldClass}
                  />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Role">
                    <input value={npcRole} onChange={(event) => setNpcRole(event.target.value)} placeholder="Fence, priest, scout..." className={fieldClass} />
                  </Field>
                  <Field label="Level">
                    <input value={npcLevel} onChange={(event) => setNpcLevel(event.target.value)} type="number" min={1} max={20} className={fieldClass} />
                  </Field>
                </div>
              </>
            }
            actionLabel={generateNPC.isPending ? 'Generating...' : 'Generate NPC'}
            onAction={() => void handleGenerateNPC()}
            disabled={disabled || !npcDescription.trim() || generateNPC.isPending}
          />
        );
      case 'world-npc-generator':
        return (
          <ToolForm
            fields={
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Role">
                    <select value={worldNpcRole} onChange={(event) => setWorldNpcRole(event.target.value as (typeof worldNpcRoles)[number])} className={fieldClass}>
                      {worldNpcRoles.map((role) => (
                        <option key={role} value={role}>{humanize(role)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Importance">
                    <input value="Minor" readOnly className={`${fieldClass} opacity-70`} />
                  </Field>
                </div>
                <Field label="Direction">
                  <textarea
                    value={worldNpcPrompt}
                    onChange={(event) => setWorldNpcPrompt(event.target.value)}
                    rows={4}
                    placeholder="A market informant quietly selling rumors about the council."
                    className={fieldClass}
                  />
                </Field>
              </>
            }
            actionLabel={generateWorldNPC.isPending ? 'Generating...' : 'Generate World NPC'}
            onAction={() => void handleGenerateWorldNPC()}
            disabled={disabled || generateWorldNPC.isPending}
          />
        );
      case 'encounter-builder':
        return (
          <ToolForm
            fields={
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Party Level">
                    <input value={encounterLevel} onChange={(event) => setEncounterLevel(event.target.value)} type="number" min={1} max={20} className={fieldClass} />
                  </Field>
                  <Field label="Party Size">
                    <input value={encounterPartySize} onChange={(event) => setEncounterPartySize(event.target.value)} type="number" min={1} max={10} className={fieldClass} />
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Difficulty">
                    <select value={encounterDifficulty} onChange={(event) => setEncounterDifficulty(event.target.value as EncounterDifficulty)} className={fieldClass}>
                      {(['easy', 'medium', 'hard', 'deadly'] as const).map((difficulty) => (
                        <option key={difficulty} value={difficulty}>{humanize(difficulty)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Encounter Type">
                    <input value={encounterType} onChange={(event) => setEncounterType(event.target.value)} placeholder="Ambush, chase, siege..." className={fieldClass} />
                  </Field>
                </div>
                <Field label="Environment">
                  <input value={encounterEnvironment} onChange={(event) => setEncounterEnvironment(event.target.value)} placeholder="Forest road, drowned crypt, market square..." className={fieldClass} />
                </Field>
              </>
            }
            actionLabel={generateEncounter.isPending ? 'Generating...' : 'Generate Encounter'}
            onAction={() => void handleGenerateEncounter()}
            disabled={disabled || generateEncounter.isPending}
          />
        );
      case 'session-summary':
        return (
          <ToolForm
            fields={
              <>
                <Field
                  label="Session"
                  description="This tool uses the session’s saved notes and updates its recap fields directly."
                >
                  <select
                    value={selectedSessionId}
                    onChange={(event) => setSelectedSessionId(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Select a session</option>
                    {(sessions ?? []).map((session) => (
                      <option key={session._id} value={session._id}>
                        {session.title || `Session ${session.sessionNumber}`}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            }
            actionLabel={generateSummary.isPending ? 'Generating...' : 'Generate Session Summary'}
            onAction={() => void handleGenerateSummary()}
            disabled={disabled || !selectedSessionId || generateSummary.isPending}
          />
        );
      case 'plot-hooks':
        return (
          <ToolForm
            fields={
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Hook Count">
                    <input value={plotHookCount} onChange={(event) => setPlotHookCount(event.target.value)} type="number" min={1} max={8} className={fieldClass} />
                  </Field>
                  <Field label="Difficulty">
                    <select value={plotHookDifficulty} onChange={(event) => setPlotHookDifficulty(event.target.value as 'easy' | 'medium' | 'hard')} className={fieldClass}>
                      {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                        <option key={difficulty} value={difficulty}>{humanize(difficulty)}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Themes">
                  <input value={plotHookThemes} onChange={(event) => setPlotHookThemes(event.target.value)} placeholder="conspiracy, debt, cursed relics" className={fieldClass} />
                </Field>
              </>
            }
            actionLabel={generatePlotHooks.isPending ? 'Generating...' : 'Generate Hooks'}
            onAction={() => void handleGeneratePlotHooks()}
            disabled={disabled || generatePlotHooks.isPending}
          />
        );
      case 'quest-generator':
        return (
          <ToolForm
            fields={
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Quest Type">
                    <select value={questType} onChange={(event) => setQuestType(event.target.value as (typeof questTypes)[number])} className={fieldClass}>
                      {questTypes.map((type) => (
                        <option key={type} value={type}>{humanize(type)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Difficulty">
                    <select value={questDifficulty} onChange={(event) => setQuestDifficulty(event.target.value)} className={fieldClass}>
                      {(['easy', 'medium', 'hard', 'deadly'] as const).map((difficulty) => (
                        <option key={difficulty} value={difficulty}>{humanize(difficulty)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Party Level">
                    <input value={questPartyLevel} onChange={(event) => setQuestPartyLevel(event.target.value)} type="number" min={1} max={20} className={fieldClass} />
                  </Field>
                </div>
                <Field label="Direction">
                  <textarea value={questPrompt} onChange={(event) => setQuestPrompt(event.target.value)} rows={4} placeholder="A river trade route is collapsing after strange lights appear in the marsh." className={fieldClass} />
                </Field>
              </>
            }
            actionLabel={generateQuest.isPending ? 'Generating...' : 'Generate Quest'}
            onAction={() => void handleGenerateQuest()}
            disabled={disabled || generateQuest.isPending}
          />
        );
      case 'lore-generator':
        return (
          <ToolForm
            fields={
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Lore Type">
                    <select value={loreType} onChange={(event) => setLoreType(event.target.value as (typeof loreTypes)[number])} className={fieldClass}>
                      {loreTypes.map((type) => (
                        <option key={type} value={type}>{humanize(type)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Name">
                    <input value={loreName} onChange={(event) => setLoreName(event.target.value)} placeholder="The Ashen Compact" className={fieldClass} />
                  </Field>
                </div>
                <Field label="Direction">
                  <textarea value={lorePrompt} onChange={(event) => setLorePrompt(event.target.value)} rows={4} placeholder="An old prophecy tied to a weathered iron crown." className={fieldClass} />
                </Field>
              </>
            }
            actionLabel={generateLore.isPending ? 'Generating...' : 'Generate Lore'}
            onAction={() => void handleGenerateLore()}
            disabled={disabled || generateLore.isPending}
          />
        );
      case 'location-generator':
        return (
          <ToolForm
            fields={
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Location Type">
                    <select value={locationType} onChange={(event) => setLocationType(event.target.value as (typeof locationTypes)[number])} className={fieldClass}>
                      {locationTypes.map((type) => (
                        <option key={type} value={type}>{humanize(type)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Name">
                    <input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Hollowmere" className={fieldClass} />
                  </Field>
                </div>
                <Field label="Direction">
                  <textarea value={locationPrompt} onChange={(event) => setLocationPrompt(event.target.value)} rows={4} placeholder="A settlement living under a permanent fog bank and wary of bells." className={fieldClass} />
                </Field>
              </>
            }
            actionLabel={generateLocation.isPending ? 'Generating...' : 'Generate Location'}
            onAction={() => void handleGenerateLocation()}
            disabled={disabled || generateLocation.isPending}
          />
        );
      case 'tavern-generator':
        return (
          <ToolForm
            fields={
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Tone">
                    <select value={tavernTone} onChange={(event) => setTavernTone(event.target.value as (typeof tavernTones)[number])} className={fieldClass}>
                      {tavernTones.map((tone) => (
                        <option key={tone} value={tone}>{humanize(tone)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Name">
                    <input value={tavernName} onChange={(event) => setTavernName(event.target.value)} placeholder="The Bent Lantern" className={fieldClass} />
                  </Field>
                </div>
                <Field label="Specialty">
                  <input value={tavernSpecialty} onChange={(event) => setTavernSpecialty(event.target.value)} placeholder="Hot cider, fence contacts, river songs..." className={fieldClass} />
                </Field>
              </>
            }
            actionLabel={generateTavern.isPending ? 'Generating...' : 'Generate Tavern'}
            onAction={() => void handleGenerateTavern()}
            disabled={disabled || generateTavern.isPending}
          />
        );
      case 'shop-generator':
        return (
          <ToolForm
            fields={
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Shop Type">
                    <select value={shopType} onChange={(event) => setShopType(event.target.value as (typeof shopTypes)[number])} className={fieldClass}>
                      {shopTypes.map((type) => (
                        <option key={type} value={type}>{humanize(type)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Name">
                    <input value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="Morrow & Brass" className={fieldClass} />
                  </Field>
                </div>
                <Field label="Specialty">
                  <input value={shopSpecialty} onChange={(event) => setShopSpecialty(event.target.value)} placeholder="Clockwork parts, illicit alchemy, relic maps..." className={fieldClass} />
                </Field>
              </>
            }
            actionLabel={generateShop.isPending ? 'Generating...' : 'Generate Shop'}
            onAction={() => void handleGenerateShop()}
            disabled={disabled || generateShop.isPending}
          />
        );
      case 'rule-assistant':
        return (
          <ToolForm
            fields={
              <Field label="Question" description="Rules questions are stored in recent history for this campaign.">
                <textarea
                  value={ruleQuestion}
                  onChange={(event) => setRuleQuestion(event.target.value)}
                  rows={5}
                  placeholder="How does readying a spell interact with concentration?"
                  className={fieldClass}
                />
              </Field>
            }
            actionLabel={askRule.isPending ? 'Thinking...' : 'Ask Rule Assistant'}
            onAction={() => void handleAskRule()}
            disabled={disabled || !ruleQuestion.trim() || askRule.isPending}
          />
        );
    }
  }

  function renderOutput() {
    if (!activeOutput) {
      return (
        <p className="text-sm leading-7 text-[hsl(30,14%,62%)]">
          Generate something from the active tool to see it here. Saved worldbuilding tools will also appear in the recent outputs shelf once they land in the campaign.
        </p>
      );
    }

    switch (activeOutput.toolId) {
      case 'npc-generator':
        return <NPCOutputCard npc={activeOutput.data as GeneratedNPC} />;
      case 'world-npc-generator':
      case 'quest-generator':
      case 'lore-generator':
      case 'location-generator':
      case 'tavern-generator':
      case 'shop-generator':
        return <WorldEntityOutputCard entity={activeOutput.data as WorldEntity} />;
      case 'encounter-builder':
        return <EncounterOutputCard encounter={activeOutput.data as GeneratedEncounter} />;
      case 'session-summary':
        return <SessionSummaryOutputCard session={activeOutput.data as Session} />;
      case 'plot-hooks':
        return <PlotHooksOutputCard hooks={activeOutput.data as GeneratedPlotHooks} />;
      case 'rule-assistant':
        return <RuleAnswerOutputCard answer={activeOutput.data as RuleAnswer} />;
    }
  }
}

function ToolForm({
  fields,
  actionLabel,
  onAction,
  disabled,
}: {
  fields: ReactNode;
  actionLabel: string;
  onAction: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      {fields}
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="rounded-full border border-[hsla(42,62%,56%,0.44)] bg-[hsla(40,48%,22%,0.32)] px-4 py-2 text-sm uppercase tracking-[0.16em] text-[hsl(42,76%,84%)] transition hover:bg-[hsla(40,48%,26%,0.42)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">{label}</p>
        {description ? <span className="text-xs text-[hsl(30,12%,56%)]">{description}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function NPCOutputCard({ npc }: { npc: GeneratedNPC }) {
  return (
    <div className="space-y-4 rounded-[20px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(20,18%,9%,0.82)] p-4">
      <div>
        <h5 className="font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">{npc.name}</h5>
        <p className="mt-1 text-sm text-[hsl(42,72%,78%)]">{npc.role}</p>
      </div>
      <OutputBlock title="Appearance" body={npc.appearance} />
      <OutputBlock title="Personality" body={npc.personality} />
      {npc.plotHooks ? <OutputBlock title="Hooks" body={npc.plotHooks} /> : null}
      <OutputBlock title="Stat Block" body={npc.statBlock} mono />
    </div>
  );
}

function EncounterOutputCard({ encounter }: { encounter: GeneratedEncounter }) {
  return (
    <div className="space-y-4 rounded-[20px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(20,18%,9%,0.82)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h5 className="font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">{encounter.title}</h5>
          <p className="mt-1 text-sm text-[hsl(42,72%,78%)]">
            {humanize(encounter.difficulty)} · {encounter.totalXP} XP
          </p>
        </div>
      </div>
      <OutputBlock title="Brief" body={encounter.description} />
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Combatants</p>
        <div className="mt-2 space-y-2">
          {encounter.npcs.map((npc, index) => (
            <div
              key={`${npc.name}-${index}`}
              className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2 text-sm text-[hsl(38,28%,84%)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{npc.count}x {npc.name}</span>
                <span className="text-xs text-[hsl(30,12%,56%)]">CR {npc.cr} · AC {npc.ac} · HP {npc.hp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <OutputBlock title="Tactics" body={encounter.tactics} />
      {encounter.treasure ? <OutputBlock title="Treasure" body={encounter.treasure} /> : null}
    </div>
  );
}

function PlotHooksOutputCard({ hooks }: { hooks: GeneratedPlotHooks }) {
  return (
    <div className="rounded-[20px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(20,18%,9%,0.82)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Hooks</p>
      <div className="mt-3 space-y-2">
        {hooks.hooks.map((hook, index) => (
          <div
            key={`${hook}-${index}`}
            className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2 text-sm leading-7 text-[hsl(38,28%,84%)]"
          >
            {hook}
          </div>
        ))}
      </div>
    </div>
  );
}

function WorldEntityOutputCard({ entity }: { entity: WorldEntity }) {
  return (
    <div className="space-y-4 rounded-[20px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(20,18%,9%,0.82)] p-4">
      <div>
        <h5 className="font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">{entity.name}</h5>
        <p className="mt-1 text-sm text-[hsl(42,72%,78%)]">{humanize(entity.type)}</p>
      </div>
      {entity.description ? <OutputBlock title="Description" body={entity.description} /> : null}
      {'objectives' in entity && entity.objectives?.length ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Objectives</p>
          <div className="mt-2 space-y-2">
            {entity.objectives.map((objective) => (
              <div key={objective.id} className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2 text-sm text-[hsl(38,28%,84%)]">
                {objective.description}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {'rewards' in entity && entity.rewards ? <OutputBlock title="Rewards" body={entity.rewards} /> : null}
      {entity.typeData && Object.keys(entity.typeData).length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">Extra Detail</p>
          <div className="mt-2 space-y-2">
            {Object.entries(entity.typeData)
              .filter(([, value]) => value !== null && value !== undefined && value !== '')
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(34,18%,58%)]">{humanize(key)}</p>
                  <p className="mt-1 text-sm text-[hsl(38,28%,84%)]">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SessionSummaryOutputCard({ session }: { session: Session }) {
  const summary = session.aiSummary;
  return (
    <div className="space-y-4 rounded-[20px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(20,18%,9%,0.82)] p-4">
      <div>
        <h5 className="font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">
          {session.title || `Session ${session.sessionNumber}`}
        </h5>
        <p className="mt-1 text-sm text-[hsl(42,72%,78%)]">
          {summary?.generatedAt ? `Generated ${formatDate(summary.generatedAt)}` : 'Session recap updated'}
        </p>
      </div>
      <OutputBlock
        title="Summary"
        body={summary?.summary ?? session.aiRecap ?? session.summary ?? 'No summary text returned.'}
      />
      {summary?.keyEvents?.length ? <OutputList title="Key Events" items={summary.keyEvents} /> : null}
      {summary?.unresolvedHooks?.length ? <OutputList title="Unresolved Hooks" items={summary.unresolvedHooks} /> : null}
      {summary?.moodPace ? <OutputBlock title="Mood & Pace" body={summary.moodPace} /> : null}
    </div>
  );
}

function RuleAnswerOutputCard({ answer }: { answer: RuleAnswer }) {
  return (
    <div className="space-y-4 rounded-[20px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(20,18%,9%,0.82)] p-4">
      <OutputBlock title="Answer" body={answer.answer} />
      {answer.citations.length ? <OutputList title="Citations" items={answer.citations} /> : null}
      {answer.relevantRules.length ? <OutputList title="Relevant Rules" items={answer.relevantRules} /> : null}
      {answer.dmAdvice ? <OutputBlock title="DM Advice" body={answer.dmAdvice} /> : null}
    </div>
  );
}

function OutputBlock({
  title,
  body,
  mono,
}: {
  title: string;
  body: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">{title}</p>
      <p className={`mt-2 whitespace-pre-wrap text-sm leading-7 text-[hsl(38,28%,84%)] ${mono ? 'font-mono text-xs' : ''}`}>
        {body}
      </p>
    </div>
  );
}

function OutputList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2 text-sm text-[hsl(38,28%,84%)]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderQuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[hsla(42,42%,46%,0.28)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[hsl(38,30%,78%)] transition hover:border-[hsla(42,62%,56%,0.44)]"
    >
      {label}
    </button>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-[hsl(42,72%,72%)]" />
      <span className="text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,56%)]">{label}</span>
      <span className="text-sm text-[hsl(38,30%,84%)]">{value}</span>
    </div>
  );
}

function NoticeBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-5 rounded-[18px] border border-[hsla(42,52%,38%,0.32)] bg-[hsla(28,34%,12%,0.72)] px-4 py-3">
      <p className="font-[Cinzel] text-base text-[hsl(42,72%,82%)]">{title}</p>
      <p className="mt-1 text-sm leading-7 text-[hsl(30,16%,70%)]">{body}</p>
    </div>
  );
}

function InfoPanel({
  title,
  subtitle,
  items,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  items: Array<{ title: string; detail: string }>;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[22px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(34,18%,58%)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,66%)]">{subtitle}</p>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={`${item.title}-${item.detail}`} className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2">
              <p className="text-sm text-[hsl(38,30%,84%)]">{item.title}</p>
              <p className="mt-1 text-xs text-[hsl(30,12%,56%)]">{item.detail}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[hsl(30,14%,62%)]">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function humanize(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function featureLabel(value: string) {
  const labels: Record<string, string> = {
    npc_generation: 'NPC Generation',
    session_summary: 'Session Summary',
    plot_hooks: 'Plot Hooks',
    backstory: 'Backstory',
    world_building: 'Worldbuilding',
    encounter_building: 'Encounter Building',
    character_creation: 'Character Creation',
    rule_questions: 'Rule Questions',
  };
  return labels[value] ?? humanize(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const fieldClass =
  'w-full rounded-[16px] border border-[hsla(32,24%,24%,0.68)] bg-[hsla(20,20%,8%,0.84)] px-3 py-2.5 text-sm text-[hsl(38,28%,86%)] outline-none transition focus:border-[hsla(42,60%,54%,0.45)]';
