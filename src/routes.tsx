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
import { FeedbackPage } from './pages/FeedbackPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFeedbackPage } from './pages/admin/AdminFeedbackPage';
import { AdminFeedbackDetailPage } from './pages/admin/AdminFeedbackDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminBillingPage } from './pages/admin/AdminBillingPage';
import { AdminReconcilePage } from './pages/admin/AdminReconcilePage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';
import { AdminSessionDetailPage } from './pages/admin/AdminSessionDetailPage';

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
  if (path === '/app/feedback') return <FeedbackPage />;
  if (path === '/app/admin') return <AdminDashboardPage />;
  if (path === '/app/admin/feedback') return <AdminFeedbackPage />;
  if (path.startsWith('/app/admin/feedback/')) {
    const feedbackId = path.split('/')[4];
    return <AdminFeedbackDetailPage feedbackId={feedbackId} />;
  }
  if (path === '/app/admin/users') return <AdminUsersPage />;
  if (path.startsWith('/app/admin/billing/reconcile/')) {
    const reconcileUserId = path.split('/')[5];
    return <AdminReconcilePage userId={reconcileUserId} />;
  }
  if (path === '/app/admin/billing') return <AdminBillingPage />;
  if (path.startsWith('/app/admin/sessions/')) {
    const sessionId = path.split('/')[4];
    return <AdminSessionDetailPage sessionId={sessionId} />;
  }
  if (path === '/app/admin/sessions') return <AdminSessionsPage />;
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
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
      <Route path="/admin/feedback/:id" element={<AdminFeedbackDetailPage feedbackId="" />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/billing" element={<AdminBillingPage />} />
      <Route path="/admin/billing/reconcile/:userId" element={<AdminReconcilePage userId="" />} />
      <Route path="/admin/sessions" element={<AdminSessionsPage />} />
      <Route path="/admin/sessions/:sessionId" element={<AdminSessionDetailPage sessionId="" />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </>
  );
}
