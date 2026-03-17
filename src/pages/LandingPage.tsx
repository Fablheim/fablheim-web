import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  Check,
  Coins,
  Compass,
  LifeBuoy,
  Map,
  MessageSquare,
  NotebookPen,
  ScrollText,
  Sparkles,
  Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { MarketingFooter, MarketingNavbar, MarketingPage } from '@/components/marketing/MarketingShell';
import { SEO } from '@/components/seo/SEO';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageSchema, softwareApplicationSchema } from '@/seo/schema';
import { BILLING_CONFIG } from '@/config/billingConfig';

const pillars = [
  {
    icon: Compass,
    title: 'Campaign Hall',
    body: 'Run campaigns from one place: world entries, encounters, notes, characters, and session planning.',
  },
  {
    icon: Swords,
    title: 'Session Cockpit',
    body: 'Live session view with initiative, chat, dice, encounters, party info, and optional map support.',
  },
  {
    icon: ScrollText,
    title: 'Prep -> Live -> Recap',
    body: 'Campaign stages follow real GM workflow so continuity survives from one session to the next.',
  },
  {
    icon: Sparkles,
    title: 'Optional AI Assist',
    body: 'Credits-based AI for NPCs, encounters, quests, lore, rules Q&A, and recaps. Fully optional.',
  },
  {
    icon: Coins,
    title: 'Transparent Credits',
    body: 'Costs are visible in-product, with subscription credits and one-time packs tracked in one ledger.',
  },
];

const liveTools = [
  'Initiative tracker with turn flow and conditions',
  'Live chat and dice rolls for everyone at the table',
  'Encounter loading and session notes in-session',
  'Battle map grid + tokens with zoom/pan (functional, not a full VTT suite)',
];

const landingFaq = [
  {
    question: 'Do I need AI to use Fablheim?',
    answer: 'No. Core campaign and session runner workflows work without AI.',
  },
  {
    question: 'Does the free tier include monthly AI credits?',
    answer: 'No. AI credits start with paid plans, and one-time credit packs are available if you only need occasional AI help.',
  },
  {
    question: 'Can I buy credits without a subscription?',
    answer: `Yes. You can buy a one-time pack of ${BILLING_CONFIG.creditPack.credits} credits for ${BILLING_CONFIG.creditPack.price}.`,
  },
  {
    question: 'What systems are supported?',
    answer: 'D&D 5e, Pathfinder 2e, Fate Core, and Daggerheart.',
  },
  {
    question: 'Is the battle map required?',
    answer: 'No. Map tools are optional and only load when you run an encounter with a map.',
  },
];

const demoInitiative = [
  { id: 'pc-1', name: 'Mira Vale', role: 'Wizard', hp: '18 / 24', accent: 'text-sky-200', status: 'Concentrating' },
  { id: 'enemy-1', name: 'Ashwolf Alpha', role: 'Enemy', hp: 'Bloodied', accent: 'text-amber-200', status: 'Marked' },
  { id: 'pc-2', name: 'Brother Kane', role: 'Cleric', hp: '26 / 26', accent: 'text-emerald-200', status: 'Ready' },
  { id: 'enemy-2', name: 'Ridge Scout', role: 'Enemy', hp: 'Unhurt', accent: 'text-orange-200', status: 'Hidden' },
] as const;

const demoPrepPanels = [
  {
    id: 'encounters',
    label: 'Encounter',
    title: 'Bridge Ambush',
    body: '4 enemies loaded, map-ready, initiative notes attached.',
    footer: 'Drag into live play when the party reaches the ravine.',
    icon: Swords,
  },
  {
    id: 'world',
    label: 'World',
    title: 'Blackglass Ford',
    body: 'Faction tension, toll dispute, hidden ash sigils in the stonework.',
    footer: 'Linked to rumors, scout patrols, and next-session consequences.',
    icon: Compass,
  },
  {
    id: 'notes',
    label: 'Notes',
    title: 'Session 12 Notes',
    body: 'Mira still owes the ferryman. Kane suspects the abbey courier is compromised.',
    footer: 'Saved alongside recap hooks for the next prep pass.',
    icon: NotebookPen,
  },
] as const;

