import type { ActionType, DraftState, Side } from '../types/draft';

export interface SlotDef {
  side: Side;
  action_type: ActionType;
}

const ABSTRACT_ORDER: Array<['fp' | 'sp', ActionType]> = [
  ['fp','ban'],['sp','ban'],['fp','ban'],['sp','ban'],['fp','ban'],['sp','ban'],
  ['fp','pick'],['sp','pick'],['sp','pick'],['fp','pick'],['fp','pick'],['sp','pick'],
  ['sp','ban'],['fp','ban'],['sp','ban'],['fp','ban'],
  ['sp','pick'],['fp','pick'],['fp','pick'],['sp','pick'],
];

export function generateDraftOrder(firstPickSide: Side): SlotDef[] {
  const sp: Side = firstPickSide === 'blue' ? 'red' : 'blue';
  return ABSTRACT_ORDER.map(([role, action]) => ({
    side: role === 'fp' ? firstPickSide : sp,
    action_type: action,
  }));
}

export function isMyTurn(state: DraftState, myRole: 'blue' | 'red' | 'spectator'): boolean {
  if (myRole === 'spectator' || state.phase === 'WAITING' || state.phase === 'COMPLETE') return false;
  const slot = state.slots[state.current_slot_index];
  if (!slot) return false;
  return slot.side === myRole;
}
