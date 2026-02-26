import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  ScrollText,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useSRDSearch } from '@/hooks/useSRD';
import { quickStartConfigs } from './quickStartConfigs';
import type { QuickStartSection, QuickStartLink } from './quickStartConfigs';

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
      <Button variant="ghost" onClick={() => navigate('/srd')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        All Systems
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

function renderHero(
  displayName: string,
  tagline: string,
  system: string,
  navigate: ReturnType<typeof useNavigate>,
) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-rose-700/8" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="font-['IM_Fell_English'] mb-3 text-3xl font-bold text-[hsl(35,25%,92%)] sm:text-4xl lg:text-5xl">
          {displayName}
        </h1>
        <div className="divider-ornate mx-auto mb-4 max-w-md" />
        <p className="mx-auto mb-8 max-w-2xl text-lg text-[hsl(30,12%,55%)]">
          {tagline}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(`/srd/${system}/browse`)}
        >
          Browse Full SRD
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function renderSearchBar(
  searchQuery: string,
  setSearchQuery: (q: string) => void,
) {
  return (
    <div className="relative mb-8">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,12%,45%)]" />
      <input
        type="text"
        placeholder="Search rules, spells, classes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input-carved w-full rounded-md border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,10%)] py-2.5 pl-10 pr-4 text-sm text-[hsl(35,25%,92%)] placeholder-[hsl(30,12%,40%)] transition-colors focus:border-amber-500/40 focus:outline-none"
      />
    </div>
  );
}

function renderSearchResults(
  system: string,
  searchData: { results: { title: string; category: string; snippet: string }[] } | undefined,
  isSearching: boolean,
  navigate: ReturnType<typeof useNavigate>,
) {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!searchData || searchData.results.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[hsl(30,12%,45%)]">
        No results found.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {searchData.results.map((result, i) => (
        <button
          key={`${result.category}-${result.title}-${i}`}
          onClick={() => navigate(`/srd/${system}/${encodeURIComponent(result.category)}/${encodeURIComponent(result.title)}`)}
          className="w-full rounded-md border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,10%)] p-3 text-left transition-all hover:border-amber-500/30"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="font-[Cinzel] text-sm font-semibold text-[hsl(35,25%,92%)]">
              {result.title}
            </span>
            <span className="text-xs text-[hsl(30,12%,45%)]">
              in {result.category}
            </span>
          </div>
          <p className="text-xs text-[hsl(30,12%,55%)] line-clamp-2">
            {result.snippet}
          </p>
        </button>
      ))}
    </div>
  );
}

function buildLinkUrl(system: string, link: QuickStartLink): string {
  if (link.type === 'category') {
    return `/srd/${system}/browse/${encodeURIComponent(link.category)}`;
  }
  return `/srd/${system}/${encodeURIComponent(link.category)}/${encodeURIComponent(link.entry!)}`;
}

function renderSectionLinks(
  system: string,
  links: QuickStartLink[],
  navigate: ReturnType<typeof useNavigate>,
) {
  return (
    <ul className="space-y-1">
      {links.map((link) => (
        <li key={link.label}>
          <button
            onClick={() => navigate(buildLinkUrl(system, link))}
            className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-amber-500/5"
          >
            {link.type === 'category' ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-amber-500/60 transition-colors group-hover:text-amber-500" />
            ) : (
              <ScrollText className="h-4 w-4 shrink-0 text-[hsl(30,12%,35%)] transition-colors group-hover:text-amber-500/60" />
            )}
            <span className="flex-1 text-sm text-[hsl(35,20%,75%)] transition-colors group-hover:text-[hsl(35,25%,92%)]">
              {link.label}
            </span>
            {link.badge && (
              <span className="rounded-full border border-[hsl(24,14%,25%)] bg-[hsl(24,14%,10%)] px-2 py-0.5 text-[10px] text-[hsl(30,12%,50%)]">
                {link.badge}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[hsl(30,12%,30%)] transition-colors group-hover:text-[hsl(30,12%,55%)]" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function renderSection(
  section: QuickStartSection,
  system: string,
  navigate: ReturnType<typeof useNavigate>,
  index: number,
) {
  const Icon = section.icon;
  return (
    <div
      key={section.title}
      className="animate-unfurl iron-brackets texture-parchment rounded-lg border border-[hsl(24,14%,20%)] bg-[hsl(24,14%,13%)] p-6 transition-all hover:border-amber-500/30 sm:p-8"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold-strong bg-amber-600/20 shadow-glow-sm">
          <Icon className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="font-[Cinzel] text-lg font-semibold text-[hsl(35,25%,92%)]">
            {section.title}
          </h2>
          <p className="text-sm text-[hsl(30,12%,55%)]">
            {section.description}
          </p>
        </div>
      </div>
      {renderSectionLinks(system, section.links, navigate)}
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

export default function SRDQuickStartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { system = '' } = useParams<{ system: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchData, isFetching: isSearching } = useSRDSearch(
    system,
    searchQuery,
  );

  const config = quickStartConfigs[system];
  const isSearchActive = searchQuery.length >= 2;

  if (!config) {
    return (
      <div className="vignette grain-overlay min-h-screen bg-[hsl(24,18%,6%)]">
        {renderNav(navigate, user)}
        <div className="flex items-center justify-center py-32">
          <p className="text-[hsl(30,12%,55%)]">System not found.</p>
        </div>
        {renderFooter()}
      </div>
    );
  }

  return (
    <div className="vignette grain-overlay min-h-screen bg-[hsl(24,18%,6%)]">
      {renderNav(navigate, user)}
      {renderHero(config.displayName, config.tagline, system, navigate)}

      <div className="divider-ornate mx-auto max-w-3xl" />

      <section className="relative py-12">
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {renderSearchBar(searchQuery, setSearchQuery)}

          {isSearchActive ? (
            renderSearchResults(system, searchData, isSearching, navigate)
          ) : (
            <div className="space-y-6">
              {config.sections.map((section, i) =>
                renderSection(section, system, navigate, i),
              )}
            </div>
          )}
        </div>
      </section>

      <div className="divider-ornate mx-auto max-w-3xl" />
      {renderFooter()}
    </div>
  );
}
