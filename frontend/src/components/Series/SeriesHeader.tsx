import { useSeriesStore } from '../../hooks/useSeries';
import { useDraftStore } from '../../hooks/useDraft';

export function SeriesHeader() {
  const series = useSeriesStore((s) => s.series);
  const draft = useDraftStore((s) => s.draft);

  if (!series) return null;

  const formatLabel = series.format.toUpperCase();
  const blueName = series.blue_team_name ?? 'Blue';
  const redName = series.red_team_name ?? 'Red';
  const firstPick = draft?.first_pick_side;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Format + fearless badge */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-draft-surface border border-draft-border font-mono text-xs text-muted">
          {formatLabel}
        </span>
        {series.fearless && (
          <span className="px-2 py-0.5 rounded bg-fearless/30 border border-fearless font-mono text-xs text-fearless-text">
            FEARLESS
          </span>
        )}
      </div>

      {/* Score display */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="font-display text-lg uppercase text-blue-side tracking-wider">
            {blueName}
          </span>
          {firstPick === 'blue' && (
            <span className="font-mono text-[10px] text-gold">1ST PICK</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-display text-4xl text-blue-side tabular-nums">
            {series.blue_score}
          </span>
          <span className="font-display text-2xl text-muted">&ndash;</span>
          <span className="font-display text-4xl text-red-side tabular-nums">
            {series.red_score}
          </span>
        </div>

        <div className="flex flex-col items-start">
          <span className="font-display text-lg uppercase text-red-side tracking-wider">
            {redName}
          </span>
          {firstPick === 'red' && (
            <span className="font-mono text-[10px] text-gold">1ST PICK</span>
          )}
        </div>
      </div>

      {/* Game number */}
      <span className="font-mono text-xs text-muted">
        Game {series.current_game_number} of {series.max_games}
      </span>
    </div>
  );
}
