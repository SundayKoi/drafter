import { useState } from 'react';
import type { Side } from '../../types/draft';

interface SeriesControlsProps {
  onReportWinner: (winner: Side) => void;
  onStartNextGame: (firstPickSide: Side, swapSides: boolean) => void;
  draftComplete: boolean;
  gameReported: boolean;
  seriesOver: boolean;
  isSpectator: boolean;
  blueTeamName: string | null;
  redTeamName: string | null;
}

export function SeriesControls({
  onReportWinner,
  onStartNextGame,
  draftComplete,
  gameReported,
  seriesOver,
  isSpectator,
  blueTeamName,
  redTeamName,
}: SeriesControlsProps) {
  const [swapSides, setSwapSides] = useState(false);
  const [firstPick, setFirstPick] = useState<Side | null>(null);

  if (isSpectator || !draftComplete) return null;

  const blueName = blueTeamName ?? 'Blue';
  const redName = redTeamName ?? 'Red';

  // After swap: who's on blue side, who's on red
  const nextBlue = swapSides ? redName : blueName;
  const nextRed = swapSides ? blueName : redName;

  if (gameReported && !seriesOver) {
    return (
      <div className="flex flex-col items-center gap-5 p-5 rounded bg-draft-surface border border-draft-border w-full max-w-md">
        <span className="font-display text-lg text-white uppercase tracking-wider">
          Next Game Setup
        </span>

        {/* Side assignment */}
        <div className="flex flex-col items-center gap-2 w-full">
          <span className="font-display text-sm text-muted uppercase tracking-wider">
            Side Assignment
          </span>
          <div className="flex items-center gap-3 w-full justify-center">
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="font-mono text-[10px] text-blue-side uppercase">Blue Side</span>
              <span className="font-display text-lg text-white">{nextBlue}</span>
            </div>

            <button
              onClick={() => setSwapSides(!swapSides)}
              className={`px-3 py-2 rounded font-display text-xs uppercase tracking-wider transition-all ${
                swapSides
                  ? 'bg-primary text-black'
                  : 'bg-draft-bg border border-draft-border text-muted hover:text-white'
              }`}
              title="Swap sides"
            >
              &#8644; Swap
            </button>

            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="font-mono text-[10px] text-red-side uppercase">Red Side</span>
              <span className="font-display text-lg text-white">{nextRed}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-draft-border" />

        {/* First pick */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-display text-sm text-muted uppercase tracking-wider">
            First Pick
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setFirstPick('blue')}
              className={`px-5 py-2 rounded font-display text-sm uppercase transition-colors ${
                firstPick === 'blue'
                  ? 'bg-blue-side text-white'
                  : 'bg-blue-side/20 text-blue-side border border-blue-side/40 hover:bg-blue-side/30'
              }`}
            >
              {nextBlue}
            </button>
            <button
              onClick={() => setFirstPick('red')}
              className={`px-5 py-2 rounded font-display text-sm uppercase transition-colors ${
                firstPick === 'red'
                  ? 'bg-red-side text-white'
                  : 'bg-red-side/20 text-red-side border border-red-side/40 hover:bg-red-side/30'
              }`}
            >
              {nextRed}
            </button>
          </div>
        </div>

        {/* Start button */}
        <button
          disabled={!firstPick}
          onClick={() => {
            if (firstPick) {
              onStartNextGame(firstPick, swapSides);
              setFirstPick(null);
              setSwapSides(false);
            }
          }}
          className={`w-full px-8 py-3 rounded font-display text-xl uppercase tracking-wider transition-all ${
            firstPick
              ? 'bg-primary text-black hover:brightness-110 active:scale-95'
              : 'bg-draft-border text-muted cursor-not-allowed'
          }`}
        >
          Start Game
        </button>
      </div>
    );
  }

  if (seriesOver) return null;

  return (
    <div className="flex flex-col items-center gap-4 p-4 rounded bg-draft-surface border border-draft-border">
      <span className="font-display text-lg text-white uppercase tracking-wider">
        Who won this game?
      </span>

      <div className="flex gap-4">
        <button
          onClick={() => onReportWinner('blue')}
          className="px-6 py-2 rounded font-display text-lg uppercase bg-blue-side/20 text-blue-side border border-blue-side/40 hover:bg-blue-side/30 transition-colors"
        >
          {blueName} Wins
        </button>
        <button
          onClick={() => onReportWinner('red')}
          className="px-6 py-2 rounded font-display text-lg uppercase bg-red-side/20 text-red-side border border-red-side/40 hover:bg-red-side/30 transition-colors"
        >
          {redName} Wins
        </button>
      </div>
    </div>
  );
}
