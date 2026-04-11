import { useEffect, useState } from 'react';
import type { Side } from '../../types/draft';

interface SideCoinFlipProps {
  firstPickSide: Side;
  onComplete: () => void;
}

export function SideCoinFlip({ firstPickSide, onComplete }: SideCoinFlipProps) {
  const [phase, setPhase] = useState<'flipping' | 'reveal'>('flipping');

  useEffect(() => {
    // Show flipping animation for 1.5s, then reveal for 2s
    const flipTimer = setTimeout(() => setPhase('reveal'), 1500);
    const doneTimer = setTimeout(onComplete, 3500);
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const sideColor = firstPickSide === 'blue' ? 'text-blue-side' : 'text-red-side';
  const sideBg = firstPickSide === 'blue' ? 'bg-blue-side/20' : 'bg-red-side/20';
  const sideBorder = firstPickSide === 'blue' ? 'border-blue-side' : 'border-red-side';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 fade-in">
        {phase === 'flipping' ? (
          <>
            {/* Animated coin */}
            <div className="w-24 h-24 rounded-full border-4 border-gold bg-draft-surface flex items-center justify-center animate-spin">
              <span className="font-display text-3xl text-gold">?</span>
            </div>
            <span className="font-display text-2xl text-muted uppercase tracking-widest">
              Flipping...
            </span>
          </>
        ) : (
          <>
            {/* Reveal */}
            <div className={`w-28 h-28 rounded-full border-4 ${sideBorder} ${sideBg} flex items-center justify-center fade-in`}>
              <span className={`font-display text-4xl ${sideColor} uppercase`}>
                {firstPickSide === 'blue' ? 'B' : 'R'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 fade-in">
              <span className={`font-display text-3xl uppercase tracking-wider ${sideColor}`}>
                {firstPickSide === 'blue' ? 'Blue' : 'Red'} Side
              </span>
              <span className="font-display text-xl text-gold uppercase tracking-widest">
                First Pick
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
