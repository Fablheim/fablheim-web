import { useMemo, useState } from 'react';
import {
  BadgeHelp,
  DoorOpen,
  HeartHandshake,
  MessagesSquare,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCampaign, useUpdateSafetyTools } from '@/hooks/useCampaigns';

type SafetyToolId = 'lines-veils' | 'x-card' | 'open-door' | 'check-ins' | 'player-notes';

type SafetyDraft = {
  lines: string[];
  veils: string[];
  xCardEnabled: boolean;
  xCardGuidance: string;
  openDoorEnabled: boolean;
  openDoorNotes: string;
  checkInPrompts: string[];
  playerNotes: string[];
};

const TOOL_DEFS: Array<{
  id: SafetyToolId;
  label: string;
  blurb: string;
  icon: typeof ShieldAlert;
}> = [
  {
    id: 'lines-veils',
    label: 'Lines & Veils',
    blurb: 'Set hard boundaries and fade-to-black topics for the campaign.',
    icon: ShieldAlert,
  },
  {
    id: 'x-card',
    label: 'X-Card',
    blurb: 'Let anyone signal discomfort and pause the scene without explanation.',
    icon: BadgeHelp,
  },
  {
    id: 'open-door',
    label: 'Open Door',
    blurb: 'Support stepping away, pausing, or checking out without pressure.',
    icon: DoorOpen,
  },
  {
    id: 'check-ins',
    label: 'Check-In Prompts',
    blurb: 'Keep gentle reminders ready for before, during, or after play.',
    icon: MessagesSquare,
  },
  {
    id: 'player-notes',
    label: 'Player Notes',
    blurb: 'Keep private comfort notes that help you facilitate with care.',
    icon: HeartHandshake,
  },
];

const panelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(22,24%,9%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';

const inputClass =
  'w-full rounded-2xl border border-[hsla(32,24%,28%,0.72)] bg-[hsla(26,22%,10%,0.9)] px-3 py-2.5 text-sm text-[hsl(38,26%,86%)] placeholder:text-[hsl(30,12%,42%)] outline-none transition focus:border-[hsla(145,42%,58%,0.42)] focus:bg-[hsla(26,22%,12%,0.94)]';

export function SafetyToolsCenterStage({ campaignId }: { campaignId: string }) {
  const { data: campaign } = useCampaign(campaignId);
  const updateSafety = useUpdateSafetyTools();
  const [activeTool, setActiveTool] = useState<SafetyToolId>('lines-veils');

  const draft = useMemo<SafetyDraft>(() => {
    const safetyTools = campaign?.safetyTools;
    return {
      lines: safetyTools?.lines ?? [],
      veils: safetyTools?.veils ?? [],
      xCardEnabled: safetyTools?.xCardEnabled ?? false,
      xCardGuidance: safetyTools?.xCardGuidance ?? '',
      openDoorEnabled: safetyTools?.openDoorEnabled ?? true,
      openDoorNotes: safetyTools?.openDoorNotes ?? '',
      checkInPrompts: safetyTools?.checkInPrompts ?? [],
      playerNotes: safetyTools?.playerNotes ?? [],
    };
  }, [campaign?.safetyTools]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsla(145,30%,24%,0.12),transparent_30%),linear-gradient(180deg,hsl(165,20%,8%)_0%,hsl(22,22%,7%)_100%)] text-[hsl(38,24%,88%)]">
      <div className="shrink-0 border-b border-[hsla(32,24%,24%,0.4)] px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(145,18%,62%)]">Table Care</p>
        <h2 className="mt-1 font-['IM_Fell_English'] text-[30px] leading-none text-[hsl(38,42%,90%)]">
          Safety Tools
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[hsl(30,14%,62%)]">
          Set calm expectations for the table, keep safety agreements visible, and give yourself a clear reference during play.
        </p>

        <SafetyOverview draft={draft} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <SafetyToolkit activeTool={activeTool} onSelect={setActiveTool} />
          <SafetyWorkspace
            activeTool={activeTool}
            draft={draft}
            isSaving={updateSafety.isPending}
            onSave={(data, message) => {
              updateSafety.mutate(
                { campaignId, data },
                {
                  onSuccess: () => toast.success(message),
                  onError: () => toast.error('Could not save safety tools.'),
                },
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SafetyOverview({ draft }: { draft: SafetyDraft }) {
  const cards = [
    {
      label: 'Lines',
      value: String(draft.lines.length),
      note: draft.lines.length ? 'Hard boundaries recorded for the campaign.' : 'No lines recorded yet.',
    },
    {
      label: 'Veils',
      value: String(draft.veils.length),
      note: draft.veils.length ? 'Fade-to-black topics are documented.' : 'No veils recorded yet.',
    },
    {
      label: 'X-Card',
      value: draft.xCardEnabled ? 'Enabled' : 'Off',
      note: draft.xCardEnabled ? 'Players can quietly pause content in session.' : 'Not currently surfaced to players.',
    },
    {
      label: 'Check-Ins',
      value: String(draft.checkInPrompts.length),
      note: draft.checkInPrompts.length ? 'Prompts ready for moments of pause and care.' : 'No prompts saved yet.',
    },
  ];

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[22px] border border-[hsla(145,18%,28%,0.32)] bg-[hsla(160,16%,12%,0.72)] px-4 py-3"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(145,18%,62%)]">{card.label}</p>
          <p className="mt-2 font-['IM_Fell_English'] text-[22px] leading-none text-[hsl(38,40%,88%)]">{card.value}</p>
          <p className="mt-3 text-xs text-[hsl(30,14%,58%)]">{card.note}</p>
        </div>
      ))}
    </div>
  );
}

