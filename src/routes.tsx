import type { ReactNode } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { LiveSessionPage } from './pages/LiveSessionPage';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CharactersPage } from './pages/CharactersPage';
import { WorldPage } from './pages/WorldPage';
import { AIToolsPage } from './pages/AIToolsPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { NotebookPage } from './pages/NotebookPage';
import { CreditsPage } from './pages/CreditsPage';
import { SessionRunnerPage } from './pages/SessionRunnerPage';
import { CharacterCreationWizardPage } from './pages/CharacterCreationWizardPage';
import { EncounterPrepPage } from './pages/EncounterPrepPage';
import { EnemyLibraryPage } from './pages/EnemyLibraryPage';

function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

export function resolveRouteContent(path: string, title: string): ReactNode {
  if (path === '/app') return <DashboardPage />;
  if (path === '/app/campaigns') return <CampaignsPage />;
  if (path.startsWith('/app/campaigns/') && path.endsWith('/live')) {
    const campaignId = path.split('/')[3];
    return <LiveSessionPage campaignId={campaignId} />;
  }
  if (path.startsWith('/app/campaigns/') && path.endsWith('/characters/create')) {
    const campaignId = path.split('/')[3];
    return <CharacterCreationWizardPage campaignId={campaignId} />;
  }
  if (path.startsWith('/app/campaigns/') && path.endsWith('/encounters')) {
    const campaignId = path.split('/')[3];
    return <EncounterPrepPage campaignId={campaignId} />;
  }
  if (path.startsWith('/app/campaigns/') && path.endsWith('/ai-tools')) {
    const campaignId = path.split('/')[3];
    return <AIToolsPage campaignId={campaignId} />;
  }
  if (path.startsWith('/app/campaigns/') && path.includes('/session/') && path.endsWith('/play')) {
    const parts = path.split('/');
    const campaignId = parts[3];
    const sessionId = parts[5];
    return <SessionRunnerPage campaignId={campaignId} sessionId={sessionId} />;
  }
  if (path.startsWith('/app/campaigns/')) {
    const campaignId = path.split('/')[3];
    return <CampaignDetailPage campaignId={campaignId} />;
  }
  if (path === '/app/sessions') return <SessionsPage />;
  if (path.startsWith('/app/characters/')) {
    const characterId = path.split('/')[3];
    return <CharacterDetailPage characterId={characterId} />;
  }
  if (path === '/app/characters') return <CharactersPage />;
  if (path === '/app/world') return <WorldPage />;
  if (path === '/app/notebook') return <NotebookPage />;
  if (path === '/app/tools') return <AIToolsPage />;
  if (path === '/app/enemies') return <EnemyLibraryPage />;
  if (path === '/app/credits') return <CreditsPage />;
  if (path === '/app/settings') return <SettingsPage />;
  return <PagePlaceholder title={title} />;
}

export function AppRoutes() {
  return (
    <>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/campaigns" element={<CampaignsPage />} />
      <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
      <Route path="/campaigns/:campaignId/characters/create" element={<CharacterCreationWizardPage />} />
      <Route path="/sessions" element={<SessionsPage />} />
      <Route path="/characters" element={<CharactersPage />} />
      <Route path="/characters/:id" element={<CharacterDetailPage />} />
      <Route path="/world" element={<WorldPage />} />
      <Route path="/notebook" element={<NotebookPage />} />
      <Route path="/tools" element={<AIToolsPage />} />
      <Route path="/credits" element={<CreditsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </>
  );
}
