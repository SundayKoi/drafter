import { useEffect, useState } from 'react';
import type { Side } from '../../types/draft';

interface GameCompleteOverlayProps {
  gameNumber: number;
  winner: Side;
  winnerTeamName: string;
  onDismiss: () => void;
}

export function GameCompleteOverlay({ gameNumber, winner, winnerTeamName, onDismiss }: GameCompleteOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  const sideColor = winner === 'blue' ? 'text-blue-side' : 'text-red-side';
  const glowColor = winner === 'blue'
    ? '0 0 60px rgba(37, 99, 235, 0.4)'
    : '0 0 60px rgba(220, 38, 38, 0.4)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 fade-in" style={{ filter: `drop-shadow(${glowColor})` }}>
        <span className="font-mono text-sm text-muted uppercase tracking-widest">
          Game {gameNumber}
        </span>
        <h1 className={`font-display text-6xl md:text-7xl uppercase tracking-wider ${sideColor}`}>
          {winnerTeamName} Wins
        </h1>
        <div className="w-24 h-0.5 bg-draft-border" />
        <span className="font-mono text-xs text-muted">
          Click anywhere or wait to continue...
        </span>
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss(); }}
        className="absolute inset-0 cursor-default"
        aria-label="Dismiss"
      />
    </div>
  );
}
