import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Check,
  Brain,
  Sparkles,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  useGetCampaignContext,
  useUpdateCampaignContext,
} from '@/hooks/useCampaignContext';
import type {
  CampaignContext,
  UpdateCampaignContextPayload,
  KeyLocation,
  KeyFaction,
  KeyNPC,
  PlotThread,
  PartyRelationship,
  ToneSliders,
} from '@/types/campaign-context';

// ── Helpers ──────────────────────────────────────────────────

function useDebounceCallback(delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const debounce = useCallback(
    (fn: () => void) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(fn, delay);
    },
    [delay],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debounce;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

// ── Context Health ───────────────────────────────────────────

type HealthLevel = 'green' | 'amber' | 'red';

function computeHealth(ctx: CampaignContext): {
  level: HealthLevel;
  missing: string[];
} {
  const missing: string[] = [];
  if (!ctx.settingOverview?.trim()) missing.push('Setting Overview');
  if (!ctx.themes?.length) missing.push('Themes');
  if (!ctx.currentSituation?.trim()) missing.push('Current Situation');
  const tone = ctx.toneSliders;
  const hasCustomTone =
    tone &&
    (tone.gritty !== 5 ||
      tone.humorous !== 5 ||
      tone.heroic !== 5 ||
      tone.horror !== 5);
  if (!hasCustomTone) missing.push('Tone (all defaults)');

  if (missing.length === 0) return { level: 'green', missing };
  if (missing.length <= 2) return { level: 'amber', missing };
  return { level: 'red', missing };
}

const healthColors: Record<HealthLevel, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const healthLabels: Record<HealthLevel, string> = {
  green: 'All core fields populated',
  amber: 'Some fields missing',
  red: 'Context needs setup',
};

// ── Collapsible Section ─────────────────────────────────────

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[hsla(38,30%,25%,0.15)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[hsla(38,30%,30%,0.06)]"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-primary/70 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="font-['IM_Fell_English'] text-sm font-semibold text-foreground">
          {title}
        </span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Tag Input ───────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(idx: number) {
    onChange(tags.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-sm border border-border bg-[hsl(24,15%,10%)] px-2 py-1.5 focus-within:ring-1 focus-within:ring-primary/40">
      {tags.map((tag, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 rounded-sm bg-primary/15 px-2 py-0.5 text-xs text-primary border border-primary/20"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(idx)}
            className="text-primary/60 hover:text-primary"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[80px] flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
      />
    </div>
  );
}

// ── Field Components ────────────────────────────────────────

const fieldClasses =
  'w-full rounded-sm border border-border bg-[hsl(24,15%,10%)] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors';
const labelClasses = 'block text-xs font-medium text-muted-foreground mb-1';
const selectClasses =
  'rounded-sm border border-border bg-[hsl(24,15%,10%)] px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40';

// ── Tone Slider ─────────────────────────────────────────────

function ToneSlider({
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-1.5 cursor-pointer"
      />
      <div className="text-center text-[10px] text-muted-foreground/60">
        {value}/10
      </div>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────

interface CampaignBrainPanelProps {
  campaignId: string;
}

export function CampaignBrainPanel({ campaignId }: CampaignBrainPanelProps) {
  const { data: ctx, isLoading, isError, refetch } = useGetCampaignContext(campaignId);
  const mutation = useUpdateCampaignContext(campaignId);
  const debounce = useDebounceCallback(500);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const patchField = useCallback(
    (payload: UpdateCampaignContextPayload) => {
      setSaveStatus('saving');
      debounce(() => {
        mutation.mutate(payload, {
          onSuccess: () => {
            setSaveStatus('saved');
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
          },
          onError: () => {
            setSaveStatus('idle');
          },
        });
      });
    },
    [debounce, mutation],
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading campaign context..." />;
  }

  if (isError) {
    return (
      <div className="p-4">
        <ErrorMessage
          title="Failed to load campaign context"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!ctx) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Check for empty-state: no setting and no themes
  const isEmpty =
    !ctx.settingOverview?.trim() &&
    !ctx.themes?.length &&
    !ctx.keyLocations?.length;

  if (isEmpty) {
    return renderEmptyState(ctx, patchField, saveStatus);
  }

  return renderMainPanel(ctx, patchField, saveStatus);
}

// ── Empty State ─────────────────────────────────────────────

function renderEmptyState(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
  saveStatus: SaveStatus,
) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-lg mx-auto space-y-6">
        {renderEmptyStateHeader()}
        {renderEmptyStateForm(ctx, patchField)}
        {renderSaveIndicator(saveStatus)}
      </div>
    </div>
  );
}

function renderEmptyStateHeader() {
  return (
    <div className="text-center space-y-3">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-primary/10">
        <Brain className="h-7 w-7 text-primary/70" />
      </div>
      <h3 className="text-lg font-semibold text-foreground font-['IM_Fell_English']">
        Help the AI Understand Your World
      </h3>
      <p className="text-sm text-muted-foreground">
        Set up the Campaign Brain so every AI feature knows your setting, tone,
        and key details. You can always update this later.
      </p>
    </div>
  );
}

function renderEmptyStateForm(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClasses}>Describe Your Setting</label>
        <textarea
          className={fieldClasses + ' h-24 resize-none'}
          placeholder="A war-torn continent where ancient magic is reawakening..."
          maxLength={500}
          defaultValue={ctx.settingOverview}
          onChange={(e) => patchField({ settingOverview: e.target.value })}
        />
      </div>
      {renderEmptyStateTone(ctx, patchField)}
      <div>
        <label className={labelClasses}>Themes (press Enter to add)</label>
        <TagInput
          tags={ctx.themes ?? []}
          onChange={(themes) => patchField({ themes })}
          placeholder="e.g. Redemption, Political intrigue..."
        />
      </div>
    </div>
  );
}

function renderEmptyStateTone(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  const tone = ctx.toneSliders ?? { gritty: 5, humorous: 5, heroic: 5, horror: 5 };
  return (
    <div>
      <label className={labelClasses}>Set the Tone</label>
      <div className="space-y-2 rounded-sm border border-border bg-[hsl(24,15%,10%)] p-3">
        <ToneSlider
          leftLabel="Gritty"
          rightLabel="Light"
          value={tone.gritty}
          onChange={(v) =>
            patchField({ toneSliders: { ...tone, gritty: v } })
          }
        />
        <ToneSlider
          leftLabel="Serious"
          rightLabel="Humorous"
          value={tone.humorous}
          onChange={(v) =>
            patchField({ toneSliders: { ...tone, humorous: v } })
          }
        />
      </div>
    </div>
  );
}

// ── Main Panel Render ───────────────────────────────────────

function renderMainPanel(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
  saveStatus: SaveStatus,
) {
  const health = computeHealth(ctx);
  return (
    <div className="flex h-full flex-col">
      {renderPanelHeader(health, saveStatus)}
      <div className="flex-1 overflow-y-auto">
        {renderWorldOverviewSection(ctx, patchField)}
        {renderKeyEntitiesSection(ctx, patchField)}
        {renderPlotThreadsSection(ctx, patchField)}
        {renderPartySection(ctx, patchField)}
        {renderDMPreferencesSection(ctx, patchField)}
        {renderHouseRulesSection(ctx, patchField)}
      </div>
    </div>
  );
}

function renderPanelHeader(
  health: { level: HealthLevel; missing: string[] },
  saveStatus: SaveStatus,
) {
  return (
    <div className="flex items-center justify-between border-b border-[hsla(38,30%,25%,0.2)] px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="relative group">
          <div className={`h-2.5 w-2.5 rounded-full ${healthColors[health.level]}`} />
          <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block w-52 rounded-md border border-border bg-card p-2 text-xs text-muted-foreground shadow-lg">
            <p className="font-medium text-foreground mb-1">{healthLabels[health.level]}</p>
            {health.missing.length > 0 && (
              <ul className="list-disc pl-3 space-y-0.5">
                {health.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <span className="font-['IM_Fell_English'] text-sm font-semibold text-foreground">
          Campaign Brain
        </span>
      </div>
      {renderSaveIndicator(saveStatus)}
    </div>
  );
}

function renderSaveIndicator(saveStatus: SaveStatus) {
  if (saveStatus === 'idle') return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      {saveStatus === 'saving' ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Check className="h-3 w-3 text-emerald-500" />
          Saved
        </>
      )}
    </span>
  );
}

// ── Section 1: World Overview ───────────────────────────────

function renderWorldOverviewSection(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  return (
    <CollapsibleSection title="World Overview" defaultOpen>
      {renderSettingOverview(ctx, patchField)}
      {renderThemes(ctx, patchField)}
      {renderToneSliders(ctx, patchField)}
      {renderCurrentSituation(ctx, patchField)}
    </CollapsibleSection>
  );
}

function renderSettingOverview(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  return (
    <div>
      <label className={labelClasses}>Setting Overview</label>
      <textarea
        className={fieldClasses + ' h-20 resize-none'}
        maxLength={500}
        defaultValue={ctx.settingOverview}
        placeholder="Describe the world, era, and overall setting..."
        onChange={(e) => patchField({ settingOverview: e.target.value })}
      />
      <p className="text-[10px] text-muted-foreground/50 mt-0.5 text-right">
        {ctx.settingOverview?.length ?? 0}/500
      </p>
    </div>
  );
}

function renderThemes(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  return (
    <div>
      <label className={labelClasses}>Themes (press Enter to add)</label>
      <TagInput
        tags={ctx.themes ?? []}
        onChange={(themes) => patchField({ themes })}
        placeholder="e.g. Redemption, War, Discovery..."
      />
    </div>
  );
}

function renderToneSliders(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  const tone = ctx.toneSliders ?? { gritty: 5, humorous: 5, heroic: 5, horror: 5 };

  function updateTone(partial: Partial<ToneSliders>) {
    patchField({ toneSliders: { ...tone, ...partial } });
  }

  return (
    <div>
      <label className={labelClasses}>Tone</label>
      <div className="space-y-2 rounded-sm border border-border bg-[hsl(24,15%,10%)] p-3">
        <ToneSlider leftLabel="Gritty" rightLabel="Light" value={tone.gritty} onChange={(v) => updateTone({ gritty: v })} />
        <ToneSlider leftLabel="Serious" rightLabel="Humorous" value={tone.humorous} onChange={(v) => updateTone({ humorous: v })} />
        <ToneSlider leftLabel="Realistic" rightLabel="Heroic" value={tone.heroic} onChange={(v) => updateTone({ heroic: v })} />
        <ToneSlider leftLabel="Safe" rightLabel="Horror" value={tone.horror} onChange={(v) => updateTone({ horror: v })} />
      </div>
    </div>
  );
}

function renderCurrentSituation(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className={labelClasses + ' mb-0'}>Current Situation</label>
        {ctx.updatedAt && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary/70 border border-primary/15">
            <Sparkles className="h-2.5 w-2.5" />
            may auto-update from recaps
          </span>
        )}
      </div>
      <textarea
        className={fieldClasses + ' h-20 resize-none'}
        maxLength={500}
        defaultValue={ctx.currentSituation}
        placeholder="What's currently happening in the campaign..."
        onChange={(e) => patchField({ currentSituation: e.target.value })}
      />
    </div>
  );
}

// ── Section 2: Key Entities ─────────────────────────────────

function renderKeyEntitiesSection(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  return (
    <CollapsibleSection title="Key Entities">
      {renderKeyLocations(ctx, patchField)}
      {renderKeyFactions(ctx, patchField)}
      {renderKeyNPCs(ctx, patchField)}
    </CollapsibleSection>
  );
}

// -- Key Locations --

function renderKeyLocations(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  const locations = ctx.keyLocations ?? [];

  function add() {
    patchField({
      keyLocations: [
        ...locations,
        { name: '', description: '', importance: 'minor' },
      ],
    });
  }

  function update(idx: number, partial: Partial<KeyLocation>) {
    const updated = locations.map((loc, i) =>
      i === idx ? { ...loc, ...partial } : loc,
    );
    patchField({ keyLocations: updated });
  }

  function remove(idx: number) {
    patchField({ keyLocations: locations.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelClasses + ' mb-0'}>Key Locations</label>
        <button type="button" onClick={add} className="text-primary/70 hover:text-primary">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        {locations.map((loc, idx) => renderLocationRow(loc, idx, update, remove))}
      </div>
      {locations.length === 0 && (
        <p className="text-[10px] text-muted-foreground/50 italic">No locations yet</p>
      )}
    </div>
  );
}

function renderLocationRow(
  loc: KeyLocation,
  idx: number,
  update: (idx: number, p: Partial<KeyLocation>) => void,
  remove: (idx: number) => void,
) {
  return (
    <div
      key={idx}
      className="rounded-sm border border-border bg-[hsl(24,15%,10%)] p-2 space-y-1.5"
    >
      <div className="flex items-center gap-2">
        <input
          className={fieldClasses + ' flex-1'}
          placeholder="Location name"
          defaultValue={loc.name}
          onChange={(e) => update(idx, { name: e.target.value })}
        />
        <select
          className={selectClasses}
          value={loc.importance}
          onChange={(e) => update(idx, { importance: e.target.value as KeyLocation['importance'] })}
        >
          <option value="major">Major</option>
          <option value="minor">Minor</option>
          <option value="background">Background</option>
        </select>
        <button type="button" onClick={() => remove(idx)} className="text-muted-foreground/50 hover:text-destructive">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        className={fieldClasses}
        placeholder="Brief description"
        defaultValue={loc.description}
        onChange={(e) => update(idx, { description: e.target.value })}
      />
    </div>
  );
}

// -- Key Factions --

function renderKeyFactions(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  const factions = ctx.keyFactions ?? [];

  function add() {
    patchField({
      keyFactions: [
        ...factions,
        { name: '', goals: '', power: 'minor', attitude: '' },
      ],
    });
  }

  function update(idx: number, partial: Partial<KeyFaction>) {
    const updated = factions.map((f, i) =>
      i === idx ? { ...f, ...partial } : f,
    );
    patchField({ keyFactions: updated });
  }

  function remove(idx: number) {
    patchField({ keyFactions: factions.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelClasses + ' mb-0'}>Key Factions</label>
        <button type="button" onClick={add} className="text-primary/70 hover:text-primary">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        {factions.map((fac, idx) => renderFactionRow(fac, idx, update, remove))}
      </div>
      {factions.length === 0 && (
        <p className="text-[10px] text-muted-foreground/50 italic">No factions yet</p>
      )}
    </div>
  );
}

function renderFactionRow(
  fac: KeyFaction,
  idx: number,
  update: (idx: number, p: Partial<KeyFaction>) => void,
  remove: (idx: number) => void,
) {
  return (
    <div
      key={idx}
      className="rounded-sm border border-border bg-[hsl(24,15%,10%)] p-2 space-y-1.5"
    >
      <div className="flex items-center gap-2">
        <input
          className={fieldClasses + ' flex-1'}
          placeholder="Faction name"
          defaultValue={fac.name}
          onChange={(e) => update(idx, { name: e.target.value })}
        />
        <select
          className={selectClasses}
          value={fac.power}
          onChange={(e) => update(idx, { power: e.target.value as KeyFaction['power'] })}
        >
          <option value="dominant">Dominant</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </select>
        <button type="button" onClick={() => remove(idx)} className="text-muted-foreground/50 hover:text-destructive">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        className={fieldClasses}
        placeholder="Goals"
        defaultValue={fac.goals}
        onChange={(e) => update(idx, { goals: e.target.value })}
      />
      <input
        className={fieldClasses}
        placeholder="Attitude (e.g. Suspicious of outsiders)"
        defaultValue={fac.attitude}
        onChange={(e) => update(idx, { attitude: e.target.value })}
      />
    </div>
  );
}

// -- Key NPCs --

function renderKeyNPCs(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  const npcs = ctx.keyNPCs ?? [];

  function add() {
    patchField({
      keyNPCs: [
        ...npcs,
        { name: '', role: '', importance: 'supporting', secrets: [] },
      ],
    });
  }

  function update(idx: number, partial: Partial<KeyNPC>) {
    const updated = npcs.map((n, i) =>
      i === idx ? { ...n, ...partial } : n,
    );
    patchField({ keyNPCs: updated });
  }

  function remove(idx: number) {
    patchField({ keyNPCs: npcs.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelClasses + ' mb-0'}>Key NPCs</label>
        <button type="button" onClick={add} className="text-primary/70 hover:text-primary">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        {npcs.map((npc, idx) => renderNPCRow(npc, idx, update, remove))}
      </div>
      {npcs.length === 0 && (
        <p className="text-[10px] text-muted-foreground/50 italic">No NPCs yet</p>
      )}
    </div>
  );
}

function renderNPCRow(
  npc: KeyNPC,
  idx: number,
  update: (idx: number, p: Partial<KeyNPC>) => void,
  remove: (idx: number) => void,
) {
  return (
    <div
      key={idx}
      className="rounded-sm border border-border bg-[hsl(24,15%,10%)] p-2 space-y-1.5"
    >
      <div className="flex items-center gap-2">
        <input
          className={fieldClasses + ' flex-1'}
          placeholder="NPC name"
          defaultValue={npc.name}
          onChange={(e) => update(idx, { name: e.target.value })}
        />
        <select
          className={selectClasses}
          value={npc.importance}
          onChange={(e) => update(idx, { importance: e.target.value as KeyNPC['importance'] })}
        >
          <option value="critical">Critical</option>
          <option value="important">Important</option>
          <option value="supporting">Supporting</option>
        </select>
        <button type="button" onClick={() => remove(idx)} className="text-muted-foreground/50 hover:text-destructive">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        className={fieldClasses}
        placeholder="Role (e.g. Village elder, Court wizard)"
        defaultValue={npc.role}
        onChange={(e) => update(idx, { role: e.target.value })}
      />
      <textarea
        className={fieldClasses + ' h-14 resize-none'}
        placeholder="Secrets (one per line)"
        defaultValue={npc.secrets?.join('\n') ?? ''}
        onChange={(e) =>
          update(idx, {
            secrets: e.target.value
              .split('\n')
              .filter((s) => s.trim()),
          })
        }
      />
    </div>
  );
}

// ── Section 3: Plot Threads ─────────────────────────────────

function renderPlotThreadsSection(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  const threads = ctx.plotThreads ?? [];

  function add() {
    patchField({
      plotThreads: [
        ...threads,
        { title: '', description: '', status: 'active', priority: 'important' },
      ],
    });
  }

  function update(idx: number, partial: Partial<PlotThread>) {
    const updated = threads.map((t, i) =>
      i === idx ? { ...t, ...partial } : t,
    );
    patchField({ plotThreads: updated });
  }

  function remove(idx: number) {
    patchField({ plotThreads: threads.filter((_, i) => i !== idx) });
  }

  return (
    <CollapsibleSection title="Plot Threads">
      <div className="flex items-center justify-between mb-1">
        <label className={labelClasses + ' mb-0'}>
          Active Threads ({threads.filter((t) => t.status === 'active').length})
        </label>
        <button type="button" onClick={add} className="text-primary/70 hover:text-primary">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        {threads.map((thread, idx) => renderPlotThreadRow(thread, idx, update, remove))}
      </div>
      {threads.length === 0 && (
        <p className="text-[10px] text-muted-foreground/50 italic">No plot threads yet</p>
      )}
    </CollapsibleSection>
  );
}

function renderPlotThreadRow(
  thread: PlotThread,
  idx: number,
  update: (idx: number, p: Partial<PlotThread>) => void,
  remove: (idx: number) => void,
) {
  const isDimmed = thread.status === 'resolved' || thread.status === 'failed';
  return (
    <div
      key={idx}
      className={`rounded-sm border border-border bg-[hsl(24,15%,10%)] p-2 space-y-1.5 transition-opacity ${
        isDimmed ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <input
          className={`${fieldClasses} flex-1 ${isDimmed ? 'line-through' : ''}`}
          placeholder="Thread title"
          defaultValue={thread.title}
          onChange={(e) => update(idx, { title: e.target.value })}
        />
        <select
          className={selectClasses}
          value={thread.status}
          onChange={(e) => update(idx, { status: e.target.value as PlotThread['status'] })}
        >
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="failed">Failed</option>
          <option value="unknown">Unknown</option>
        </select>
        <button type="button" onClick={() => remove(idx)} className="text-muted-foreground/50 hover:text-destructive">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          className={`${fieldClasses} flex-1`}
          placeholder="Description"
          defaultValue={thread.description}
          onChange={(e) => update(idx, { description: e.target.value })}
        />
        <select
          className={selectClasses}
          value={thread.priority}
          onChange={(e) => update(idx, { priority: e.target.value as PlotThread['priority'] })}
        >
          <option value="urgent">Urgent</option>
          <option value="important">Important</option>
          <option value="background">Background</option>
        </select>
      </div>
    </div>
  );
}

// ── Section 4: Party & Relationships ────────────────────────

function renderPartySection(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  const party = ctx.partyContext ?? {
    reputation: '',
    relationships: [],
    knownSecrets: [],
  };

  function updateParty(partial: Partial<typeof party>) {
    patchField({ partyContext: { ...party, ...partial } });
  }

  return (
    <CollapsibleSection title="Party & Relationships">
      {renderReputation(party, updateParty)}
      {renderRelationships(party, updateParty)}
      {renderKnownSecrets(party, updateParty)}
    </CollapsibleSection>
  );
}

function renderReputation(
  party: CampaignContext['partyContext'],
  updateParty: (p: Partial<CampaignContext['partyContext']>) => void,
) {
  return (
    <div>
      <label className={labelClasses}>Party Reputation</label>
      <input
        className={fieldClasses}
        placeholder="e.g. Heroes of Phandalin, Wanted criminals..."
        defaultValue={party.reputation}
        onChange={(e) => updateParty({ reputation: e.target.value })}
      />
    </div>
  );
}

function renderRelationships(
  party: CampaignContext['partyContext'],
  updateParty: (p: Partial<CampaignContext['partyContext']>) => void,
) {
  const rels = party.relationships ?? [];

  function add() {
    updateParty({
      relationships: [...rels, { faction: '', status: 'neutral' as const }],
    });
  }

  function update(idx: number, partial: Partial<PartyRelationship>) {
    const updated = rels.map((r, i) =>
      i === idx ? { ...r, ...partial } : r,
    );
    updateParty({ relationships: updated });
  }

  function remove(idx: number) {
    updateParty({ relationships: rels.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelClasses + ' mb-0'}>Relationships</label>
        <button type="button" onClick={add} className="text-primary/70 hover:text-primary">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1.5">
        {rels.map((rel, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className={fieldClasses + ' flex-1'}
              placeholder="Faction name"
              defaultValue={rel.faction}
              onChange={(e) => update(idx, { faction: e.target.value })}
            />
            <select
              className={selectClasses}
              value={rel.status}
              onChange={(e) => update(idx, { status: e.target.value as PartyRelationship['status'] })}
            >
              <option value="friendly">Friendly</option>
              <option value="neutral">Neutral</option>
              <option value="hostile">Hostile</option>
              <option value="unknown">Unknown</option>
            </select>
            <button type="button" onClick={() => remove(idx)} className="text-muted-foreground/50 hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      {rels.length === 0 && (
        <p className="text-[10px] text-muted-foreground/50 italic">No relationships yet</p>
      )}
    </div>
  );
}

function renderKnownSecrets(
  party: CampaignContext['partyContext'],
  updateParty: (p: Partial<CampaignContext['partyContext']>) => void,
) {
  const secrets = party.knownSecrets ?? [];

  return (
    <div>
      <label className={labelClasses}>Known Secrets (press Enter to add)</label>
      <TagInput
        tags={secrets}
        onChange={(knownSecrets) => updateParty({ knownSecrets })}
        placeholder="e.g. The duke is a vampire..."
      />
    </div>
  );
}

// ── Section 5: DM Preferences ───────────────────────────────

function renderDMPreferencesSection(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  const prefs = ctx.dmPreferences ?? {
    narrativeVoice: 'balanced',
    detailLevel: 'moderate',
    emphasize: [],
  };

  function updatePrefs(partial: Partial<typeof prefs>) {
    patchField({ dmPreferences: { ...prefs, ...partial } });
  }

  return (
    <CollapsibleSection title="DM Preferences">
      {renderNarrativeVoice(prefs, updatePrefs)}
      {renderDetailLevel(prefs, updatePrefs)}
      {renderEmphasize(prefs, updatePrefs)}
    </CollapsibleSection>
  );
}

function renderNarrativeVoice(
  prefs: CampaignContext['dmPreferences'],
  updatePrefs: (p: Partial<CampaignContext['dmPreferences']>) => void,
) {
  return (
    <div>
      <label className={labelClasses}>Narrative Voice</label>
      <input
        className={fieldClasses}
        placeholder="e.g. Dramatic and mysterious, Casual and witty..."
        defaultValue={prefs.narrativeVoice}
        onChange={(e) => updatePrefs({ narrativeVoice: e.target.value })}
      />
    </div>
  );
}

function renderDetailLevel(
  prefs: CampaignContext['dmPreferences'],
  updatePrefs: (p: Partial<CampaignContext['dmPreferences']>) => void,
) {
  return (
    <div>
      <label className={labelClasses}>Detail Level</label>
      <select
        className={selectClasses + ' w-full'}
        value={prefs.detailLevel}
        onChange={(e) =>
          updatePrefs({
            detailLevel: e.target.value as CampaignContext['dmPreferences']['detailLevel'],
          })
        }
      >
        <option value="minimal">Brief</option>
        <option value="moderate">Moderate</option>
        <option value="verbose">Detailed</option>
      </select>
    </div>
  );
}

function renderEmphasize(
  prefs: CampaignContext['dmPreferences'],
  updatePrefs: (p: Partial<CampaignContext['dmPreferences']>) => void,
) {
  return (
    <div>
      <label className={labelClasses}>Emphasize (press Enter to add)</label>
      <TagInput
        tags={prefs.emphasize ?? []}
        onChange={(emphasize) => updatePrefs({ emphasize })}
        placeholder="e.g. Combat tactics, Political drama..."
      />
    </div>
  );
}

// ── Section 6: House Rules ──────────────────────────────────

function renderHouseRulesSection(
  ctx: CampaignContext,
  patchField: (p: UpdateCampaignContextPayload) => void,
) {
  return (
    <CollapsibleSection title="House Rules">
      <div>
        <label className={labelClasses}>
          House rules the AI should know about
        </label>
        <textarea
          className={fieldClasses + ' h-28 resize-y'}
          placeholder="e.g. Critical hits do max damage + roll. We use flanking rules. Natural 1s on ability checks aren't auto-fails..."
          defaultValue={ctx.houseRules}
          onChange={(e) => patchField({ houseRules: e.target.value })}
        />
      </div>
    </CollapsibleSection>
  );
}
