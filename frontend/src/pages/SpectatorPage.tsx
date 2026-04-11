import { DraftPage } from './DraftPage';

/**
 * Spectator page uses the same DraftPage component.
 * Role is determined server-side by the token in the URL.
 */
export function SpectatorPage() {
  return <DraftPage />;
}
