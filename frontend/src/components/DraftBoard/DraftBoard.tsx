import { useDraftStore } from '../../hooks/useDraft';
import { useSeriesStore } from '../../hooks/useSeries';
import { TeamColumn } from './TeamColumn';

interface DraftBoardProps {
  patch: string | null;
  centerContent?: React.ReactNode;
}

export function DraftBoard({ patch, centerContent }: DraftBoardProps) {
  const draft = useDraftStore((s) => s.draft);
  const series = useSeriesStore((s) => s.series);

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-mono text-muted text-sm">Waiting for draft data...</span>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center gap-6 w-full max-w-6xl mx-auto px-4 draft-texture">
      {/* Blue side — always left */}
      <TeamColumn
        side="blue"
        slots={draft.slots}
        currentSlotIndex={draft.current_slot_index}
        teamName={series?.blue_team_name ?? null}
        patch={patch}
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
      />
    </div>
  );
}
