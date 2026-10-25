import { Routes, Route , Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Crew from './pages/Crew';
import Cast from './pages/Cast';
import Scenes from './pages/Scenes';
import Budget from './pages/Budget';
import FilmAssets from './pages/FilmAssets';
import ActivityFeed from './pages/ActivityFeed';
import AIInsights from './pages/AIInsights';
import GenAI from './pages/GenAI';
import Inbox from './pages/Inbox';
import Billing from './pages/Billing';
import StudioPage from './pages/StudioPage';
import Security from './pages/Security';
import SecurityCenterPage from './pages/SecurityCenterPage';
import ProductionWiki from './pages/ProductionWiki';
import Settings from './pages/Settings';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import AccountRecovery from './pages/AccountRecovery';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SecurityProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/crew-login" element={<Login requiredRole="CREW" />} />
              <Route path="/admin-login" element={<Login requiredRole="SUPERUSER" />} />
              <Route path="/register" element={<Register />} />
              <Route path="/account-recovery" element={<AccountRecovery />} />
              <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/crew" element={<Crew />} />
                <Route path="/cast" element={<Cast />} />
                <Route path="/scenes" element={<Scenes />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/assets" element={<FilmAssets />} />
                <Route path="/activity" element={<ActivityFeed />} />
                <Route path="/ai" element={<AIInsights />} />
                <Route path="/genai" element={<GenAI />} />
                <Route path="/genai/:featureId" element={<StudioPage />} />
                <Route path="/studio" element={<StudioPage />} />
                <Route path="/security" element={<Security />} />
                <Route path="/security-center" element={<SecurityCenterPage />} />
                <Route path="/wiki" element={<ProductionWiki />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
              </Route>
              <Route path="/projects" element={<Navigate to="/scenes" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SecurityProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}