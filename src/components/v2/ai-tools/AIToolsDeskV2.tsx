import type { ReactNode } from 'react';
import {
  BookOpen,
  Coins,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { AgeVerificationModal } from '@/components/ui/AgeVerificationModal';
import { shellPanelClass } from '@/lib/panel-styles';
import {
  useAIToolsContext,
  locationTypes,
  tavernTones,
  shopTypes,
  questTypes,
  loreTypes,
  worldNpcRoles,
} from './AIToolsContext';
import type {
  EncounterDifficulty,
  GeneratedEncounter,
  GeneratedNPC,
  GeneratedPlotHooks,
  RuleAnswer,
  SaveAIEncounterRequest,
  Session,
  WorldEntity,
} from './AIToolsContext';

export function AIToolsDeskV2() {
  const {
    user,
    refreshUser,
    creditBalance,
    creditCosts,
    usageSummary,
    sessions,
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
    campaignId,
  } = useAIToolsContext();

  const totalUsageCalls = (usageSummary ?? []).reduce((sum, row) => sum + row.count, 0);
  const totalUsageTokens = (usageSummary ?? []).reduce((sum, row) => sum + row.totalTokens, 0);

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
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,hsla(40,48%,24%,0.12),transparent_28%),linear-gradient(180deg,hsl(224,18%,8%)_0%,hsl(18,20%,7%)_100%)] p-4 text-[hsl(38,24%,88%)]">
      {user && !user.ageVerified ? (
        <AgeVerificationModal
          onVerified={() => { refreshUser(); }}
          onCancel={() => undefined}
        />
      ) : null}

      <section className={`${shellPanelClass} min-h-0 flex-1 flex flex-col overflow-hidden`}>
        {renderShellHeader()}
        {renderShellBody()}
      </section>
    </div>
  );

  function renderShellHeader() {
    return (
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.42)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {renderShellHeaderLeft()}
          {renderShellHeaderMetrics()}
        </div>
      </div>
    );
  }

  function renderShellHeaderLeft() {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]">
          AI TOOLS
        </p>
        <h2 className="mt-0.5 font-['IM_Fell_English'] text-[26px] leading-none text-[hsl(38,42%,90%)]">
          {selectedDefinition.label}
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-[hsl(30,13%,62%)]">
          {selectedDefinition.helper}
        </p>
      </div>
    );
  }

  function renderShellHeaderMetrics() {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <MetricChip icon={Coins} label="Credits" value={String(creditBalance?.total ?? 0)} />
        <MetricChip icon={Sparkles} label="Calls" value={String(totalUsageCalls)} />
        <MetricChip icon={BookOpen} label="Outputs" value={String(recentOutputs.length)} />
        <MetricChip icon={WandSparkles} label="Tokens" value={totalUsageTokens.toLocaleString()} />
      </div>
    );
  }

  function renderShellBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {renderBodyContent()}
      </div>
    );
  }

  function renderBodyContent() {
    return (
      <div className="mt-0 grid gap-5 2xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
        {renderBodyLeft()}
        {renderBodyRight()}
      </div>
    );
  }

  function renderBodyLeft() {
    return (
      <div className="space-y-5">
        {renderToolHeaderSection()}
        {renderWorkspaceSection()}
        {renderOutputSection()}
      </div>
    );
  }

  function renderToolHeaderSection() {
    return (
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
          {selectedDefinition.description} This workspace uses the campaign's saved context rather than asking the GM to handcraft prompts from scratch.
        </p>
        {renderNotices()}
      </div>
    );
  }

  function renderNotices() {
    if (!user?.ageVerified) {
      return (
        <NoticeBanner
          title="Age verification required"
          body="AI tools are available after confirming you are 18 or older. The rest of the campaign workspace remains available without it."
        />
      );
    }
    if (user.ageVerified && (creditBalance?.total ?? 0) === 0) {
      return (
        <NoticeBanner
          title="No AI credits available"
          body="The tool desk is ready, but generation is paused until credits are available again."
        />
      );
    }
    return null;
  }

  function renderWorkspaceSection() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] p-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Tool Workspace</p>
        <div className="mt-4">{renderWorkspace()}</div>
      </div>
    );
  }

  function renderOutputSection() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] p-4">
        {renderOutputSectionHeader()}
        <div className="mt-4">{renderOutput()}</div>
      </div>
    );
  }

  function renderOutputSectionHeader() {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Current Output</p>
          <h4 className="mt-1 font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">Draft Result</h4>
        </div>
        {renderOutputActions()}
      </div>
    );
  }

  function renderOutputActions() {
    return (
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
    );
  }

  function renderBodyRight() {
    return (
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
        {renderUsagePanel()}
      </div>
    );
  }

  function renderUsagePanel() {
    return (
      <div className="rounded-[22px] border border-[hsla(32,24%,22%,0.68)] bg-[hsla(22,20%,10%,0.68)] p-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Usage Read</p>
        <h4 className="mt-1 font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">This Month</h4>
        <div className="mt-4 divide-y divide-[hsla(32,24%,22%,0.32)]">
          {(usageSummary ?? []).length > 0 ? (
            (usageSummary ?? []).map((row) => (
              <div
                key={row._id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
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
    );
  }

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
              <Field
                label="Session"
                description="This tool uses the session's saved notes and updates its recap fields directly."
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

// ── ToolForm ──────────────────────────────────────────────────────────────────

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

// ── Field ─────────────────────────────────────────────────────────────────────

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

// ── Output cards ──────────────────────────────────────────────────────────────

function NPCOutputCard({ npc }: { npc: GeneratedNPC }) {
  return (
    <div className="space-y-4">
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h5 className="font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">{encounter.title}</h5>
          <p className="mt-1 text-sm text-[hsl(42,72%,78%)]">
            {humanize(encounter.difficulty)} · {encounter.totalXP} XP
          </p>
        </div>
      </div>
      <OutputBlock title="Brief" body={encounter.description} />
      {renderCombatants(encounter)}
      <OutputBlock title="Tactics" body={encounter.tactics} />
      {encounter.treasure ? <OutputBlock title="Treasure" body={encounter.treasure} /> : null}
    </div>
  );

  function renderCombatants(enc: GeneratedEncounter) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Combatants</p>
        <div className="mt-2 space-y-2">
          {enc.npcs.map((npc, index) => (
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
    );
  }
}

function PlotHooksOutputCard({ hooks }: { hooks: GeneratedPlotHooks }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Hooks</p>
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
    <div className="space-y-4">
      <div>
        <h5 className="font-[Cinzel] text-xl text-[hsl(38,34%,88%)]">{entity.name}</h5>
        <p className="mt-1 text-sm text-[hsl(42,72%,78%)]">{humanize(entity.type)}</p>
      </div>
      {entity.description ? <OutputBlock title="Description" body={entity.description} /> : null}
      {'objectives' in entity && entity.objectives?.length ? renderObjectives(entity) : null}
      {'rewards' in entity && entity.rewards ? <OutputBlock title="Rewards" body={entity.rewards} /> : null}
      {entity.typeData && Object.keys(entity.typeData).length > 0 ? renderExtraDetail(entity) : null}
    </div>
  );

  function renderObjectives(ent: WorldEntity) {
    if (!('objectives' in ent) || !ent.objectives?.length) return null;
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Objectives</p>
        <div className="mt-2 space-y-2">
          {ent.objectives.map((objective) => (
            <div key={objective.id} className="rounded-[16px] border border-[hsla(32,24%,22%,0.58)] bg-[hsla(22,18%,9%,0.8)] px-3 py-2 text-sm text-[hsl(38,28%,84%)]">
              {objective.description}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderExtraDetail(ent: WorldEntity) {
    if (!ent.typeData || !Object.keys(ent.typeData).length) return null;
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">Extra Detail</p>
        <div className="mt-2 space-y-2">
          {Object.entries(ent.typeData)
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
    );
  }
}

function SessionSummaryOutputCard({ session }: { session: Session }) {
  const summary = session.aiSummary;
  return (
    <div className="space-y-4">
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
    <div className="space-y-4">
      <OutputBlock title="Answer" body={answer.answer} />
      {answer.citations.length ? <OutputList title="Citations" items={answer.citations} /> : null}
      {answer.relevantRules.length ? <OutputList title="Relevant Rules" items={answer.relevantRules} /> : null}
      {answer.dmAdvice ? <OutputBlock title="DM Advice" body={answer.dmAdvice} /> : null}
    </div>
  );
}

// ── Shared output primitives ──────────────────────────────────────────────────

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
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{title}</p>
      <p className={`mt-2 whitespace-pre-wrap text-sm leading-7 text-[hsl(38,28%,84%)] ${mono ? 'font-mono text-xs' : ''}`}>
        {body}
      </p>
    </div>
  );
}

function OutputList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{title}</p>
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

// ── Metric chip ───────────────────────────────────────────────────────────────

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

// ── InfoPanel ─────────────────────────────────────────────────────────────────

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
      <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(30,12%,58%)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[hsl(30,14%,66%)]">{subtitle}</p>
      <div className="mt-4 divide-y divide-[hsla(32,24%,22%,0.32)]">
        {items.length ? (
          items.map((item) => (
            <div key={`${item.title}-${item.detail}`} className="py-2 first:pt-0 last:pb-0">
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

// ── NoticeBanner ──────────────────────────────────────────────────────────────

function NoticeBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-5 rounded-[18px] border border-[hsla(42,52%,38%,0.32)] bg-[hsla(28,34%,12%,0.72)] px-4 py-3">
      <p className="font-[Cinzel] text-base text-[hsl(42,72%,82%)]">{title}</p>
      <p className="mt-1 text-sm leading-7 text-[hsl(30,16%,70%)]">{body}</p>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

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
