import { create } from 'zustand';
import type { DraftPhase, DraftState, Side, SlotState } from '../types/draft';

interface DraftStore {
  draft: DraftState | null;
  role: 'blue' | 'red' | 'spectator' | null;
  hoveredChampionId: string | null;
  hoveredSide: Side | null;
  timerSeconds: number;

  setDraft: (draft: DraftState) => void;
  setRole: (role: 'blue' | 'red' | 'spectator') => void;
  setHover: (championId: string | null, side: Side | null) => void;
  setTimer: (seconds: number) => void;
  reset: () => void;

  // Derived selectors
  currentSlot: () => SlotState | null;
  isMyTurn: () => boolean;
  phase: () => DraftPhase | null;
  usedChampionIds: () => Set<string>;
}

export const useDraftStore = create<DraftStore>((set, get) => ({
  draft: null,
  role: null,
  hoveredChampionId: null,
  hoveredSide: null,
  timerSeconds: 0,

  setDraft: (draft) => set({ draft, timerSeconds: draft.timer_seconds_remaining }),
  setRole: (role) => set({ role }),
  setHover: (championId, side) => set({ hoveredChampionId: championId, hoveredSide: side }),
  setTimer: (seconds) => set({ timerSeconds: seconds }),
  reset: () => set({
    draft: null,
    role: null,
    hoveredChampionId: null,
    hoveredSide: null,
    timerSeconds: 0,
  }),

  currentSlot: () => {
    const { draft } = get();
    if (!draft || draft.current_slot_index >= draft.slots.length) return null;
    return draft.slots[draft.current_slot_index] ?? null;
  },

  isMyTurn: () => {
    const { draft, role } = get();
    if (!draft || !role || role === 'spectator') return false;
    if (draft.phase === 'WAITING' || draft.phase === 'COMPLETE') return false;
    const slot = draft.slots[draft.current_slot_index];
    return slot?.side === role;
  },

  phase: () => {
    const { draft } = get();
    return draft?.phase ?? null;
  },

  usedChampionIds: () => {
    const { draft } = get();
    if (!draft) return new Set<string>();
    const used = new Set<string>();
    for (const slot of draft.slots) {
      if (slot.locked && slot.champion_id) {
        used.add(slot.champion_id);
      }
    }
    return used;
  },
}));
