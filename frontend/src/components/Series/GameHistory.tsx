import { useState } from 'react';
import type { GameSummary } from '../../types/series';

interface GameHistoryProps {
  games: GameSummary[];
  patch: string | null;
}

function iconUrl(patch: string, championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${championId}.png`;
}

export function GameHistory({ games, patch }: GameHistoryProps) {
  const completed = games.filter((g) => g.winner !== null);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (completed.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="font-display text-sm text-muted uppercase tracking-widest">
        Previous Games
      </span>

      {completed.map((game) => {
        const isOpen = expanded === game.game_number;
        const winnerColor = game.winner === 'blue' ? 'text-blue-side' : 'text-red-side';

        const bluePicks = game.draft_state?.slots.filter(
          (s) => s.side === 'blue' && s.action_type === 'pick' && s.champion_id
        ) ?? [];
        const redPicks = game.draft_state?.slots.filter(
          (s) => s.side === 'red' && s.action_type === 'pick' && s.champion_id
        ) ?? [];

        return (
          <div key={game.game_number} className="rounded border border-draft-border bg-draft-surface">
            {/* Header row — always visible */}
            <button
              onClick={() => setExpanded(isOpen ? null : game.game_number)}
              className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-draft-border/20 transition-colors"
            >
              <span className="font-mono text-xs text-white">
                Game {game.game_number}
              </span>
              <span className={`font-display text-sm uppercase ${winnerColor}`}>
                {game.winner === 'blue' ? 'Blue' : 'Red'} Win
              </span>
              <span className="text-muted text-xs">{isOpen ? '\u25B2' : '\u25BC'}</span>
            </button>

            {/* Expanded picks */}
            {isOpen && patch && (
              <div className="flex gap-4 px-3 pb-3">
                {/* Blue picks */}
                <div className="flex gap-1">
                  {bluePicks.map((s) => (
                    <img
                      key={s.slot_index}
                      src={iconUrl(patch, s.champion_id!)}
                      alt={s.champion_id!}
                      title={s.champion_id!}
                      className="w-8 h-8 rounded border border-blue-side/40"
                    />
                  ))}
                </div>

                <span className="text-muted font-mono text-xs self-center">vs</span>

                {/* Red picks */}
                <div className="flex gap-1">
                  {redPicks.map((s) => (
                    <img
                      key={s.slot_index}
                      src={iconUrl(patch, s.champion_id!)}
                      alt={s.champion_id!}
                      title={s.champion_id!}
                      className="w-8 h-8 rounded border border-red-side/40"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