function SafetyToolkit({
  activeTool,
  onSelect,
}: {
  activeTool: SafetyToolId;
  onSelect: (tool: SafetyToolId) => void;
}) {
  return (
    <aside className={`${panelClass} h-fit`}>
      <div className="border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(145,18%,62%)]">Safety Toolkit</p>
        <p className="mt-2 text-sm leading-6 text-[hsl(30,14%,58%)]">
          Choose the tool you want to configure or review for the campaign.
        </p>
      </div>
      <div className="space-y-2 p-3">
        {TOOL_DEFS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelect(tool.id)}
            className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
              activeTool === tool.id
                ? 'border-[hsla(145,42%,58%,0.36)] bg-[hsla(145,42%,58%,0.1)]'
                : 'border-[hsla(32,24%,24%,0.56)] bg-[hsla(22,18%,10%,0.72)] hover:border-[hsla(145,18%,34%,0.42)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="rounded-2xl border border-[hsla(145,18%,28%,0.32)] bg-[hsla(160,16%,12%,0.72)] p-2 text-[hsl(145,26%,74%)]">
                <tool.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-[Cinzel] text-base text-[hsl(38,34%,86%)]">{tool.label}</p>
                <p className="mt-1 text-sm leading-6 text-[hsl(30,14%,56%)]">{tool.blurb}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function SafetyWorkspace({
  activeTool,
  draft,
  isSaving,
  onSave,
}: {
  activeTool: SafetyToolId;
  draft: SafetyDraft;
  isSaving: boolean;
  onSave: (
    data: Partial<SafetyDraft>,
    message: string,
  ) => void;
}) {
  switch (activeTool) {
    case 'lines-veils':
      return (
        <LinesAndVeilsWorkspace
          key={`lines-veils:${draft.lines.join('|')}::${draft.veils.join('|')}`}
          lines={draft.lines}
          veils={draft.veils}
          isSaving={isSaving}
          onSave={(lines, veils) => onSave({ lines, veils }, 'Lines and veils updated.')}
        />
      );
    case 'x-card':
      return (
        <XCardWorkspace
          key={`x-card:${String(draft.xCardEnabled)}::${draft.xCardGuidance}`}
          enabled={draft.xCardEnabled}
          guidance={draft.xCardGuidance}
          isSaving={isSaving}
          onSave={(xCardEnabled, xCardGuidance) =>
            onSave({ xCardEnabled, xCardGuidance }, 'X-Card settings updated.')
          }
        />
      );
    case 'open-door':
      return (
        <OpenDoorWorkspace
          key={`open-door:${String(draft.openDoorEnabled)}::${draft.openDoorNotes}`}
          enabled={draft.openDoorEnabled}
          notes={draft.openDoorNotes}
          isSaving={isSaving}
          onSave={(openDoorEnabled, openDoorNotes) =>
            onSave({ openDoorEnabled, openDoorNotes }, 'Open Door guidance updated.')
          }
        />
      );
    case 'check-ins':
      return (
        <ListWorkspace
          key={`check-ins:${draft.checkInPrompts.join('|')}`}
          title="Check-In Prompts"
          intro="Keep short reminders you can return to before breaks, after intense scenes, or at the end of play."
          emptyLabel="No prompts saved yet."
          placeholder="e.g. Do we want to pause here and check how everyone is doing?"
          items={draft.checkInPrompts}
          isSaving={isSaving}
          onSave={(checkInPrompts) => onSave({ checkInPrompts }, 'Check-in prompts updated.')}
        />
      );
    case 'player-notes':
      return (
        <ListWorkspace
          key={`player-notes:${draft.playerNotes.join('|')}`}
          title="Player Notes"
          intro="Private comfort notes for the GM. Use these to remember boundaries, sensitivities, or facilitation reminders."
          emptyLabel="No private player notes saved."
          placeholder="e.g. Keep body horror light. Offer breaks before interrogation scenes."
          items={draft.playerNotes}
          isSaving={isSaving}
          onSave={(playerNotes) => onSave({ playerNotes }, 'Player notes updated.')}
          privateTone
        />
      );
    default:
      return null;
  }
}

function LinesAndVeilsWorkspace({
  lines,
  veils,
  isSaving,
  onSave,
}: {
  lines: string[];
  veils: string[];
  isSaving: boolean;
  onSave: (lines: string[], veils: string[]) => void;
}) {
  const [lineDrafts, setLineDrafts] = useState(lines);
  const [veilDrafts, setVeilDrafts] = useState(veils);

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <WorkspaceHeader
        title="Lines & Veils"
        intro="Document what is completely off-limits and what can remain off-screen. Keep this simple and easy to revisit."
        onSave={() => onSave(lineDrafts, veilDrafts)}
        isSaving={isSaving}
      />
      <div className="grid gap-4 px-4 py-4 xl:grid-cols-2">
        <EditableListCard
          title="Lines"
          subtitle="Content that will not appear in the campaign."
          items={lineDrafts}
          onChange={setLineDrafts}
          placeholder="Add a firm boundary..."
          tone="line"
        />
        <EditableListCard
          title="Veils"
          subtitle="Content that may exist but fades to black."
          items={veilDrafts}
          onChange={setVeilDrafts}
          placeholder="Add a fade-to-black topic..."
          tone="veil"
        />
      </div>
    </section>
  );
}

function XCardWorkspace({
  enabled,
  guidance,
  isSaving,
  onSave,
}: {
  enabled: boolean;
  guidance: string;
  isSaving: boolean;
  onSave: (enabled: boolean, guidance: string) => void;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [draftGuidance, setDraftGuidance] = useState(guidance);

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <WorkspaceHeader
        title="X-Card"
        intro="Clarify whether the X-Card is available and what you will do when it is used."
        onSave={() => onSave(isEnabled, draftGuidance.trim())}
        isSaving={isSaving}
      />
      <div className="space-y-4 px-4 py-4">
        <CalmToggle
          label="Enable X-Card"
          description="Show the X-Card in live sessions so any player can anonymously signal discomfort."
          checked={isEnabled}
          onChange={setIsEnabled}
        />
        <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.56)] bg-[hsla(22,18%,10%,0.72)] p-4">
          <label className="text-[10px] uppercase tracking-[0.22em] text-[hsl(145,18%,62%)]">Table Guidance</label>
          <textarea
            value={draftGuidance}
            onChange={(event) => setDraftGuidance(event.target.value)}
            rows={6}
            placeholder="e.g. If the X-Card comes up, we pause immediately, shift away from the content, and check in with the table before continuing."
            className={`${inputClass} mt-2 min-h-[150px] resize-y`}
          />
        </div>
      </div>
    </section>
  );
}

