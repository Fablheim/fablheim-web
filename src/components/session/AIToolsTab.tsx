import { useState } from 'react';
import { Sparkles, Users, Swords, BookOpen, Loader2, ScrollText, BookMarked } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { aiToolsApi } from '@/api/ai-tools';
import type { GeneratedNPC, GeneratedEncounter, RuleAnswer } from '@/types/ai-tools';
import type { EncounterDifficulty } from '@/types/ai-tools';
import type { WorldEntity } from '@/types/campaign';

interface AIToolsTabProps {
  campaignId: string;
}

type ActiveTool = 'npc' | 'encounter' | 'rules' | 'quest' | 'lore' | null;

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-md border p-3 transition-all ${
        active
          ? 'border-primary/40 bg-primary/10 shadow-glow-sm text-primary'
          : 'border-iron/30 bg-accent/20 text-muted-foreground hover:border-gold/30 hover:text-foreground'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-[Cinzel] text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );
}

function NPCGenerator({ campaignId }: { campaignId: string }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedNPC | null>(null);

  async function handleGenerate() {
    if (!description.trim() || loading) return;
    setLoading(true);
    try {
      const npc = await aiToolsApi.generateNPC({ campaignId, description: description.trim() });
      setResult(npc);
    } catch {
      toast.error('Failed to generate NPC');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-[Cinzel] text-sm font-semibold text-foreground">{result.name}</h4>
          <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
            Generate Another
          </Button>
        </div>
        <div className="rounded-md border border-gold/20 bg-accent/20 texture-parchment p-3 space-y-2">
          <div>
            <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Role</span>
            <p className="text-sm text-foreground">{result.role}</p>
          </div>
          <div>
            <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Appearance</span>
            <p className="text-sm text-foreground font-['IM_Fell_English'] italic">{result.appearance}</p>
          </div>
          <div>
            <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Personality</span>
            <p className="text-sm text-foreground font-['IM_Fell_English'] italic">{result.personality}</p>
          </div>
          {result.plotHooks && (
            <div>
              <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Plot Hooks</span>
              <p className="text-sm text-foreground font-['IM_Fell_English'] italic">{result.plotHooks}</p>
            </div>
          )}
          <details className="border-t border-gold/10 pt-2">
            <summary className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">
              Stat Block
            </summary>
            <pre className="mt-1 text-xs text-foreground whitespace-pre-wrap font-mono bg-background/50 rounded p-2">
              {result.statBlock}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the NPC you need... e.g. 'A grizzled dwarven blacksmith who secretly works for the thieves guild'"
        rows={3}
        className="w-full input-carved rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground font-['IM_Fell_English'] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
      />
      <Button
        size="sm"
        variant="primary"
        disabled={loading || !description.trim()}
        onClick={handleGenerate}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Generate NPC
          </>
        )}
      </Button>
    </div>
  );
}

