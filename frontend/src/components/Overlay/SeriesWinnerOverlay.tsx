import type { Side } from '../../types/draft';
import { BRAND } from '../../constants/brand';

interface SeriesWinnerOverlayProps {
  winner: Side;
  blueScore: number;
  redScore: number;
  blueTeamName: string | null;
  redTeamName: string | null;
  onDismiss: () => void;
}

export function SeriesWinnerOverlay({
  winner,
  blueScore,
  redScore,
  blueTeamName,
  redTeamName,
  onDismiss,
}: SeriesWinnerOverlayProps) {
  const winnerName = winner === 'blue'
    ? (blueTeamName ?? 'Blue Side')
    : (redTeamName ?? 'Red Side');
  const sideColor = winner === 'blue' ? 'text-blue-side' : 'text-red-side';
  const glowClass = winner === 'blue' ? 'glow-blue' : 'glow-red';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 fade-in">
        {/* Trophy icon */}
        <div className={`w-20 h-20 rounded-full border-4 border-gold bg-draft-surface flex items-center justify-center ${glowClass}`}>
          <svg className="w-10 h-10 text-gold" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3h14v2h-1v1a7 7 0 01-3.17 5.85L12 13.5l-2.83-1.65A7 7 0 016 6V5H5V3zm2 2v1a5 5 0 002.26 4.18L12 11.87l2.74-1.69A5 5 0 0017 6V5H7zM3 5h2v2H3V5zm16 0h2v2h-2V5zM9 17h6v2H9v-2zm-1 4h8v2H8v-2z" />
          </svg>
        </div>

        <span className="font-mono text-sm text-gold uppercase tracking-widest">
          Series Complete
        </span>

        <h1 className={`font-display text-5xl md:text-7xl uppercase tracking-wider ${sideColor}`}>
          {winnerName}
        </h1>

        <span className="font-display text-3xl text-gold uppercase tracking-widest">
          Wins The Series
        </span>

        {/* Score */}
        <div className="flex items-center gap-4 mt-2">
          <span className="font-display text-4xl text-blue-side tabular-nums">{blueScore}</span>
          <span className="font-display text-2xl text-muted">&ndash;</span>
          <span className="font-display text-4xl text-red-side tabular-nums">{redScore}</span>
        </div>

        {/* Branding */}
        <div className="flex items-center gap-2 mt-4 opacity-50">
          {BRAND.logoUrl && <img src={BRAND.logoUrl} alt={BRAND.name} className="h-5 w-auto" />}
          <span className="font-mono text-[10px] text-muted">{BRAND.siteName}</span>
        </div>

        <button
          onClick={onDismiss}
          className="mt-4 px-6 py-2 rounded font-display text-sm uppercase tracking-wider bg-draft-surface border border-draft-border text-muted hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
