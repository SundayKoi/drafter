import type { SlotState } from '../../types/draft';
import { ActiveIndicator } from './ActiveIndicator';

interface PickSlotProps {
  slot: SlotState;
  isActive: boolean;
  patch: string | null;
  slotLabel?: string;
  previewChampionId?: string | null;
}

function splashUrl(championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`;
}

export function PickSlot({ slot, isActive, slotLabel, previewChampionId }: PickSlotProps) {
  const filled = slot.locked && slot.champion_id;
  const showPreview = isActive && !filled && previewChampionId;
  const label = slotLabel ?? '';
  const activeGlow = isActive && !filled && !showPreview ? 'glow-gold' : '';

  return (
    <div className="relative w-full">
      {isActive && <ActiveIndicator side={slot.side} />}
      <div
        className={`relative w-full h-20 rounded border overflow-hidden transition-all duration-200 ${activeGlow} ${
          filled
            ? 'border-draft-border bg-draft-surface lock-flash'
            : showPreview
              ? 'border-gold/50 bg-draft-surface'
              : 'border-draft-border bg-draft-bg'
        }`}
      >
        {filled ? (
          <div className="fade-in w-full h-full">
            <img
              src={splashUrl(slot.champion_id!)}
              alt={slot.champion_id!}
              className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
            />
            {/* Side color accent strip */}
            <div
              className={`absolute top-0 ${slot.side === 'blue' ? 'left-0' : 'right-0'} w-1 h-full ${
                slot.side === 'blue' ? 'bg-blue-side' : 'bg-red-side'
              }`}
            />
            {/* Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-1.5">
              <span className="font-display text-sm text-white uppercase tracking-wide drop-shadow-lg">
                {slot.champion_id}
              </span>
            </div>
          </div>
        ) : showPreview ? (
          <div className="w-full h-full">
            <img
              src={splashUrl(previewChampionId)}
              alt={previewChampionId}
              className="absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-60"
            />
            <div
              className={`absolute top-0 ${slot.side === 'blue' ? 'left-0' : 'right-0'} w-1 h-full ${
                slot.side === 'blue' ? 'bg-blue-side/50' : 'bg-red-side/50'
              }`}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-1.5">
              <span className="font-display text-sm text-white/70 uppercase tracking-wide drop-shadow-lg">
                {previewChampionId}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="font-display text-draft-border/60 text-lg uppercase tracking-widest">
              {label || 'PICK'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
