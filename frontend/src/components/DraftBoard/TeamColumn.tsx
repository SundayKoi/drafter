import type { Side, SlotState } from '../../types/draft';
import { BanSlot } from './BanSlot';
import { PickSlot } from './PickSlot';

interface TeamColumnProps {
  side: Side;
  slots: SlotState[];
  currentSlotIndex: number;
  teamName: string | null;
  patch: string | null;
  previewChampionId?: string | null;
}

const ROLE_LABELS = ['TOP', 'JG', 'MID', 'BOT', 'SUP'];

export function TeamColumn({ side, slots, currentSlotIndex, teamName, patch, previewChampionId }: TeamColumnProps) {
  const bans = slots.filter((s) => s.side === side && s.action_type === 'ban');
  const picks = slots.filter((s) => s.side === side && s.action_type === 'pick');
  const isBlue = side === 'blue';
  const sideColor = isBlue ? 'text-blue-side' : 'text-red-side';
  const borderColor = isBlue ? 'border-blue-side/30' : 'border-red-side/30';

  return (
    <div className={`flex flex-col gap-3 w-64 ${isBlue ? 'items-start' : 'items-end'}`}>
      {/* Team name */}
      <div className={`font-display text-xl uppercase tracking-wider ${sideColor}`}>
        {teamName ?? (isBlue ? 'Blue Side' : 'Red Side')}
      </div>

      {/* Ban row */}
      <div className={`flex gap-1.5 ${isBlue ? 'flex-row' : 'flex-row-reverse'}`}>
        {bans.map((slot) => (
          <BanSlot
            key={slot.slot_index}
            slot={slot}
            isActive={slot.slot_index === currentSlotIndex}
            patch={patch}
            previewChampionId={slot.slot_index === currentSlotIndex ? previewChampionId : null}
          />
        ))}
      </div>

      {/* Divider */}
      <div className={`w-full border-t ${borderColor}`} />

      {/* Pick slots */}
      <div className="flex flex-col gap-2 w-full">
        {picks.map((slot, i) => (
          <PickSlot
            key={slot.slot_index}
            slot={slot}
            isActive={slot.slot_index === currentSlotIndex}
            patch={patch}
            slotLabel={ROLE_LABELS[i]}
            previewChampionId={slot.slot_index === currentSlotIndex ? previewChampionId : null}
          />
        ))}
      </div>
    </div>
  );
}
