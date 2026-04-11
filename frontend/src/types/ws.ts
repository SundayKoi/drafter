import type { DraftState, Side } from './draft';
import type { SeriesState } from './series';

// --- Client -> Server ---

export type ClientMessage =
  | { type: 'READY' }
  | { type: 'HOVER'; payload: { champion_id: string } }
  | { type: 'LOCK_IN'; payload: { champion_id: string } }
  | { type: 'REPORT_WINNER'; payload: { winner: Side } }
  | { type: 'START_NEXT_GAME'; payload: { first_pick_override?: Side; swap_sides?: boolean } }
  | { type: 'PING' };

// --- Server -> Client ---

export interface SyncPayload {
  draft: DraftState;
  series: SeriesState;
}

export interface TimerTickPayload {
  seconds_remaining: number;
}

export interface HoverUpdatePayload {
  champion_id: string;
  side: Side;
}

export interface GameCompletePayload {
  game_number: number;
  winner: Side;
  series: SeriesState;
}

export interface SeriesCompletePayload {
  winner: Side;
  blue_score: number;
  red_score: number;
}

export interface NextGameStartingPayload {
  game_number: number;
  first_pick_side: Side;
  fearless_pool: string[];
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export type ServerMessage =
  | { type: 'SYNC'; payload: SyncPayload }
  | { type: 'TIMER_TICK'; payload: TimerTickPayload }
  | { type: 'HOVER_UPDATE'; payload: HoverUpdatePayload }
  | { type: 'SERIES_SYNC'; payload: SeriesState }
  | { type: 'GAME_COMPLETE'; payload: GameCompletePayload }
  | { type: 'SERIES_COMPLETE'; payload: SeriesCompletePayload }
  | { type: 'NEXT_GAME_STARTING'; payload: NextGameStartingPayload }
  | { type: 'ERROR'; payload: ErrorPayload }
  | { type: 'PONG' };
