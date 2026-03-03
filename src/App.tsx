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
import SRDIndexPage from './pages/srd/SRDIndexPage';
import SRDQuickStartPage from './pages/srd/SRDQuickStartPage';
import SRDSystemPage from './pages/srd/SRDSystemPage';
import SRDEntryPage from './pages/srd/SRDEntryPage';
import { LegalPage } from './pages/LegalPage';
import { TermsOfServicePage } from './pages/legal/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { AppRoutes } from './routes';

function renderSRDRoutes() {
  return (
    <>
      <Route path="/srd" element={<SRDIndexPage />} />
      <Route path="/srd/:system" element={<SRDQuickStartPage />} />
      <Route path="/srd/:system/browse" element={<SRDSystemPage />} />
      <Route path="/srd/:system/browse/:category" element={<SRDSystemPage />} />
      <Route path="/srd/:system/:category/:entry" element={<SRDEntryPage />} />
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
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
