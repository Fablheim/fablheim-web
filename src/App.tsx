import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { JoinByCodePage } from './pages/JoinByCodePage';
import { JoinByEmailPage } from './pages/JoinByEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import HowItWorksPage from './pages/HowItWorksPage';
import NewToTTRPGsPage from './pages/NewToTTRPGsPage';
import PricingPage from './pages/PricingPage';
import BlogIndexPage from './pages/BlogIndexPage';
import RoadmapPage from './pages/RoadmapPage';
import Dnd5ePage from './pages/systems/Dnd5ePage';
import Pathfinder2ePage from './pages/systems/Pathfinder2ePage';
import FateCorePage from './pages/systems/FateCorePage';
import DaggerheartPage from './pages/systems/DaggerheartPage';
import { LegalPage } from './pages/LegalPage';
import { TermsOfServicePage } from './pages/legal/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { AppRoutes } from './routes';
import NotFoundPage from './pages/NotFoundPage';

const SRDIndexPage = lazy(() => import('./pages/srd/SRDIndexPage'));
const SRDQuickStartPage = lazy(() => import('./pages/srd/SRDQuickStartPage'));
const SRDSystemPage = lazy(() => import('./pages/srd/SRDSystemPage'));
const SRDEntryPage = lazy(() => import('./pages/srd/SRDEntryPage'));

function renderSRDRoutes() {
  return (
    <>
      <Route path="/srd" element={<Suspense fallback={null}><SRDIndexPage /></Suspense>} />
      <Route path="/srd/:system" element={<Suspense fallback={null}><SRDQuickStartPage /></Suspense>} />
      <Route path="/srd/:system/browse" element={<Suspense fallback={null}><SRDSystemPage /></Suspense>} />
      <Route path="/srd/:system/browse/:category" element={<Suspense fallback={null}><SRDSystemPage /></Suspense>} />
      <Route path="/srd/:system/:category/:entry" element={<Suspense fallback={null}><SRDEntryPage /></Suspense>} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <Toaster richColors position="bottom-right" />
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/blog" element={<BlogIndexPage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/new-to-ttrpgs" element={<NewToTTRPGsPage />} />
      <Route path="/systems/dnd-5e" element={<Dnd5ePage />} />
      <Route path="/systems/pathfinder-2e" element={<Pathfinder2ePage />} />
      <Route path="/systems/fate-core" element={<FateCorePage />} />
      <Route path="/systems/daggerheart" element={<DaggerheartPage />} />
      <Route path="/legal" element={<LegalPage />} />
      <Route path="/legal/terms" element={<TermsOfServicePage />} />
      <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/join/:inviteCode" element={<JoinByCodePage />} />
      <Route path="/invites/:token" element={<JoinByEmailPage />} />

      {/* SRD viewer (public) */}
      {renderSRDRoutes()}

      {/* Protected routes (with sidebar) */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                {AppRoutes()}
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* 404 catch-all for unknown public routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
