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
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AppRoutes } from './routes';

function App() {
  return (
    <>
    <Toaster richColors position="bottom-right" />
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/join/:inviteCode" element={<JoinByCodePage />} />
      <Route path="/invites/:token" element={<JoinByEmailPage />} />

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
    </>
  );
}

export default App;