function InteractiveProductDemo({ onPrimary }: { onPrimary: () => void }) {
  const [mode, setMode] = useState<'live' | 'prep'>('live');
  const [turnIndex, setTurnIndex] = useState(0);
  const [drawerTab, setDrawerTab] = useState<'chat' | 'events' | 'dice'>('chat');
  const [mapActive, setMapActive] = useState(true);
  const [prepPanel, setPrepPanel] = useState<(typeof demoPrepPanels)[number]['id']>('encounters');

  const activeEntry = demoInitiative[turnIndex];
  const activePrep = demoPrepPanels.find((panel) => panel.id === prepPanel) ?? demoPrepPanels[0];

  function resetDemo() {
    setMode('live');
    setTurnIndex(0);
    setDrawerTab('chat');
    setMapActive(true);
    setPrepPanel('encounters');
  }

  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <header className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Try The Product</p>
            <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Interactive demo, no signup required</h2>
            <p className="mt-4 text-[color:var(--mkt-muted)]">
              Click through a lightweight mock of prep mode and the live session runner. Nothing saves anywhere. It is
              here to show how the workflow feels.
            </p>
          </header>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('prep')}
              className={`mkt-tab rounded-md px-4 py-2 text-sm font-semibold ${mode === 'prep' ? 'mkt-tab-active' : ''}`}
            >
              Prep Demo
            </button>
            <button
              type="button"
              onClick={() => setMode('live')}
              className={`mkt-tab rounded-md px-4 py-2 text-sm font-semibold ${mode === 'live' ? 'mkt-tab-active' : ''}`}
            >
              Session Runner Demo
            </button>
            <Button variant="outline" onClick={resetDemo} className="text-sm">
              Reset Demo
            </Button>
          </div>
        </div>

        <div className="mkt-card mkt-card-mounted mkt-card-elevated iron-brackets overflow-hidden rounded-2xl border-medieval">
          <div className="flex items-center justify-between border-b border-[color:var(--mkt-border)] bg-[linear-gradient(180deg,hsla(30,18%,16%,0.72)_0%,hsla(24,16%,10%,0.84)_100%)] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">
                {mode === 'live' ? 'Session Runner Demo' : 'Campaign Prep Demo'}
              </p>
              <p className="mt-1 text-sm text-[color:var(--mkt-muted)]">
                {mode === 'live'
                  ? 'GM sidebar, center stage, focus card, and bottom drawer.'
                  : 'Linked prep surfaces for encounters, world context, and session notes.'}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full border border-[color:var(--mkt-border)] bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
                Demo State Only
              </span>
            </div>
          </div>

          {mode === 'live' ? (
            <div className="grid gap-3 bg-[linear-gradient(180deg,hsla(28,18%,10%,0.94)_0%,hsla(24,16%,7%,0.98)_100%)] p-3 lg:grid-cols-[0.95fr_1.35fr_0.9fr]">
              <aside className="rounded-xl border border-[color:var(--mkt-border)] bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">GM Sidebar</p>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Round 3</span>
                </div>
                <div className="mt-3 space-y-2">
                  {demoInitiative.map((entry, index) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setTurnIndex(index)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        turnIndex === index
                          ? 'border-[color:var(--mkt-accent)] bg-[color:var(--mkt-accent)]/12'
                          : 'border-[color:var(--mkt-border)] bg-black/20 hover:border-[color:var(--mkt-accent)]/45'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${entry.accent}`}>{entry.name}</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
                          {index === turnIndex ? 'Active' : `${index + 1}`}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[color:var(--mkt-muted)]">
                        <span>{entry.role}</span>
                        <span>{entry.hp}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={() => setTurnIndex((prev) => (prev + 1) % demoInitiative.length)}>
                    Next Turn
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setMapActive((prev) => !prev)}>
                    {mapActive ? 'Hide Map' : 'Show Map'}
                  </Button>
                </div>
              </aside>

              <div className="rounded-xl border border-[color:var(--mkt-border)] bg-black/15 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Center Stage</p>
                    <p className="mt-1 text-sm text-[color:var(--mkt-muted)]">
                      {mapActive ? 'Tactical map active for the bridge encounter.' : 'Main session view with notes and encounter context.'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--mkt-border)] bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
                    {mapActive ? <Map className="h-3.5 w-3.5" /> : <NotebookPen className="h-3.5 w-3.5" />}
                    {mapActive ? 'Map Mode' : 'Story Mode'}
                  </div>
                </div>
                {mapActive ? (
                  <div className="rounded-xl border border-[color:var(--mkt-border)] bg-[linear-gradient(180deg,hsla(174,18%,18%,0.92)_0%,hsla(168,12%,11%,0.98)_100%)] p-4">
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 18 }).map((_, index) => {
                        const token =
                          index === 3 ? 'MV' :
                          index === 8 ? 'AA' :
                          index === 10 ? 'BK' :
                          index === 15 ? 'RS' :
                          '';
                        return (
                          <div
                            key={index}
                            className="flex aspect-square items-center justify-center rounded border border-white/10 bg-black/10 text-[10px] font-semibold text-white/85"
                          >
                            {token}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-[color:var(--mkt-muted)]">
                      Functional map support: background, grid, tokens, and turn-by-turn play without pretending to be a full VTT.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-[color:var(--mkt-border)] bg-black/25 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Encounter Notes</p>
                      <p className="mt-2 text-sm text-[color:var(--mkt-text)]">
                        Wolves break from the ashbrush after the first failed toll negotiation.
                      </p>
                    </div>
                    <div className="rounded-xl border border-[color:var(--mkt-border)] bg-black/25 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Session Notes</p>
                      <p className="mt-2 text-sm text-[color:var(--mkt-text)]">
                        Kane wants the courier questioned before the caravan crosses the bridge.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <aside className="rounded-xl border border-[color:var(--mkt-border)] bg-black/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Focus Card</p>
                <div className="mt-3 rounded-xl border border-[color:var(--mkt-border)] bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-[Cinzel] text-xl ${activeEntry.accent}`}>{activeEntry.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">{activeEntry.role}</p>
                    </div>
                    <span className="rounded-full border border-[color:var(--mkt-border)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">
                      {activeEntry.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-[color:var(--mkt-muted)]">
                    <div className="flex items-center justify-between rounded border border-[color:var(--mkt-border)] bg-black/15 px-3 py-2">
                      <span>HP</span>
                      <span className="text-[color:var(--mkt-text)]">{activeEntry.hp}</span>
                    </div>
                    <div className="flex items-center justify-between rounded border border-[color:var(--mkt-border)] bg-black/15 px-3 py-2">
                      <span>Suggested action</span>
                      <span className="text-[color:var(--mkt-text)]">
                        {activeEntry.role === 'Enemy' ? 'Pressure the backline' : 'Hold the bridge'}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="lg:col-span-3 rounded-xl border border-[color:var(--mkt-border)] bg-black/15 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    ['chat', 'Chat', MessageSquare],
                    ['events', 'Events', ScrollText],
                    ['dice', 'Dice', Swords],
                  ] as const).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDrawerTab(id)}
                      className={`mkt-tab inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${drawerTab === id ? 'mkt-tab-active' : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-[color:var(--mkt-border)] bg-black/20 p-4 text-sm text-[color:var(--mkt-muted)]">
                  {drawerTab === 'chat' && (
                    <div className="space-y-2">
                      <p><span className="text-[color:var(--mkt-text)]">Mira:</span> I hold the bridge and cast Frostbite.</p>
                      <p><span className="text-[color:var(--mkt-text)]">Kane:</span> Save the ferryman. We need him talking.</p>
                    </div>
                  )}
                  {drawerTab === 'events' && (
                    <div className="space-y-2">
                      <p>Round 3 started.</p>
                      <p>Ashwolf Alpha moved into melee range.</p>
                      <p>Bridge lantern shattered, visibility reduced.</p>
                    </div>
                  )}
                  {drawerTab === 'dice' && (
                    <div className="space-y-2">
                      <p>d20 + 5 = 19</p>
                      <p>2d6 cold damage = 8</p>
                      <p>Initiative stays synced for everyone at the table.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 bg-[linear-gradient(180deg,hsla(28,18%,10%,0.94)_0%,hsla(24,16%,7%,0.98)_100%)] p-3 lg:grid-cols-[0.78fr_1.22fr]">
              <aside className="rounded-xl border border-[color:var(--mkt-border)] bg-black/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Prep Surfaces</p>
                <div className="mt-3 space-y-2">
                  {demoPrepPanels.map((panel) => {
                    const Icon = panel.icon;
                    return (
                      <button
                        key={panel.id}
                        type="button"
                        onClick={() => setPrepPanel(panel.id)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                          prepPanel === panel.id
                            ? 'border-[color:var(--mkt-accent)] bg-[color:var(--mkt-accent)]/12'
                            : 'border-[color:var(--mkt-border)] bg-black/20 hover:border-[color:var(--mkt-accent)]/45'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[color:var(--mkt-accent)]" />
                          <span className="text-sm font-semibold text-[color:var(--mkt-text)]">{panel.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-[color:var(--mkt-muted)]">{panel.title}</p>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="rounded-xl border border-[color:var(--mkt-border)] bg-black/15 p-3">
                <div className="rounded-xl border border-[color:var(--mkt-border)] bg-black/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">{activePrep.label}</p>
                  <h3 className="mt-2 font-[Cinzel] text-2xl text-[color:var(--mkt-text)]">{activePrep.title}</h3>
                  <p className="mt-3 text-sm text-[color:var(--mkt-text)]">{activePrep.body}</p>
                  <p className="mt-4 rounded-lg border border-[color:var(--mkt-border)] bg-black/15 px-3 py-3 text-sm text-[color:var(--mkt-muted)]">
                    {activePrep.footer}
                  </p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[color:var(--mkt-border)] bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Linked world</p>
                    <p className="mt-2 text-sm text-[color:var(--mkt-text)]">Blackglass Ford</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--mkt-border)] bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Encounter status</p>
                    <p className="mt-2 text-sm text-[color:var(--mkt-text)]">Map-ready</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--mkt-border)] bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Recap carryover</p>
                    <p className="mt-2 text-sm text-[color:var(--mkt-text)]">2 unresolved hooks</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[color:var(--mkt-border)] bg-[linear-gradient(180deg,hsla(30,18%,14%,0.7)_0%,hsla(24,16%,10%,0.84)_100%)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[color:var(--mkt-muted)]">
              Like the workflow? Run your next campaign in the real app.
            </p>
            <Button onClick={onPrimary} className="shimmer-gold">
              Start With Fablheim
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hero({
  loggedIn,
  onPrimary,
  onHowItWorks,
}: {
  loggedIn: boolean;
  onPrimary: () => void;
  onHowItWorks: () => void;
}) {
  return (
    <section className="mkt-section mkt-hero-stage relative overflow-hidden px-4 pb-18 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsla(35,95%,60%,0.17)_0%,transparent_67%)]" />
        <div className="absolute right-0 top-14 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,hsla(14,84%,46%,0.14)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="lg:pr-8">
          <p className="mkt-chip mb-4 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <Compass className="h-3.5 w-3.5" />
            Campaign Command Hall
          </p>

          <h1 className="font-['IM_Fell_English'] text-4xl leading-[1.04] text-[color:var(--mkt-text)] sm:text-5xl lg:text-6xl">
            Run Your Campaign
            <span className="gold-forged block">In One Place</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--mkt-muted)] sm:text-lg">
            Fablheim gives tabletop GMs one command hall for prep, live sessions, and recaps, with optional AI tools
            when they actually save time.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={onPrimary} className="shimmer-gold text-base">
              {loggedIn ? 'Open Dashboard' : 'Join Beta'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onHowItWorks} className="text-base">
              See How It Works
              <ScrollText className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-[color:var(--mkt-muted)] sm:grid-cols-3">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> Players can join free</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> Prep -&gt; Live -&gt; Recap stages</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-success)]" /> No AI required to run sessions</span>
          </div>
        </div>

        <aside className="grid gap-4 rounded-2xl border border-[color:var(--mkt-border)]/60 bg-[linear-gradient(180deg,hsla(32,28%,16%,0.24)_0%,hsla(24,14%,8%,0.45)_100%)] p-3 shadow-[inset_0_1px_0_hsla(38,36%,70%,0.1),0_16px_34px_hsla(24,34%,4%,0.44)] lg:max-w-[30rem] lg:justify-self-end">
          <article className="mkt-card mkt-card-mounted mkt-card-elevated iron-brackets texture-parchment rounded-xl p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Typical GM flow</p>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--mkt-muted)]">
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Prep encounters, world context, session notes</li>
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> Run live with chat, dice, initiative, and map</li>
              <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--mkt-accent)]" /> End session into recap and follow-up hooks</li>
            </ul>
          </article>

          <article className="mkt-card mkt-card-mounted rounded-xl bg-[linear-gradient(160deg,hsla(38,84%,56%,0.16)_0%,hsla(18,74%,43%,0.13)_48%,hsla(24,14%,9%,0.9)_100%)] p-5 sm:p-6 lg:ml-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--mkt-muted)]">Design stance</p>
            <p className="mt-2 text-[color:var(--mkt-text)]">Practical GM operations, not AI theater.</p>
          </article>
        </aside>
      </div>
    </section>
  );
}

function ProblemFraming() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-18 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-10 max-w-4xl" />
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Why this helps</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Stop juggling chat, docs, initiative trackers, and map tabs
          </h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            Most campaigns break flow because prep, live tools, and recaps live in different places. Fablheim keeps
            them connected so your table can stay focused on decisions and story.
          </p>
        </header>

        <article className="mkt-card mkt-card-mounted iron-brackets mt-8 overflow-hidden rounded-xl">
          <div className="grid items-stretch md:grid-cols-2">
            <section className="flex h-full min-w-0 flex-col p-6 sm:p-7">
              <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">WITHOUT A COMMAND HALL</h3>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="min-w-0 leading-relaxed">Momentum breaks during tool switches</span>
                </li>
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="min-w-0 leading-relaxed">Prep notes and live controls drift apart</span>
                </li>
                <li className="grid grid-cols-[0.65rem_1fr] items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full border border-red-300/40 bg-red-400/70 shadow-[0_0_0_1px_hsla(0,0%,0%,0.35)]" />
                  <span className="min-w-0 leading-relaxed">Recaps and next hooks are harder to keep consistent</span>
                </li>
              </ul>
            </section>

            <section className="flex h-full min-w-0 flex-col border-t border-[color:var(--mkt-border)] p-6 sm:p-7 md:border-l md:border-t-0">
              <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">WITH FABLHEIM</h3>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--mkt-muted)]">
                {[
                  'Campaign entities, encounters, and notebook stay in one hall',
                  'Session Cockpit keeps live tools side-by-side',
                  'Prep -> Live -> Recap preserves continuity',
                ].map((text) => (
                  <li key={text} className="grid grid-cols-[0.9rem_1fr] items-start gap-3">
                    <Check className="mt-1 h-4 w-4 text-[color:var(--mkt-success)]" aria-hidden="true" />
                    <span className="min-w-0 leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Core pillars</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Truth-based capabilities, live today</h2>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={`mkt-card rounded-xl p-5 ${index === 0 || index === 3 ? 'mkt-card-mounted' : ''}`}
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/25">
                  <Icon className="h-5 w-5 text-[color:var(--mkt-accent)]" />
                </div>
                <h3 className="mt-4 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">{item.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SessionCockpitSection() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">Live session runner</p>
          <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Guided Session Cockpit</h2>
          <p className="mt-4 text-[color:var(--mkt-muted)]">
            When the session goes live, Fablheim shifts into a dedicated cockpit so the GM can keep pace and players can
            stay synced without bouncing between tools.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-[color:var(--mkt-muted)]">
            {liveTools.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--mkt-success)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-[color:var(--mkt-muted)]">
            In-person and hybrid friendly: GM runs from one device, players join and use their own character views.
          </p>
        </div>

        <article className="mkt-card mkt-card-mounted iron-brackets rounded-xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--mkt-muted)]">Cockpit snapshot</p>
          <div className="mt-4 rounded-xl border border-[color:var(--mkt-border)]/70 bg-black/15 p-3">
            <div className="grid grid-cols-[1.1fr_1.6fr_1fr] gap-2">
              <div className="rounded border border-[color:var(--mkt-border)] bg-black/25 px-3 py-3 text-xs text-[color:var(--mkt-muted)]">
                GM Sidebar
                <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-[color:var(--mkt-muted)]/80">
                  initiative • party • notes
                </span>
              </div>
              <div className="rounded border border-[color:var(--mkt-border)] bg-black/25 px-3 py-3 text-xs text-[color:var(--mkt-muted)]">
                Center Stage
                <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-[color:var(--mkt-muted)]/80">
                  map when active • main session view otherwise
                </span>
              </div>
              <div className="rounded border border-[color:var(--mkt-border)] bg-black/25 px-3 py-3 text-xs text-[color:var(--mkt-muted)]">
                Focus Card
                <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-[color:var(--mkt-muted)]/80">
                  selected combatant
                </span>
              </div>
            </div>
            <div className="mt-2 rounded border border-[color:var(--mkt-border)] bg-black/25 px-3 py-3 text-xs text-[color:var(--mkt-muted)]">
              Bottom Drawer
              <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-[color:var(--mkt-muted)]/80">
                chat • events • dice
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-[color:var(--mkt-muted)]">
            Tactical maps are intentionally simple: background, grid settings, tokens, and turn-by-turn play layered
            into the same live shell.
          </p>
        </article>
      </div>
    </section>
  );
}

function RulesPricingAndAi({ onRules, onPricing }: { onRules: () => void; onPricing: () => void }) {
  return (
    <section className="mkt-section px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <BookOpenText className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Rules Library</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Public SRD lookup across D&D 5e, Pathfinder 2e, Fate, and Daggerheart.</p>
            <Button variant="outline" onClick={onRules} className="mt-4">Open Rules Library</Button>
          </article>

          <article className="mkt-card rounded-lg p-5">
            <Coins className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Pricing reality</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">Free tier runs the core app without monthly AI credits. Paid tiers add monthly AI credits.</p>
            <p className="mt-2 text-xs text-[color:var(--mkt-muted)]">Hobbyist {BILLING_CONFIG.tiers.hobbyist.monthlyCredits}, Game Master {BILLING_CONFIG.tiers.gamemaster.monthlyCredits}, Pro {BILLING_CONFIG.tiers.pro.monthlyCredits} credits / month.</p>
            <p className="mt-2 text-xs text-[color:var(--mkt-muted)]">{BILLING_CONFIG.creditPack.price} pack: {BILLING_CONFIG.creditPack.credits} base credits. Subscriber bonuses: {BILLING_CONFIG.creditPack.bonusCreditsByTier.hobbyist}/{BILLING_CONFIG.creditPack.bonusCreditsByTier.gamemaster}/{BILLING_CONFIG.creditPack.bonusCreditsByTier.pro}.</p>
          </article>

          <article className="mkt-card mkt-card-mounted rounded-lg p-5">
            <LifeBuoy className="h-5 w-5 text-[color:var(--mkt-accent)]" />
            <p className="mt-3 font-[Cinzel] text-xl text-[color:var(--mkt-text)]">No AI required</p>
            <p className="text-sm text-[color:var(--mkt-muted)]">You can plan and run full sessions without spending credits. AI is an optional assist lane.</p>
            <Button variant="outline" onClick={onPricing} className="mt-4">See pricing details</Button>
          </article>
        </div>
      </div>
    </section>
  );
}

function LandingFaq() {
  return (
    <section className="mkt-section mkt-section-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mkt-muted)]">FAQ</p>
        <h2 className="mt-2 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">Common Questions</h2>
        <article className="mkt-card mkt-card-mounted mt-4 rounded-xl p-5">
          <h3 className="font-[Cinzel] text-xl text-[color:var(--mkt-text)]">Pack FAQ</h3>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--mkt-muted)]">
            <li>Packs are base credits + subscriber bonus.</li>
            <li>Bonus applies only if your subscription is active.</li>
          </ul>
        </article>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {landingFaq.map((item) => (
            <article key={item.question} className="mkt-card rounded-xl p-5">
              <h3 className="font-semibold text-[color:var(--mkt-text)]">{item.question}</h3>
              <p className="mt-2 text-sm text-[color:var(--mkt-muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta({
  loggedIn,
  onPrimary,
  onHowItWorks,
}: {
  loggedIn: boolean;
  onPrimary: () => void;
  onHowItWorks: () => void;
}) {
  return (
    <section className="mkt-section relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="rune-divider mx-auto mb-12 max-w-4xl opacity-80" />
      <div className="mx-auto max-w-5xl">
        <div className="mkt-card mkt-card-mounted mkt-card-elevated mkt-ceremony iron-brackets texture-leather rounded-2xl border-medieval p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--mkt-muted)]">Ready for tonight</p>
          <h2 className="mt-3 font-[Cinzel] text-3xl text-[color:var(--mkt-text)] sm:text-4xl">
            Build the hall. Run the session. Keep the story moving.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[color:var(--mkt-muted)]">
            Practical campaign management for real tables, with optional AI when you need fast backup.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={onPrimary} className="shimmer-gold text-base">
              {loggedIn ? 'Continue to Dashboard' : 'Join Beta'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onHowItWorks} className="text-base">
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loggedIn = !!user;

  function handlePrimary() {
    navigate(loggedIn ? '/app' : '/register');
  }

  return (
    <MarketingPage>
      <SEO
        title="Fablheim | TTRPG Campaign Manager and Session Runner"
        description="Fablheim helps tabletop GMs prep sessions, run them live, and carry the story forward with one campaign command hall and optional AI support."
        canonicalPath="/"
      />
      <JsonLd
        data={softwareApplicationSchema({
          name: 'Fablheim',
          path: '/',
          description:
            'Campaign management and live session runner for tabletop RPGs with prep, live, and recap continuity.',
        })}
      />
      <JsonLd data={faqPageSchema('/', landingFaq)} />

      <MarketingNavbar
        user={user}
        links={[
          { label: 'How It Works', to: '/how-it-works' },
          { label: 'Pricing', to: '/pricing' },
          { label: 'New to TTRPGs?', to: '/new-to-ttrpgs' },
          { label: 'Rules Library', to: '/srd' },
        ]}
      />

      <Hero loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />
      <InteractiveProductDemo onPrimary={handlePrimary} />
      <ProblemFraming />
      <Pillars />
      <SessionCockpitSection />
      <RulesPricingAndAi onRules={() => navigate('/srd')} onPricing={() => navigate('/pricing')} />
      <LandingFaq />
      <ClosingCta loggedIn={loggedIn} onPrimary={handlePrimary} onHowItWorks={() => navigate('/how-it-works')} />

      <MarketingFooter />
    </MarketingPage>
  );
}
