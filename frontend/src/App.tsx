import { Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DraftPage } from './pages/DraftPage';
import { SpectatorPage } from './pages/SpectatorPage';
import { HomePage } from './site/pages/HomePage';
import { ScoresPage } from './site/pages/ScoresPage';
import { VodsPage } from './site/pages/VodsPage';
import { ApplyPage } from './site/pages/ApplyPage';
import { AboutPage } from './site/pages/AboutPage';
import { NewsPostPage } from './site/pages/NewsPostPage';
import { LoginPage } from './site/pages/admin/LoginPage';
import { AdminLayout } from './site/pages/admin/AdminLayout';
import { DashboardPage } from './site/pages/admin/DashboardPage';
import { ApplicationsPage } from './site/pages/admin/ApplicationsPage';
import { ScoresManagerPage } from './site/pages/admin/ScoresManagerPage';
import { NewsManagerPage } from './site/pages/admin/NewsManagerPage';
import { VodsManagerPage } from './site/pages/admin/VodsManagerPage';
import { PlayersManagerPage } from './site/pages/admin/PlayersManagerPage';
import { SettingsPage } from './site/pages/admin/SettingsPage';

export function App() {
  return (
    <Routes>
      {/* Main Ember Esports site */}
      <Route path="/" element={<HomePage />} />
      <Route path="/scores" element={<ScoresPage />} />
      <Route path="/vods" element={<VodsPage />} />
      <Route path="/apply" element={<ApplyPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/news/:slug" element={<NewsPostPage />} />

      {/* Admin panel (staff only) */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="scores" element={<ScoresManagerPage />} />
        <Route path="news" element={<NewsManagerPage />} />
        <Route path="vods" element={<VodsManagerPage />} />
        <Route path="players" element={<PlayersManagerPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Drafter tool — unchanged, now reachable at /drafter */}
      <Route path="/drafter" element={<LandingPage />} />
      <Route path="/draft/:seriesId" element={<DraftPage />} />
      <Route path="/spectate/:seriesId" element={<SpectatorPage />} />
    </Routes>
  );
}
