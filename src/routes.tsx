import { Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CharactersPage } from './pages/CharactersPage';
import { WorldPage } from './pages/WorldPage';
import { AIToolsPage } from './pages/AIToolsPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { NotebookPage } from './pages/NotebookPage';
import { CreditsPage } from './pages/CreditsPage';
import { CharacterCreationWizardPage } from './pages/CharacterCreationWizardPage';
import { EncounterPrepPage } from './pages/EncounterPrepPage';
import { EnemyLibraryPage } from './pages/EnemyLibraryPage';
import { EnemyDetailPage } from './pages/EnemyDetailPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFeedbackPage } from './pages/admin/AdminFeedbackPage';
import { AdminFeedbackDetailPage } from './pages/admin/AdminFeedbackDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminBillingPage } from './pages/admin/AdminBillingPage';
import { AdminReconcilePage } from './pages/admin/AdminReconcilePage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';
import { AdminSessionDetailPage } from './pages/admin/AdminSessionDetailPage';
import { ClaudeAnalyticsPage } from './pages/admin/ClaudeAnalyticsPage';
import SRDIndexPage from './pages/srd/SRDIndexPage';
import SRDQuickStartPage from './pages/srd/SRDQuickStartPage';
import SRDSystemPage from './pages/srd/SRDSystemPage';
import SRDEntryPage from './pages/srd/SRDEntryPage';
import SessionRunnerShellV2 from './components/session/SessionRunnerShellV2';

export function AppRoutes() {
  return (
    <>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/campaigns" element={<CampaignsPage />} />
      <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
      <Route path="/campaigns/:campaignId/characters/create" element={<CharacterCreationWizardPage />} />
      <Route path="/campaigns/:campaignId/encounters" element={<EncounterPrepPage />} />
      <Route path="/campaigns/:campaignId/ai-tools" element={<AIToolsPage />} />
      <Route path="/sessions" element={<SessionsPage />} />
      <Route path="/characters" element={<CharactersPage />} />
      <Route path="/characters/:id" element={<CharacterDetailPage />} />
      <Route path="/world" element={<WorldPage />} />
      <Route path="/notebook" element={<NotebookPage />} />
      <Route path="/tools" element={<AIToolsPage />} />
      <Route path="/enemies" element={<EnemyLibraryPage />} />
      <Route path="/enemies/:id" element={<EnemyDetailPage />} />
      <Route path="/credits" element={<CreditsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/rules" element={<SRDIndexPage />} />
      <Route path="/rules/:system" element={<SRDQuickStartPage />} />
      <Route path="/rules/:system/browse" element={<SRDSystemPage />} />
      <Route path="/rules/:system/browse/:category" element={<SRDSystemPage />} />
      <Route path="/rules/:system/:category/:entry" element={<SRDEntryPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
      <Route path="/admin/feedback/:id" element={<AdminFeedbackDetailPage feedbackId="" />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/billing" element={<AdminBillingPage />} />
      <Route path="/admin/billing/reconcile/:userId" element={<AdminReconcilePage userId="" />} />
      <Route path="/admin/sessions" element={<AdminSessionsPage />} />
      <Route path="/admin/sessions/:sessionId" element={<AdminSessionDetailPage sessionId="" />} />
      <Route path="/admin/analytics" element={<ClaudeAnalyticsPage />} />
      {/* Session route — SessionRunnerShellV2 renders its own full-screen layout */}
      <Route path="/campaigns/:campaignId/session" element={<SessionRunnerShellV2 />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </>
  );
}
