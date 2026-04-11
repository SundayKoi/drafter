import pytest

from app.logic.draft_engine import DraftValidationError, apply_action, compute_phase
from app.logic.draft_order import generate_draft_order
from app.models.draft import DraftPhase, DraftState, SlotState


def make_draft_state(
    first_pick_side: str = "blue",
    game_id: str = "test-g1",
    series_id: str = "test-s1",
) -> DraftState:
    """Create a fresh draft state at slot 0, phase BAN_1 (ready to go)."""
    order = generate_draft_order(first_pick_side)
    slots = [
        SlotState(slot_index=i, side=side, action_type=action)
        for i, (side, action) in enumerate(order)
    ]
    return DraftState(
        game_id=game_id,
        series_id=series_id,
        game_number=1,
        phase=DraftPhase.BAN_1,
        current_slot_index=0,
        slots=slots,
        first_pick_side=first_pick_side,
    )


def advance_to_slot(state: DraftState, target_slot: int) -> DraftState:
    """Apply actions to advance state to target_slot index."""
    for i in range(state.current_slot_index, target_slot):
        side = state.slots[i].side
        state = apply_action(state, f"champ_{i}", side)
    return state


# --- compute_phase ---


class TestComputePhase:
    def test_slots_0_to_5_are_ban_1(self):
        for i in range(0, 6):
            assert compute_phase(i) == DraftPhase.BAN_1

    def test_slots_6_to_11_are_pick_1(self):
        for i in range(6, 12):
            assert compute_phase(i) == DraftPhase.PICK_1

    def test_slots_12_to_15_are_ban_2(self):
        for i in range(12, 16):
            assert compute_phase(i) == DraftPhase.BAN_2

    def test_slots_16_to_19_are_pick_2(self):
        for i in range(16, 20):
            assert compute_phase(i) == DraftPhase.PICK_2

    def test_slot_20_is_complete(self):
        assert compute_phase(20) == DraftPhase.COMPLETE


# --- apply_action basic ---


class TestApplyActionBasic:
    def test_first_ban_blue_fp(self):
        state = make_draft_state("blue")
        new_state = apply_action(state, "Ahri", "blue")
        assert new_state.slots[0].champion_id == "Ahri"
        assert new_state.slots[0].locked is True
        assert new_state.current_slot_index == 1

    def test_first_ban_red_fp(self):
        state = make_draft_state("red")
        new_state = apply_action(state, "Zed", "red")
        assert new_state.slots[0].champion_id == "Zed"
        assert new_state.slots[0].locked is True
        assert new_state.current_slot_index == 1

    def test_does_not_mutate_original(self):
        state = make_draft_state("blue")
        new_state = apply_action(state, "Ahri", "blue")
        assert state.current_slot_index == 0
        assert state.slots[0].champion_id is None
        assert new_state.current_slot_index == 1

    def test_phase_advances_after_6_bans(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 6)
        assert state.phase == DraftPhase.PICK_1

    def test_phase_advances_to_ban_2(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 12)
        assert state.phase == DraftPhase.BAN_2

    def test_phase_advances_to_pick_2(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 16)
        assert state.phase == DraftPhase.PICK_2

    def test_full_draft_completes(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 20)
        assert state.phase == DraftPhase.COMPLETE
        assert state.current_slot_index == 20
        assert all(s.locked for s in state.slots)


# --- Validation errors ---


class TestApplyActionValidation:
    def test_wrong_turn_raises(self):
        state = make_draft_state("blue")
        with pytest.raises(DraftValidationError, match="Not red's turn") as exc_info:
            apply_action(state, "Ahri", "red")
        assert exc_info.value.code == "WRONG_TURN"

    def test_already_used_champion_raises(self):
        state = make_draft_state("blue")
        state = apply_action(state, "Ahri", "blue")
        # Slot 1 is red's ban
        with pytest.raises(DraftValidationError, match="already used") as exc_info:
            apply_action(state, "Ahri", "red")
        assert exc_info.value.code == "ALREADY_USED"

    def test_complete_draft_raises(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 20)
        with pytest.raises(DraftValidationError, match="already complete") as exc_info:
            apply_action(state, "Jinx", "blue")
        assert exc_info.value.code == "DRAFT_COMPLETE"

    def test_spectator_cannot_act(self):
        state = make_draft_state("blue")
        with pytest.raises(DraftValidationError) as exc_info:
            apply_action(state, "Ahri", "spectator")
        assert exc_info.value.code == "WRONG_TURN"


# --- Fearless ---


class TestApplyActionFearless:
    def test_fearless_blocks_pick(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 6)  # Now at first pick
        with pytest.raises(DraftValidationError, match="already picked") as exc_info:
            apply_action(state, "Jinx", "blue", fearless_pool={"Jinx"})
        assert exc_info.value.code == "FEARLESS_VIOLATION"

    def test_fearless_allows_ban(self):
        """Fearless-locked champions CAN still be banned."""
        state = make_draft_state("blue")
        # Slot 0 is blue ban
        new_state = apply_action(state, "Jinx", "blue", fearless_pool={"Jinx"})
        assert new_state.slots[0].champion_id == "Jinx"

    def test_fearless_empty_pool_no_effect(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 6)
        new_state = apply_action(state, "Jinx", "blue", fearless_pool=set())
        assert new_state.slots[6].champion_id == "Jinx"

    def test_fearless_different_champ_allowed(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 6)
        new_state = apply_action(state, "Caitlyn", "blue", fearless_pool={"Jinx"})
        assert new_state.slots[6].champion_id == "Caitlyn"


# --- Red first-pick ---


class TestRedFirstPick:
    def test_red_fp_first_action(self):
        state = make_draft_state("red")
        new_state = apply_action(state, "Yasuo", "red")
        assert new_state.slots[0].champion_id == "Yasuo"

    def test_red_fp_blue_wrong_turn_first(self):
        state = make_draft_state("red")
        with pytest.raises(DraftValidationError) as exc_info:
            apply_action(state, "Yasuo", "blue")
        assert exc_info.value.code == "WRONG_TURN"

    def test_red_fp_full_draft(self):
        state = make_draft_state("red")
        state = advance_to_slot(state, 20)
        assert state.phase == DraftPhase.COMPLETE
        assert all(s.locked for s in state.slots)


# --- Slot integrity ---


class TestSlotIntegrity:
    def test_all_20_slots_filled_after_complete(self):
        state = make_draft_state("blue")
        state = advance_to_slot(state, 20)
        for i, slot in enumerate(state.slots):
            assert slot.champion_id == f"champ_{i}"
            assert slot.locked is True

    def test_unlocked_slots_have_no_champion(self):
        state = make_draft_state("blue")
        state = apply_action(state, "Ahri", "blue")
        for slot in state.slots[1:]:
            assert slot.champion_id is None
            assert slot.locked is False
