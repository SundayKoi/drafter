import { Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DraftPage } from './pages/DraftPage';
import { SpectatorPage } from './pages/SpectatorPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/draft/:seriesId" element={<DraftPage />} />
      <Route path="/spectate/:seriesId" element={<SpectatorPage />} />
    </Routes>
  );
}
