import { lazy, Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { CampaignPageV2 } from './pages/CampaignPageV2';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { AdminRoute } from './components/AdminRoute';

// -- Lazy-loaded routes (code-split chunks) ----------------------------------

const WorldPage = lazy(() => import('./pages/WorldPage').then((m) => ({ default: m.WorldPage })));
const AIToolsPage = lazy(() => import('./pages/AIToolsPage').then((m) => ({ default: m.AIToolsPage })));
const NotebookPage = lazy(() => import('./pages/NotebookPage').then((m) => ({ default: m.NotebookPage })));
const CreditsPage = lazy(() => import('./pages/CreditsPage').then((m) => ({ default: m.CreditsPage })));
const CharacterCreationWizardPage = lazy(() => import('./pages/CharacterCreationWizardPage').then((m) => ({ default: m.CharacterCreationWizardPage })));
const EncounterPrepPage = lazy(() => import('./pages/EncounterPrepPage').then((m) => ({ default: m.EncounterPrepPage })));
const EnemyLibraryPage = lazy(() => import('./pages/EnemyLibraryPage').then((m) => ({ default: m.EnemyLibraryPage })));
const EnemyDetailPage = lazy(() => import('./pages/EnemyDetailPage').then((m) => ({ default: m.EnemyDetailPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then((m) => ({ default: m.FeedbackPage })));

// SRD pages
const SRDIndexPage = lazy(() => import('./pages/srd/SRDIndexPage'));
const SRDQuickStartPage = lazy(() => import('./pages/srd/SRDQuickStartPage'));
const SRDSystemPage = lazy(() => import('./pages/srd/SRDSystemPage'));
const SRDEntryPage = lazy(() => import('./pages/srd/SRDEntryPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminFeedbackPage = lazy(() => import('./pages/admin/AdminFeedbackPage').then((m) => ({ default: m.AdminFeedbackPage })));
const AdminFeedbackDetailPage = lazy(() => import('./pages/admin/AdminFeedbackDetailPage').then((m) => ({ default: m.AdminFeedbackDetailPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminBillingPage = lazy(() => import('./pages/admin/AdminBillingPage').then((m) => ({ default: m.AdminBillingPage })));
const AdminReconcilePage = lazy(() => import('./pages/admin/AdminReconcilePage').then((m) => ({ default: m.AdminReconcilePage })));
const AdminSessionsPage = lazy(() => import('./pages/admin/AdminSessionsPage').then((m) => ({ default: m.AdminSessionsPage })));
const AdminSessionDetailPage = lazy(() => import('./pages/admin/AdminSessionDetailPage').then((m) => ({ default: m.AdminSessionDetailPage })));
const ClaudeAnalyticsPage = lazy(() => import('./pages/admin/ClaudeAnalyticsPage').then((m) => ({ default: m.ClaudeAnalyticsPage })));

// Session runner (heaviest module)
const SessionRunnerShellV2 = lazy(() => import('./components/session/SessionRunnerShellV2'));

// -- Suspense wrapper --------------------------------------------------------

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>}>{children}</Suspense>;
}

// -- Routes ------------------------------------------------------------------

export function AppRoutes() {
  return (
    <>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/campaigns" element={<CampaignsPage />} />
      {/* V2 unified campaign shell — prep, live, recap all in one layout */}
      <Route path="/campaigns/:id" element={<CampaignPageV2 />} />
      {/* V1 escape hatches — old UI still accessible for reference */}
      <Route path="/v1/campaigns/:id" element={<CampaignDetailPage />} />
      <Route path="/campaigns/:campaignId/characters/create" element={<Lazy><CharacterCreationWizardPage /></Lazy>} />
      <Route path="/campaigns/:campaignId/encounters" element={<Lazy><EncounterPrepPage /></Lazy>} />
      <Route path="/campaigns/:campaignId/ai-tools" element={<Lazy><AIToolsPage /></Lazy>} />
      <Route path="/sessions" element={<SessionsPage />} />
      <Route path="/characters" element={<CharactersPage />} />
      <Route path="/characters/:id" element={<CharacterDetailPage />} />
      <Route path="/world" element={<Lazy><WorldPage /></Lazy>} />
      <Route path="/notebook" element={<Lazy><NotebookPage /></Lazy>} />
      <Route path="/tools" element={<Lazy><AIToolsPage /></Lazy>} />
      <Route path="/enemies" element={<Lazy><EnemyLibraryPage /></Lazy>} />
      <Route path="/enemies/:id" element={<Lazy><EnemyDetailPage /></Lazy>} />
      <Route path="/credits" element={<Lazy><CreditsPage /></Lazy>} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/feedback" element={<Lazy><FeedbackPage /></Lazy>} />
      <Route path="/rules" element={<Lazy><SRDIndexPage /></Lazy>} />
      <Route path="/rules/:system" element={<Lazy><SRDQuickStartPage /></Lazy>} />
      <Route path="/rules/:system/browse" element={<Lazy><SRDSystemPage /></Lazy>} />
      <Route path="/rules/:system/browse/:category" element={<Lazy><SRDSystemPage /></Lazy>} />
      <Route path="/rules/:system/:category/:entry" element={<Lazy><SRDEntryPage /></Lazy>} />
      <Route path="/admin" element={<AdminRoute><Lazy><AdminDashboardPage /></Lazy></AdminRoute>} />
      <Route path="/admin/feedback" element={<AdminRoute><Lazy><AdminFeedbackPage /></Lazy></AdminRoute>} />
      <Route path="/admin/feedback/:id" element={<AdminRoute><Lazy><AdminFeedbackDetailPage /></Lazy></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Lazy><AdminUsersPage /></Lazy></AdminRoute>} />
      <Route path="/admin/billing" element={<AdminRoute><Lazy><AdminBillingPage /></Lazy></AdminRoute>} />
      <Route path="/admin/billing/reconcile/:userId" element={<AdminRoute><Lazy><AdminReconcilePage /></Lazy></AdminRoute>} />
      <Route path="/admin/sessions" element={<AdminRoute><Lazy><AdminSessionsPage /></Lazy></AdminRoute>} />
      <Route path="/admin/sessions/:sessionId" element={<AdminRoute><Lazy><AdminSessionDetailPage /></Lazy></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><Lazy><ClaudeAnalyticsPage /></Lazy></AdminRoute>} />
      {/* V1 session route — old full-screen session runner, kept for reference */}
      <Route path="/v1/campaigns/:campaignId/session" element={<Lazy><SessionRunnerShellV2 /></Lazy>} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </>
  );
}
