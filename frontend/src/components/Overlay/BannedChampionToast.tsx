import { useEffect, useState } from 'react';
import type { Side } from '../../types/draft';

interface BanEvent {
  championId: string;
  side: Side;
  key: number;
}

interface BannedChampionToastProps {
  patch: string | null;
}

function iconUrl(patch: string, championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${championId}.png`;
}

// Singleton event emitter for ban events
let banListener: ((event: BanEvent) => void) | null = null;
let banKey = 0;

export function emitBanEvent(championId: string, side: Side) {
  banKey += 1;
  banListener?.({ championId, side, key: banKey });
}

export function BannedChampionToast({ patch }: BannedChampionToastProps) {
  const [toast, setToast] = useState<BanEvent | null>(null);

  useEffect(() => {
    banListener = (event) => {
      setToast(event);
    };
    return () => {
      banListener = null;
    };
  }, []);

  // Auto-dismiss after 2 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast || !patch) return null;

  const sideColor = toast.side === 'blue' ? 'border-blue-side text-blue-side' : 'border-red-side text-red-side';

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50" key={toast.key}>
      <div className={`flex items-center gap-3 px-4 py-2 rounded-lg bg-draft-surface border ${sideColor} shadow-xl fade-in`}>
        <div className="relative w-10 h-10 rounded overflow-hidden">
          <img
            src={iconUrl(patch, toast.championId)}
            alt={toast.championId}
            className="w-full h-full object-cover grayscale"
          />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40">
            <line x1="6" y1="6" x2="34" y2="34" stroke="#DC2626" strokeWidth="3" />
            <line x1="34" y1="6" x2="6" y2="34" stroke="#DC2626" strokeWidth="3" />
          </svg>
        </div>
        <div>
          <span className="font-display text-lg text-white uppercase">{toast.championId}</span>
          <span className="font-mono text-xs text-red-side ml-2">BANNED</span>
        </div>
      </div>
    </div>
  );
}
