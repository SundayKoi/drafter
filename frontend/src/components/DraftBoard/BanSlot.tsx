import type { SlotState } from '../../types/draft';
import { ActiveIndicator } from './ActiveIndicator';

interface BanSlotProps {
  slot: SlotState;
  isActive: boolean;
  patch: string | null;
}

function championIconUrl(patch: string, championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${championId}.png`;
}

export function BanSlot({ slot, isActive, patch }: BanSlotProps) {
  const filled = slot.locked && slot.champion_id;

  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      {isActive && <ActiveIndicator side={slot.side} />}
      <div
        className={`w-full h-full rounded border ${
          filled ? 'border-draft-border bg-draft-surface' : 'border-dashed border-draft-border bg-draft-bg'
        } flex items-center justify-center overflow-hidden`}
      >
        {filled && patch ? (
          <div className="relative w-full h-full fade-in">
            <img
              src={championIconUrl(patch, slot.champion_id!)}
              alt={slot.champion_id!}
              title={slot.champion_id!}
              className="w-full h-full object-cover grayscale"
            />
            {/* Red X overlay */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 48 48"
            >
              <line x1="8" y1="8" x2="40" y2="40" stroke="#DC2626" strokeWidth="3" />
              <line x1="40" y1="8" x2="8" y2="40" stroke="#DC2626" strokeWidth="3" />
            </svg>
          </div>
        ) : slot.locked ? (
          <span className="text-muted text-xs font-mono">&mdash;</span>
        ) : (
          <span className="text-draft-border text-lg">&times;</span>
        )}
      </div>
    </div>
  );
}
