import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import WeatherBackground from './components/weather/WeatherBackground';
import AuthModal from './components/auth/AuthModal';
import ToastContainer from './components/shared/ToastContainer';
import LoadingScreen from './components/shared/LoadingScreen';

// Lazy-loaded pages
const HomePage        = lazy(() => import('./pages/HomePage'));
const LibraryPage     = lazy(() => import('./pages/LibraryPage'));
const TitleDetailPage = lazy(() => import('./pages/TitleDetailPage'));
const ActorPage       = lazy(() => import('./pages/ActorPage'));
const StatsPage       = lazy(() => import('./pages/StatsPage'));
const WatchNowPage    = lazy(() => import('./pages/WatchNowPage'));
const WeeklyPage      = lazy(() => import('./pages/WeeklyPage'));
const ProfilePage     = lazy(() => import('./pages/ProfilePage'));
const DiscoverPage    = lazy(() => import('./pages/DiscoverPage'));
const WoshAshofPage   = lazy(() => import('./pages/WoshAshofPage'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const { loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen relative">
      {/* Cinematic animated background */}
      <WeatherBackground />

      {/* Main layout */}
      <div className="relative z-10">
        <Navbar onAuthClick={() => setAuthOpen(true)} />

        <Suspense fallback={<LoadingScreen />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/"               element={<HomePage onAuthClick={() => setAuthOpen(true)} />} />
              <Route path="/discover"       element={<DiscoverPage />} />
              <Route path="/title/:type/:id" element={<TitleDetailPage />} />
              <Route path="/actor/:id"      element={<ActorPage />} />
              <Route path="/library"        element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
              <Route path="/stats"          element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
              <Route path="/watch-now"      element={<ProtectedRoute><WatchNowPage /></ProtectedRoute>} />
              <Route path="/weekly"         element={<ProtectedRoute><WeeklyPage /></ProtectedRoute>} />
              <Route path="/profile"        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/wosh-ashof"    element={<WoshAshofPage />} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </AnimatePresence>

      {/* Global toast notifications */}
      <ToastContainer />
    </div>
  );
}

export default AppShell;