function EncounterGenerator({ campaignId }: { campaignId: string }) {
  const [partyLevel, setPartyLevel] = useState(3);
  const [partySize, setPartySize] = useState(4);
  const [difficulty, setDifficulty] = useState<EncounterDifficulty>('medium');
  const [environment, setEnvironment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedEncounter | null>(null);

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    try {
      const encounter = await aiToolsApi.generateEncounter({
        campaignId,
        partyLevel,
        partySize,
        difficulty,
        environment: environment.trim() || undefined,
      });
      setResult(encounter);
    } catch {
      toast.error('Failed to generate encounter');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-[Cinzel] text-sm font-semibold text-foreground">{result.title}</h4>
          <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
            Generate Another
          </Button>
        </div>
        <div className="rounded-md border border-gold/20 bg-accent/20 texture-parchment p-3 space-y-2">
          <p className="text-sm text-foreground font-['IM_Fell_English'] italic">{result.description}</p>

          <div>
            <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
              Monsters ({result.difficulty} — {result.totalXP} XP)
            </span>
            <div className="mt-1 space-y-1">
              {result.npcs.map((npc, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-foreground rounded-sm bg-background/50 px-2 py-1">
                  <span>{npc.count}x {npc.name}</span>
                  <span className="text-xs text-muted-foreground">CR {npc.cr} · AC {npc.ac} · HP {npc.hp}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Tactics</span>
            <p className="text-sm text-foreground font-['IM_Fell_English'] italic">{result.tactics}</p>
          </div>

          {result.treasure && (
            <div>
              <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Treasure</span>
              <p className="text-sm text-foreground font-['IM_Fell_English'] italic">{result.treasure}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Party Level</label>
          <input
            type="number"
            min={1}
            max={20}
            value={partyLevel}
            onChange={(e) => setPartyLevel(parseInt(e.target.value, 10) || 1)}
            className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Party Size</label>
          <input
            type="number"
            min={1}
            max={10}
            value={partySize}
            onChange={(e) => setPartySize(parseInt(e.target.value, 10) || 1)}
            className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Difficulty</label>
        <div className="flex gap-1.5">
          {(['easy', 'medium', 'hard', 'deadly'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-sm px-2.5 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider transition-colors ${
                difficulty === d
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Environment <span className="text-[9px] font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          type="text"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          placeholder="e.g. Forest, Dungeon, Swamp"
          className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <Button
        size="sm"
        variant="primary"
        disabled={loading}
        onClick={handleGenerate}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Generate Encounter
          </>
        )}
      </Button>
    </div>
  );
}

function RulesLookup({ campaignId }: { campaignId: string }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RuleAnswer[]>([]);

  async function handleAsk() {
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      const answer = await aiToolsApi.askRule({
        campaignId,
        question: question.trim(),
        shareWithSession: true,
      });
      setResults((prev) => [answer, ...prev]);
      setQuestion('');
    } catch {
      toast.error('Failed to look up rule');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="How does grappling work?"
          className="flex-1 input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button size="sm" variant="primary" disabled={loading || !question.trim()} onClick={handleAsk}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ask'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {results.map((r, i) => (
            <div key={i} className="rounded-md border border-gold/20 bg-accent/20 texture-parchment p-3 space-y-2">
              <p className="text-sm text-foreground font-['IM_Fell_English'] whitespace-pre-wrap leading-relaxed">
                {r.answer}
              </p>
              {r.citations.length > 0 && (
                <div className="border-t border-gold/10 pt-1.5">
                  <div className="flex flex-wrap gap-1">
                    {r.citations.map((c, j) => (
                      <span key={j} className="rounded-sm bg-background/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const QUEST_TYPES = ['fetch', 'kill', 'escort', 'mystery', 'social', 'exploration', 'defense'] as const;
const LORE_TYPES = ['history', 'religion', 'magic', 'legend', 'prophecy', 'artifact', 'culture'] as const;

function QuestGenerator({ campaignId }: { campaignId: string }) {
  const [questType, setQuestType] = useState('mystery');
  const [difficulty, setDifficulty] = useState('medium');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorldEntity | null>(null);

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    try {
      const quest = await aiToolsApi.generateQuest({
        campaignId,
        questType,
        difficulty,
        prompt: prompt.trim() || undefined,
        shareWithSession: true,
      });
      setResult(quest);
    } catch {
      toast.error('Failed to generate quest');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-[Cinzel] text-sm font-semibold text-foreground">{result.name}</h4>
          <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
            Generate Another
          </Button>
        </div>
        <div className="rounded-md border border-gold/20 bg-accent/20 texture-parchment p-3 space-y-2">
          <p className="text-sm text-foreground font-['IM_Fell_English'] italic leading-relaxed whitespace-pre-wrap">
            {result.description}
          </p>
          {result.objectives && result.objectives.length > 0 && (
            <div>
              <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Objectives</span>
              <ul className="mt-1 space-y-0.5">
                {result.objectives.map((obj) => (
                  <li key={obj.id} className="text-sm text-foreground flex items-center gap-1.5">
                    <span className="text-gold">-</span> {obj.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.rewards && (
            <div>
              <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Rewards</span>
              <p className="text-sm text-foreground">{result.rewards}</p>
            </div>
          )}
          {result.typeData?.complications && (result.typeData.complications as string[]).length > 0 && (
            <div>
              <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Complications</span>
              <ul className="mt-1 space-y-0.5">
                {(result.typeData.complications as string[]).map((c, i) => (
                  <li key={i} className="text-sm text-foreground flex items-center gap-1.5">
                    <span className="text-blood">!</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Quest Type</label>
        <div className="flex flex-wrap gap-1.5">
          {QUEST_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setQuestType(t)}
              className={`rounded-sm px-2 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider transition-colors ${
                questType === t
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Difficulty</label>
        <div className="flex gap-1.5">
          {(['easy', 'medium', 'hard', 'deadly'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-sm px-2.5 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider transition-colors ${
                difficulty === d
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Optional direction... e.g. 'involving a cursed artifact in a swamp'"
        rows={2}
        className="w-full input-carved rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground font-['IM_Fell_English'] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
      />

      <Button size="sm" variant="primary" disabled={loading} onClick={handleGenerate} className="w-full">
        {loading ? (
          <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Generating...</>
        ) : (
          <><Sparkles className="mr-1.5 h-3.5 w-3.5" />Generate Quest</>
        )}
      </Button>
    </div>
  );
}

function LoreGenerator({ campaignId }: { campaignId: string }) {
  const [loreType, setLoreType] = useState('history');
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorldEntity | null>(null);

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    try {
      const lore = await aiToolsApi.generateLore({
        campaignId,
        loreType,
        name: name.trim() || undefined,
        prompt: prompt.trim() || undefined,
        shareWithSession: true,
      });
      setResult(lore);
    } catch {
      toast.error('Failed to generate lore');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-[Cinzel] text-sm font-semibold text-foreground">{result.name}</h4>
          <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
            Generate Another
          </Button>
        </div>
        <div className="rounded-md border border-gold/20 bg-accent/20 texture-parchment p-3 space-y-2">
          <p className="text-sm text-foreground font-['IM_Fell_English'] italic leading-relaxed whitespace-pre-wrap">
            {result.description}
          </p>
          {result.typeData?.significance && (
            <div>
              <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Significance</span>
              <p className="text-sm text-foreground">{result.typeData.significance as string}</p>
            </div>
          )}
          {result.typeData?.connections && (result.typeData.connections as string[]).length > 0 && (
            <div>
              <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">Connections</span>
              <ul className="mt-1 space-y-0.5">
                {(result.typeData.connections as string[]).map((c, i) => (
                  <li key={i} className="text-sm text-foreground flex items-center gap-1.5">
                    <span className="text-gold">-</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.typeData?.secrets && (result.typeData.secrets as string[]).length > 0 && (
            <details className="border-t border-gold/10 pt-2">
              <summary className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">
                GM Secrets
              </summary>
              <ul className="mt-1 space-y-0.5">
                {(result.typeData.secrets as string[]).map((s, i) => (
                  <li key={i} className="text-sm text-arcane flex items-center gap-1.5">
                    <span>-</span> {s}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Lore Type</label>
        <div className="flex flex-wrap gap-1.5">
          {LORE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setLoreType(t)}
              className={`rounded-sm px-2 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider transition-colors ${
                loreType === t
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)... e.g. 'The Shattered Crown'"
        className="w-full input-carved rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Direction... e.g. 'an ancient prophecy about a returning evil'"
        rows={2}
        className="w-full input-carved rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground font-['IM_Fell_English'] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
      />

      <Button size="sm" variant="primary" disabled={loading} onClick={handleGenerate} className="w-full">
        {loading ? (
          <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Generating...</>
        ) : (
          <><Sparkles className="mr-1.5 h-3.5 w-3.5" />Generate Lore</>
        )}
      </Button>
    </div>
  );
}

export function AIToolsTab({ campaignId }: AIToolsTabProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-carved font-[Cinzel] tracking-wider text-xs font-semibold text-foreground uppercase">
        AI Tools
      </h3>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <ToolButton
          icon={Users}
          label="NPC"
          active={activeTool === 'npc'}
          onClick={() => setActiveTool(activeTool === 'npc' ? null : 'npc')}
        />
        <ToolButton
          icon={Swords}
          label="Encounter"
          active={activeTool === 'encounter'}
          onClick={() => setActiveTool(activeTool === 'encounter' ? null : 'encounter')}
        />
        <ToolButton
          icon={ScrollText}
          label="Quest"
          active={activeTool === 'quest'}
          onClick={() => setActiveTool(activeTool === 'quest' ? null : 'quest')}
        />
        <ToolButton
          icon={BookMarked}
          label="Lore"
          active={activeTool === 'lore'}
          onClick={() => setActiveTool(activeTool === 'lore' ? null : 'lore')}
        />
        <ToolButton
          icon={BookOpen}
          label="Rules"
          active={activeTool === 'rules'}
          onClick={() => setActiveTool(activeTool === 'rules' ? null : 'rules')}
        />
      </div>

      {activeTool === 'npc' && <NPCGenerator campaignId={campaignId} />}
      {activeTool === 'encounter' && <EncounterGenerator campaignId={campaignId} />}
      {activeTool === 'quest' && <QuestGenerator campaignId={campaignId} />}
      {activeTool === 'lore' && <LoreGenerator campaignId={campaignId} />}
      {activeTool === 'rules' && <RulesLookup campaignId={campaignId} />}

      {!activeTool && (
        <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic text-center py-4">
          Select a tool above to generate content mid-session.
        </p>
      )}
    </div>
  );
}
