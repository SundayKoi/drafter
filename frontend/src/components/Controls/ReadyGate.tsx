import { useDraftStore } from '../../hooks/useDraft';
import { useSeriesStore } from '../../hooks/useSeries';

interface ReadyGateProps {
  onReady: () => void;
}

export function ReadyGate({ onReady }: ReadyGateProps) {
  const draft = useDraftStore((s) => s.draft);
  const role = useDraftStore((s) => s.role);
  const series = useSeriesStore((s) => s.series);

  if (!draft || draft.phase !== 'WAITING') return null;

  const isSpectator = role === 'spectator';
  const iAmReady = role === 'blue' ? draft.blue_ready : role === 'red' ? draft.red_ready : false;
  const blueReady = draft.blue_ready;
  const redReady = draft.red_ready;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 rounded-lg bg-draft-surface border border-draft-border max-w-md">
        {/* Game info */}
        <div className="text-center">
          <h2 className="font-display text-3xl text-white uppercase tracking-wider">
            Game {draft.game_number}
          </h2>
          {series && (
            <p className="font-mono text-sm text-muted mt-1">
              {series.format.toUpperCase()} &middot;{' '}
              {draft.first_pick_side === 'blue' ? 'Blue' : 'Red'} picks first
              {series.fearless && ' \u00b7 Fearless'}
            </p>
          )}
        </div>

        {/* Ready status */}
        <div className="flex gap-8">
          <ReadyDot label="Blue" ready={blueReady} color="text-blue-side" />
          <ReadyDot label="Red" ready={redReady} color="text-red-side" />
        </div>

        {/* Ready button or waiting message */}
        {isSpectator ? (
          <span className="font-mono text-sm text-muted">
            Waiting for both captains to ready up...
          </span>
        ) : iAmReady ? (
          <span className="font-mono text-sm text-gold">
            Waiting for opponent...
          </span>
        ) : (
          <button
            onClick={onReady}
            className="px-8 py-3 rounded font-display text-xl uppercase tracking-wider bg-primary text-black hover:brightness-110 active:scale-95 transition-all"
          >
            Ready
          </button>
        )}
      </div>
    </div>
  );
}

function ReadyDot({ label, ready, color }: { label: string; ready: boolean; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-4 h-4 rounded-full border-2 transition-colors ${
          ready ? 'bg-green-500 border-green-500' : 'bg-transparent border-muted'
        }`}
      />
      <span className={`font-display text-sm uppercase ${color}`}>{label}</span>
      <span className="font-mono text-xs text-muted">{ready ? 'Ready' : 'Not ready'}</span>
    </div>
  );
}
