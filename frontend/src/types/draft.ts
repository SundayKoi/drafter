export type Side = 'blue' | 'red';
export type ActionType = 'ban' | 'pick';
export type DraftPhase = 'WAITING' | 'BAN_1' | 'PICK_1' | 'BAN_2' | 'PICK_2' | 'COMPLETE';

export interface SlotState {
  slot_index: number;
  side: Side;
  action_type: ActionType;
  champion_id: string | null;
  locked: boolean;
}

export interface DraftState {
  game_id: string;
  series_id: string;
  game_number: number;
  phase: DraftPhase;
  current_slot_index: number;
  slots: SlotState[];
  first_pick_side: Side;
  blue_ready: boolean;
  red_ready: boolean;
  timer_seconds_remaining: number;
  fearless_pool: string[];
  fearless_mode: boolean;
}
