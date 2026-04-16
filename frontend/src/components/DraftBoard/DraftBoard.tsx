import { useDraftStore } from '../../hooks/useDraft';
import { useSeriesStore } from '../../hooks/useSeries';
import { TeamColumn } from './TeamColumn';

interface DraftBoardProps {
  patch: string | null;
  centerContent?: React.ReactNode;
  previewChampionId?: string | null;
}

export function DraftBoard({ patch, centerContent, previewChampionId }: DraftBoardProps) {
  const draft = useDraftStore((s) => s.draft);
  const series = useSeriesStore((s) => s.series);

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-mono text-muted text-sm">Waiting for draft data...</span>
      </div>
    );
  }

  // Determine which side the current slot belongs to
  const currentSlot = draft.current_slot_index < draft.slots.length
    ? draft.slots[draft.current_slot_index]
    : null;
  const activeSide = currentSlot?.side ?? null;

  return (
    <div className="flex items-start justify-center gap-6 w-full max-w-[1800px] mx-auto px-4 draft-texture">
      {/* Blue side — always left */}
      <TeamColumn
        side="blue"
        slots={draft.slots}
        currentSlotIndex={draft.current_slot_index}
        teamName={series?.blue_team_name ?? null}
        patch={patch}
        previewChampionId={activeSide === 'blue' ? previewChampionId : null}
      />

      {/* Center panel */}
      <div className="flex flex-col items-center gap-4 flex-1 min-w-0">
        {centerContent}
      </div>

      {/* Red side — always right */}
      <TeamColumn
        side="red"
        slots={draft.slots}
        currentSlotIndex={draft.current_slot_index}
        teamName={series?.red_team_name ?? null}
        patch={patch}
        previewChampionId={activeSide === 'red' ? previewChampionId : null}
      />
    </div>
  );
}
