import { Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DraftPage } from './pages/DraftPage';
import { SpectatorPage } from './pages/SpectatorPage';
import { HomePage } from './site/pages/HomePage';
import { NewsPostPage } from './site/pages/NewsPostPage';
import { RulesPage } from './site/pages/RulesPage';
import { LeagueInfoPage } from './site/pages/LeagueInfoPage';
import { LoginPage } from './site/pages/admin/LoginPage';
import { AdminLayout } from './site/pages/admin/AdminLayout';
import { DashboardPage } from './site/pages/admin/DashboardPage';
import { NewsManagerPage } from './site/pages/admin/NewsManagerPage';
import { PlayersManagerPage } from './site/pages/admin/PlayersManagerPage';
import { SettingsPage } from './site/pages/admin/SettingsPage';

export function App() {
  return (
    <Routes>
      {/* Main Ember Esports site */}
      <Route path="/" element={<HomePage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/league-info" element={<LeagueInfoPage />} />
      <Route path="/news/:slug" element={<NewsPostPage />} />

      {/* Admin panel (staff only) */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="news" element={<NewsManagerPage />} />
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