function OpenDoorWorkspace({
  enabled,
  notes,
  isSaving,
  onSave,
}: {
  enabled: boolean;
  notes: string;
  isSaving: boolean;
  onSave: (enabled: boolean, notes: string) => void;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [draftNotes, setDraftNotes] = useState(notes);

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <WorkspaceHeader
        title="Open Door"
        intro="Set the expectation that anyone can step away, take a break, or pause without needing to justify it."
        onSave={() => onSave(isEnabled, draftNotes.trim())}
        isSaving={isSaving}
      />
      <div className="space-y-4 px-4 py-4">
        <CalmToggle
          label="Open Door is active"
          description="Make it explicit that leaving the table briefly or pausing play is always okay."
          checked={isEnabled}
          onChange={setIsEnabled}
        />
        <div className="rounded-[22px] border border-[hsla(32,24%,24%,0.56)] bg-[hsla(22,18%,10%,0.72)] p-4">
          <label className="text-[10px] uppercase tracking-[0.22em] text-[hsl(145,18%,62%)]">Facilitation Notes</label>
          <textarea
            value={draftNotes}
            onChange={(event) => setDraftNotes(event.target.value)}
            rows={6}
            placeholder="e.g. Anyone can step away for a few minutes. If someone asks for a pause, we stop and regroup without spotlighting them."
            className={`${inputClass} mt-2 min-h-[150px] resize-y`}
          />
        </div>
      </div>
    </section>
  );
}

