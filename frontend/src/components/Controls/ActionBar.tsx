import { useDraftStore } from '../../hooks/useDraft';

const PHASE_LABELS: Record<string, string> = {
  WAITING: 'WAITING FOR PLAYERS',
  BAN_1: 'BAN PHASE 1',
  PICK_1: 'PICK PHASE 1',
  BAN_2: 'BAN PHASE 2',
  PICK_2: 'PICK PHASE 2',
  COMPLETE: 'DRAFT COMPLETE',
};

interface ActionBarProps {
  selectedChampionId: string | null;
  onLockIn: (championId: string) => void;
}

export function ActionBar({ selectedChampionId, onLockIn }: ActionBarProps) {
  const draft = useDraftStore((s) => s.draft);
  const myTurn = useDraftStore((s) => s.isMyTurn)();
  const role = useDraftStore((s) => s.role);

  if (!draft) return null;

  const phase = draft.phase;
  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const isSpectator = role === 'spectator';
  const canLock = myTurn && selectedChampionId && phase !== 'WAITING' && phase !== 'COMPLETE';

  const currentSlot = draft.current_slot_index < draft.slots.length
    ? draft.slots[draft.current_slot_index]
    : null;
  const actionLabel = currentSlot?.action_type === 'ban' ? 'BAN' : 'LOCK IN';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Phase label */}
      <span className="font-display text-lg text-muted uppercase tracking-widest">
        {phaseLabel}
      </span>

      {/* Lock In button */}
      {!isSpectator && phase !== 'COMPLETE' && phase !== 'WAITING' && (
        <button
          disabled={!canLock}
          onClick={() => {
            if (selectedChampionId) onLockIn(selectedChampionId);
          }}
          className={`px-8 py-3 rounded font-display text-xl uppercase tracking-wider transition-all ${
            canLock
              ? 'bg-primary text-black hover:brightness-110 active:scale-95'
              : 'bg-draft-surface text-muted border border-draft-border cursor-not-allowed'
          }`}
        >
          {myTurn ? actionLabel : 'OPPONENT\'S TURN'}
        </button>
      )}

      {/* Spectator notice */}
      {isSpectator && phase !== 'COMPLETE' && (
        <span className="font-mono text-sm text-muted">Spectating</span>
      )}
    </div>
  );
}
