from app.models.draft import DraftPhase, DraftState


class DraftValidationError(Exception):
    def __init__(self, message: str, code: str = "INVALID_ACTION"):
        self.message = message
        self.code = code
        super().__init__(message)


def compute_phase(slot_index: int) -> DraftPhase:
    """Map a 0-based slot index to its draft phase.

    Slots 0–5:   BAN_1  (6 bans)
    Slots 6–11:  PICK_1 (6 picks)
    Slots 12–15: BAN_2  (4 bans)
    Slots 16–19: PICK_2 (4 picks)
    Slot 20:     COMPLETE
    """
    if slot_index < 6:
        return DraftPhase.BAN_1
    if slot_index < 12:
        return DraftPhase.PICK_1
    if slot_index < 16:
        return DraftPhase.BAN_2
    if slot_index < 20:
        return DraftPhase.PICK_2
    return DraftPhase.COMPLETE


def apply_action(
    state: DraftState,
    champion_id: str,
    acting_side: str,
    fearless_pool: set[str] = frozenset(),
) -> DraftState:
    """
    Pure function. Returns new DraftState.
    Raises DraftValidationError on any invalid move.
    Never mutates input state.
    """
    if state.phase == DraftPhase.COMPLETE:
        raise DraftValidationError("Draft is already complete", "DRAFT_COMPLETE")

    if state.current_slot_index >= len(state.slots):
        raise DraftValidationError("No more slots available", "NO_SLOTS")

    current_slot = state.slots[state.current_slot_index]

    if current_slot.side != acting_side:
        raise DraftValidationError(f"Not {acting_side}'s turn", "WRONG_TURN")

    # Champion already used in this draft?
    used = {s.champion_id for s in state.slots if s.locked and s.champion_id}
    if champion_id in used:
        raise DraftValidationError(f"{champion_id} already used", "ALREADY_USED")

    # Fearless check — picks only, not bans
    if current_slot.action_type == "pick" and champion_id in fearless_pool:
        raise DraftValidationError(
            f"{champion_id} already picked in this series",
            "FEARLESS_VIOLATION",
        )

    # Apply action — build new slots list without mutating
    new_slots = [s.model_copy() for s in state.slots]
    new_slots[state.current_slot_index] = current_slot.model_copy(
        update={"champion_id": champion_id, "locked": True}
    )

    next_index = state.current_slot_index + 1
    next_phase = DraftPhase.COMPLETE if next_index >= 20 else compute_phase(next_index)

    return state.model_copy(update={
        "slots": new_slots,
        "current_slot_index": next_index,
        "phase": next_phase,
    })