function ListWorkspace({
  title,
  intro,
  emptyLabel,
  placeholder,
  items,
  isSaving,
  onSave,
  privateTone = false,
}: {
  title: string;
  intro: string;
  emptyLabel: string;
  placeholder: string;
  items: string[];
  isSaving: boolean;
  onSave: (items: string[]) => void;
  privateTone?: boolean;
}) {
  const [draftItems, setDraftItems] = useState(items);

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <WorkspaceHeader title={title} intro={intro} onSave={() => onSave(draftItems)} isSaving={isSaving} />
      <div className="px-4 py-4">
        <EditableListCard
          title={title}
          subtitle={emptyLabel}
          items={draftItems}
          onChange={setDraftItems}
          placeholder={placeholder}
          tone={privateTone ? 'private' : 'prompt'}
          hideSectionHeading
        />
      </div>
    </section>
  );
}

function WorkspaceHeader({
  title,
  intro,
  onSave,
  isSaving,
}: {
  title: string;
  intro: string;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[hsla(32,24%,24%,0.42)] px-4 py-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(145,18%,62%)]">Safety Workspace</p>
        <h3 className="mt-1 font-['IM_Fell_English'] text-[30px] leading-none text-[hsl(38,40%,90%)]">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(30,14%,58%)]">{intro}</p>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="rounded-full border border-[hsla(145,42%,58%,0.34)] bg-[hsla(145,42%,58%,0.12)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[hsl(145,48%,78%)] disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save Tool'}
      </button>
    </div>
  );
}

function EditableListCard({
  title,
  subtitle,
  items,
  onChange,
  placeholder,
  tone,
  hideSectionHeading = false,
}: {
  title: string;
  subtitle: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  tone: 'line' | 'veil' | 'prompt' | 'private';
  hideSectionHeading?: boolean;
}) {
  const [entry, setEntry] = useState('');

  const toneClasses = {
    line: 'border-[hsla(0,55%,58%,0.22)] bg-[hsla(0,28%,14%,0.42)]',
    veil: 'border-[hsla(38,42%,58%,0.22)] bg-[hsla(38,26%,14%,0.36)]',
    prompt: 'border-[hsla(145,24%,34%,0.22)] bg-[hsla(145,20%,12%,0.34)]',
    private: 'border-[hsla(214,24%,38%,0.24)] bg-[hsla(214,20%,12%,0.36)]',
  } as const;

  return (
    <div className={`rounded-[22px] border p-4 ${toneClasses[tone]}`}>
      {!hideSectionHeading && (
        <>
          <p className="font-[Cinzel] text-lg text-[hsl(38,34%,86%)]">{title}</p>
          <p className="mt-1 text-sm text-[hsl(30,14%,56%)]">{subtitle}</p>
        </>
      )}

      <div className={`${hideSectionHeading ? '' : 'mt-4'} space-y-3`}>
        <div className="flex gap-2">
          <input
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                const trimmed = entry.trim();
                if (!trimmed) return;
                onChange([...items, trimmed]);
                setEntry('');
              }
            }}
            placeholder={placeholder}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => {
              const trimmed = entry.trim();
              if (!trimmed) return;
              onChange([...items, trimmed]);
              setEntry('');
            }}
            className="shrink-0 rounded-full border border-[hsla(145,42%,58%,0.34)] bg-[hsla(145,42%,58%,0.12)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[hsl(145,48%,78%)]"
          >
            Add
          </button>
        </div>

        {items.length ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-start justify-between gap-3 rounded-[18px] border border-[hsla(32,24%,24%,0.52)] bg-[hsla(22,18%,10%,0.72)] px-3 py-3"
              >
                <p className="text-sm leading-6 text-[hsl(36,22%,82%)]">{item}</p>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
                  className="shrink-0 rounded-full border border-[hsla(32,24%,24%,0.52)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[hsl(30,12%,58%)]"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[hsla(32,24%,24%,0.52)] px-4 py-6 text-sm text-[hsl(30,14%,56%)]">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function CalmToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[22px] border border-[hsla(32,24%,24%,0.56)] bg-[hsla(22,18%,10%,0.72)] p-4">
      <div>
        <p className="font-[Cinzel] text-lg text-[hsl(38,34%,86%)]">{label}</p>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[hsl(30,14%,56%)]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] ${
          checked
            ? 'border-[hsla(145,42%,58%,0.34)] bg-[hsla(145,42%,58%,0.12)] text-[hsl(145,48%,78%)]'
            : 'border-[hsla(32,24%,24%,0.56)] bg-[hsla(22,18%,10%,0.72)] text-[hsl(30,12%,58%)]'
        }`}
      >
        {checked ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        {checked ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );
}
