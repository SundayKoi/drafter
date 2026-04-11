import { create } from 'zustand';
import type { Side } from '../types/draft';
import type { GameSummary, SeriesFormat, SeriesState } from '../types/series';

interface SeriesStore {
  series: SeriesState | null;
  gameComplete: { gameNumber: number; winner: Side } | null;
  seriesComplete: { winner: Side; blueScore: number; redScore: number } | null;

  setSeries: (series: SeriesState) => void;
  setGameComplete: (gameNumber: number, winner: Side) => void;
  setSeriesComplete: (winner: Side, blueScore: number, redScore: number) => void;
  clearOverlays: () => void;
  reset: () => void;

  // Derived selectors
  format: () => SeriesFormat | null;
  blueScore: () => number;
  redScore: () => number;
  fearlessPool: () => string[];
  isSeriesOver: () => boolean;
  completedGames: () => GameSummary[];
  currentGameNumber: () => number;
}

export const useSeriesStore = create<SeriesStore>((set, get) => ({
  series: null,
  gameComplete: null,
  seriesComplete: null,

  setSeries: (series) => set({ series }),

  setGameComplete: (gameNumber, winner) =>
    set({ gameComplete: { gameNumber, winner } }),

  setSeriesComplete: (winner, blueScore, redScore) =>
    set({ seriesComplete: { winner, blueScore, redScore } }),

  clearOverlays: () => set({ gameComplete: null, seriesComplete: null }),

  reset: () => set({
    series: null,
    gameComplete: null,
    seriesComplete: null,
  }),

  format: () => get().series?.format ?? null,
  blueScore: () => get().series?.blue_score ?? 0,
  redScore: () => get().series?.red_score ?? 0,
  fearlessPool: () => get().series?.fearless_pool ?? [],
  isSeriesOver: () => get().series?.status === 'complete',

  completedGames: () => {
    const { series } = get();
    if (!series) return [];
    return series.games.filter((g) => g.winner !== null);
  },

  currentGameNumber: () => get().series?.current_game_number ?? 1,
}));
