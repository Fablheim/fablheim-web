import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  Swords,
  Target,
  BookOpen,
  Heart,
  ScrollText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useSRDSystems } from '@/hooks/useSRD';
import type { SRDSystemMeta } from '@/api/srd';

const SYSTEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dnd5e: Swords,
  pathfinder2e: Target,
  fate: BookOpen,
  daggerheart: Heart,
};

const SYSTEM_TAGLINES: Record<string, string> = {
  dnd5e: 'The world\'s most popular tabletop RPG. Fantasy adventure with swords, sorcery, and dungeon crawling.',
  pathfinder2e: 'Paizo\'s deeply tactical fantasy RPG. More character options and crunchier combat.',
  fate: 'A narrative-first system where fiction drives the mechanics. Play any genre.',
  daggerheart: 'Critical Role\'s cinematic fantasy RPG with a hope/fear tension mechanic.',
};

function renderNav(navigate: ReturnType<typeof useNavigate>, user: unknown) {
  return (
    <nav className="texture-wood sticky top-0 z-50 border-b border-gold bg-[hsl(24,18%,6%)]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-9 w-9 rounded-md shadow-glow-sm animate-candle" />
            <span className="font-['Cinzel_Decorative'] text-glow-gold text-xl font-bold text-[hsl(35,25%,92%)]">
              Fablheim
            </span>
          </button>
          {renderNavButtons(navigate, user)}
        </div>
      </div>
    </nav>
  );
}

function renderNavButtons(navigate: ReturnType<typeof useNavigate>, user: unknown) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Home
      </Button>
      <Button variant="ghost" onClick={() => navigate('/new-to-ttrpgs')}>
        New to TTRPGs?
      </Button>
      {user ? (
        <Button onClick={() => navigate('/app')}>
          Dashboard
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      ) : (
        <>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/register')}>Enter the Realm</Button>
        </>
      )}
    </div>
  );
}

function renderHero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-rose-700/8" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="font-['IM_Fell_English'] mb-4 text-4xl font-bold text-[hsl(35,25%,92%)] sm:text-5xl lg:text-6xl">
          System Reference Documents
        </h1>
        <div className="divider-ornate mx-auto mb-6 max-w-md" />
        <p className="mx-auto max-w-2xl text-lg text-[hsl(30,12%,55%)] sm:text-xl">
          Browse the free rulesets for every system Fablheim supports.
          Read classes, spells, monsters, and more — right here.
        </p>
      </div>
    </section>
  );
}

function renderSystemCard(
  system: SRDSystemMeta,
  navigate: ReturnType<typeof useNavigate>,
  index: number,
) {
  const Icon = SYSTEM_ICONS[system.id] || ScrollText;
  const tagline = SYSTEM_TAGLINES[system.id] || '';

  return (
    <button
      key={system.id}
      onClick={() => navigate(`/srd/${system.id}`)}
      className="animate-unfurl iron-brackets texture-parchment flex h-full rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] p-6 text-left transition-all hover:border-amber-500/30 hover:shadow-glow"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex flex-1 gap-4">
        <div className="shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold-strong bg-amber-600/20 shadow-glow-sm">
            <Icon className="h-6 w-6 text-amber-500" />
          </div>
        </div>
        {renderSystemCardBody(system, tagline)}
      </div>
    </button>
  );
}

function renderSystemCardBody(system: SRDSystemMeta, tagline: string) {
  return (
    <div className="flex-1">
      <h3 className="mb-1 font-[Cinzel] text-xl font-semibold text-[hsl(35,25%,92%)]">
        {system.name}
      </h3>
      <p className="mb-3 min-h-[2.5rem] text-sm text-[hsl(35,20%,75%)]">{tagline}</p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-[hsl(24,14%,25%)] bg-[hsl(24,14%,10%)] px-3 py-1 text-xs text-[hsl(30,12%,55%)]">
          {system.totalEntries} entries
        </span>
        <span className="rounded-full border border-[hsl(24,14%,25%)] bg-[hsl(24,14%,10%)] px-3 py-1 text-xs text-[hsl(30,12%,55%)]">
          {system.categories.length} categories
        </span>
      </div>
    </div>
  );
}

function renderLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
    </div>
  );
}

function renderFooter() {
  return (
    <footer className="texture-wood relative border-t border-[hsl(24,14%,15%)] py-12">
      <div className="divider-ornate absolute top-0 right-0 left-0" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-8 w-8 rounded-md shadow-glow-sm" />
            <span className="font-['Cinzel_Decorative'] text-glow-gold font-semibold text-[hsl(35,25%,92%)]">
              Fablheim
            </span>
          </div>
          <p className="text-sm text-[hsl(30,12%,55%)]">
            &copy; 2026 Fablheim. Forged for Game Masters, by Game Masters.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function SRDIndexPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useSRDSystems();

  const systems = data?.systems ?? [];

  return (
    <div className="vignette grain-overlay min-h-screen bg-[hsl(24,18%,6%)]">
      {renderNav(navigate, user)}
      {renderHero()}
      <div className="divider-ornate mx-auto max-w-3xl" />

      <section className="relative py-16">
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            renderLoading()
          ) : error ? (
            <div className="py-16 text-center">
              <p className="font-[Cinzel] text-lg text-[hsl(35,25%,92%)]">
                Failed to load systems
              </p>
              <p className="mt-2 text-sm text-[hsl(30,12%,55%)]">
                The SRD server may still be starting up. Try refreshing in a moment.
              </p>
            </div>
          ) : systems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-[Cinzel] text-lg text-[hsl(35,25%,92%)]">
                No systems available yet
              </p>
              <p className="mt-2 text-sm text-[hsl(30,12%,55%)]">
                SRD content is still being indexed. Try refreshing in a moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {systems.map((system, i) => renderSystemCard(system, navigate, i))}
            </div>
          )}
        </div>
      </section>

      <div className="divider-ornate mx-auto max-w-3xl" />
      {renderFooter()}
    </div>
  );
}
