import type { DraftState, Side } from './draft';

export type SeriesFormat = 'bo1' | 'bo3' | 'bo5';

export interface GameSummary {
  game_number: number;
  winner: Side | null;
  first_pick_side: Side;
  draft_state: DraftState | null;
}

export interface SeriesState {
  series_id: string;
  format: SeriesFormat;
  fearless: boolean;
  current_game_number: number;
  max_games: number;
  games_needed_to_win: number;
  blue_score: number;
  red_score: number;
  blue_team_name: string | null;
  red_team_name: string | null;
  status: 'pending' | 'in_progress' | 'complete';
  timer_seconds: number;
  games: GameSummary[];
  fearless_pool: string[];
  current_draft: DraftState | null;
}

export interface SeriesConfig {
  name: string;
  format: SeriesFormat;
  fearless: boolean;
  patch: string;
  timer_seconds: number;
  game1_first_pick: 'blue' | 'red' | 'coin_flip';
  blue_team_name: string | null;
  red_team_name: string | null;
}

export interface CreateSeriesResponse {
  series_id: string;
  blue_url: string;
  red_url: string;
  spectator_url: string;
}
